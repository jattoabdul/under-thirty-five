const express = require("express"),
  http = require('http'),
  socketio = require('socket.io'),
  router = express.Router(),
  helmet = require('helmet'),
  hbs = require('hbs'),
  logger = require('morgan'),
  session = require('express-session'),
  cookieParser = require('cookie-parser'),
  bcrypt = require('bcrypt'),
  crypto = require('crypto'),
  path = require('path'),
  shortid = require('shortid'),
  config = require('./config.json'),
  fs = require('fs'),
  nodemailer = require('nodemailer'),
  smtpTransport = require("nodemailer-smtp-transport"),
  cloudinary = require('cloudinary'),
  fileParser = require('connect-multiparty')(),
  validator = require('validator'),
  mime = require("mime"),
  bodyParser = require('body-parser'),
  mongoose = require('mongoose'),
  _ = require('lodash'),
  app = express();

mongoose.Promise = global.Promise;

cloudinary.config({cloud_name: config.cloud_name, api_key: config.api_key, api_secret: config.api_secret});

const online_DB_uri = `mongodb://${config.db_user}:${config.db_pass}@ds143754.mlab.com:43754/under35`,
  local_DB_uri = `mongodb://localhost:27017/under35`;

mongoose.connect(local_DB_uri, {
  useMongoClient: true
}, (err, db) => {
  if (err) {
    console.log("Couldn't connect to database");
  } else {
    console.log("Database Connected!");
  }
});

// models
const Admin = require('./models/admin');
User = require('./models/user'),
Post = require('./models/post'),
Category = require('./models/category'),
Metadata = require('./models/metadata'),
Subscriber = require('./models/subscriber');

const GetPosts = () => {
  return Post
    .find({})
    .exec((err, data) => {
      if (err) {
        console.log(JSON.stringify(err, undefined, 2));
        return err;
      } else {
        return data;
      }
    });
};

const GetUserDetails = (email) => {
  return User
    .findOne({email})
    .lean()
    .exec((err, doc) => {
      if (err) {
        console.log(JSON.stringify(err, undefined, 2));
        return err;
      } else {
        return doc;
      }
    });
};

const FetchUsers = (lmt = 0) => {
  return User.find({}, 'fullname occupation local_government email profile_pic')
    .limit(lmt)
    .exec((err, data) => {
      if (!err) {
        return data;
      } else {
        console.log(JSON.stringify(err, null, 2));
        return err;
      }
    });
};

const fetchFollowed = (userID) => {
  return User.find({_id: userID}, 'following').populate('following').exec((err, data) => {
    if(!err) {
      console.log(JSON.stringify(data, null, 2));
      return(data)
    } else {
      console.log(JSON.stringify(err, null, 2));
      return err;
    }
  })
}

const FetchNewPosts = (lmt = 20) => {
  Post.aggregate([
    {
      "$match": {}
    }, {
      "$sort": {
        "updated_at": -1
      }
    }, {
      "$limit": lmt
    }, {
      "$lookup": {
        "localField": "author_id",
        "from": "users",
        "foreignField": "_id",
        "as": "authorinfo"
      }
    }, {
      "$unwind": "$authorinfo"
    }, {
      "$project": {
        "body": 1,
        "createdOn": 1,
        "updated_at": 1,
        "date": 1,
        "views": 1,
        "authorinfo.fullname": 1,
        "authorinfo.local_government": 1,
        "authorinfo.origin_state": 1,
        "authorinfo.profile_pic": 1
      }
    }
  ]).exec((err, doc) => {
    if (!err) {
      console.log(doc);
      return doc;
    } else {
      console.log(JSON.stringify(err, null, 2));
      return err;
    }
  });
};

/**
 * Get some user details
 * @param {String} email
 * @param {Array} selects
 * @return Promise of User Data
 */
const GetSomeUserDetails = (email, selects) => {
  let toPick = selects.join(' ');
  return User.findOne({email})
}

/**
 * generate a Picture profile link via gravatar
 * function accepts email, hash it(md5), then generate a gravatar link with it
 * @param {String} email
 * @return url or false if email supplied is invalid
 */
const generateProfilepicLink = (email) => {
  let hash = crypto
    .createHash('md5')
    .update(email)
    .digest('hex');
  if (validator.isEmail(email)) {
    return `https://www.gravatar.com/avatar/${hash}`;
  } else {
    return false;
  }
};

/**
 * Generate a clean alphanumeric key
 * @return {String} random key
 */
const generateKey = () => {
  let key = shortid.generate();
  while (!(validator.isAlphanumeric(key))) {
    key = shortid.generate();
  }
  return key;
};

/**
 * logout user
 * @param {Object} request
 * @param {Object} response
 * @param {function} callback
 */
let logout = (req, res, next) => {
  delete req.session.user
  req
    .session
    .destroy();
  // res.send("logout success!");
  res.redirect('/controls/login');
};

/**
 * Authenticate user
 * @param {Object} request
 * @param {Object} response
 * @param {function} callback
 */
let authorize = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
};

app.use(logger('dev'));
app.use(helmet());
app.disable('x-powered-by');
// app.use(passport.initialize()) app.use(passport.session())
app.use(cookieParser());
app.use(session({secret: 'iy98hcbh489n38984y4h498', resave: true, saveUninitialized: false}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
// app.set('serverPort', (process.env.PORT || 3030));
process.env.PWD = process.cwd();
app.use(express.static(path.join(process.env.PWD, 'public')));

hbs.registerPartials(path.join(process.env.PWD, 'views/partials'));
app.set('views', path.join(process.env.PWD, 'views'));
app.set('view engine', 'hbs');

hbs.registerHelper('getCurrentYear', () => {
  return new Date().getFullYear();
});

hbs.registerHelper('if_eq', function (a, b, opts) {
  if (a == b) // Or === depending on your needs
    return opts.fn(this);
  else 
    return opts.inverse(this);
  }
);

hbs.registerHelper('getPostTime', (timeT) => {
  return new Date(timeT).toDateString();
});

router.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/timeline')
  } else {
    res.render('index', {title: "Under35 | Home"});
  }
});

router.get('/login', (req, res) => {
  if (req.session.user) {
    res.redirect('/timeline');
  } else {
    res.render('login', {title: "Under35 | Sign in"});
  }
});

router.get('/register', (req, res) => {
  res.render('register', {title: "Under35 | Sign up"});
});

router.get('/forgot', (req, res) => {
  res.render('forgot_pass', {title: "Under35 | Password Help"});
});

// *****  public APIs  ******** &&&&&&&&&&&&&&&&&&&&&&&&&&&& login
router.post('/api/login', (req, res) => {
  // TODO: validate inputs here
  let credential = req
    .body
    .loginCred
    .toLowerCase();
  let password = req.body.password

  User.findOne({
    email: credential
  }, (err, data) => {
    if (err) {
      res
        .status(401)
        .send("there was an error authenticating you");
      console.log(JSON.stringify(err, null, 2));
    } else if (data && data !== null) {
      let pass = data.password;
      if (bcrypt.compareSync(password, pass)) {
        // console.log(JSON.stringify(data, null, 2));
        let user = {
          email: data.email,
          name: data.fullname,
          id: data._id,
          pic: data.profile_pic
        };
        console.log(user);
        req.session.user = user;
        req.session.user.expires = new Date(Date.now() + (3 * 24 * 3600 * 1000));
        User.findOneAndUpdate(data._id, {
          last_login: new Date().getTime()
        });
        res
          .status(200)
          .send("Welcome!");
      } else {
        res
          .status(401)
          .send("login details doesn't match");
      }
    } else {
      res
        .status(401)
        .send("invalid credentials");
    }
  });
});

// sign up
router.post('/api/signup', (req, res) => {
  let rcvData = req.body;

  let email = rcvData.mail || null;
  let gender = rcvData.gender || null;
  if (gender) {
    gender = gender.toLowerCase();
  }
  let phone_number = rcvData.phone || null;
  let age = rcvData.age || null;
  let current_address = rcvData.currentAddress || null;
  let origin_state = rcvData.originState || null;
  let origin_town = rcvData.originTown || null;
  let password = rcvData.password || null;

  if (email && gender && phone_number && age && current_address && origin_state && origin_town && password) {
    if (!(validator.isEmail(email))) {
      res
        .status(400)
        .send("You have supplied a badly formatted email");
    } else if (["male", "female"].indexOf(gender) < 0) {
      res
        .status(400)
        .send("chairman! you supplied an invalid gender, Stop messing with me!!!");
    } else if (!(validator.isNumeric(phone_number))) {
      res
        .status(400)
        .send("Your phone number is invalid");
    } else if (config.nigerian_states.indexOf(origin_state) < 0) {
      res
        .status(400)
        .send("Your state of origin is invalid");
    } else {
      const saltRounds = 5;
      const userpass = rcvData.password;

      bcrypt.hash(userpass, saltRounds, function (err, hash) {
        // Store hash in your password DB.
        let regData = {
          fullname: rcvData.fullname,
          email: rcvData.mail,
          gender: rcvData.gender,
          phone_number: rcvData.phone,
          age: rcvData.age,
          current_address: rcvData.currentAddress,
          origin_state: rcvData.originState,
          origin_town: rcvData.originTown,
          password: hash
        };

        newUser = new User(regData);

        newUser
          .save()
          .then(() => {
            res
              .status(200)
              .send('Welcome on board!');
          })
          .catch(err => {
            console.log(JSON.stringify(err, undefined, 2));
            res
              .status(412)
              .send("error creating user");
          });
      });
    }
  } else {
    res
      .status(400)
      .send("incomplete data sent for registration!");
  }
});

router.post('/api/forgot', (req, res) => {
  let resetData = req.body;
  let {email, phone} = resetData;
  if (email && phone) {
    if ((validator.isEmail(email)) && (validator.isNumeric(phone))) {
      User.findOne({
        email
      }, 'password phone_number fullname', (err, result) => {
        if (!err && result) {
          let userId = result._id;
          let firstname = result
            .fullname
            .split(' ')[0];
          if (phone == result.phone_number) {
            let passResetKey = generateKey();
            let userEmail = result.email;
            User.findByIdAndUpdate(userId, {
              passResetKey
            }, (err, rez) => {
              if (!err) {
                let transporter = nodemailer.createTransport({
                  // host: 'smtp.zoho.com', port: 465, secure: true, // use SSL auth: {   user:
                  // 'ohotu@coloured.com.ng',   pass: 'Flower10@@' }

                  service: "gmail",
                  port: 465,
                  auth: {
                    user: config.email.user,
                    pass: config.email.pass
                  }
                });

                let mailOptions = {
                  subject: `Under35 | Password reset`,
                  to: email,
                  from: `Under35 <newandroidohone@gmail.com>`,
                  html: `
                            <h1>Hi ${firstname}!</h1>
                            <h2>Here is your password reset key</h2>
                            <h2><code contenteditable="false" style="font-weight:200;font-size:1.5rem;padding:5px 10px; background: #EEEEEE; border:0">${passResetKey}</code></h4>
                        `
                };

                try {
                  transporter.sendMail(mailOptions, (error, response) => {
                    if (error) {
                      console.log("error:\n", error, "\n");
                      res
                        .status(500)
                        .send("could not sent reset code");
                    } else {
                      console.log("email sent:\n", response);
                      res
                        .status(200)
                        .send('Reset Code sent');
                    }
                  });
                } catch (error) {
                  console.log(error);
                  res
                    .status(500)
                    .send("could not sent reset code");
                }
              }
            });
          } else {
            res
              .status(400)
              .send("Phone number is incorrect");
            console.log("phone number doesnt match");
          }
        } else {
          res
            .status(400)
            .send("Email doesn't exist");
        }
      });
    }
  } else {
    res
      .status(200)
      .send("empty data sent");
  }
});

router.post('/api/change_password/', (req, res) => {
  let rcvData = req.body;
  let {email, newPass, code} = rcvData;
  if (!(validator.isEmail(email))) {
    res
      .status(400)
      .send('invalid Email sent');
  } else if (!(validator.isAlphanumeric(code))) {
    res
      .status(200)
      .send('you don\'t have to tamper with the reset code please');
  } else {
    User.findOne({
      email
    }, 'passResetKey', (err, rez) => {
      console.log(rez.passResetKey, code);
      if (!err) {
        if (rez.passResetKey === code) {
          const saltRounds = 5;
          bcrypt.hash(newPass, saltRounds, (error, hash) => {
            if (!error) {
              User.findOneAndUpdate({
                email
              }, {
                password: hash
              }, (err, result) => {
                if (!err) {

                  res
                    .status(200)
                    .send("Passsword reset successfull!");
                } else {
                  res
                    .status(500)
                    .send("Could not reset password");
                }
              });
            } else {
              res
                .status(500)
                .send("Could not reset password");
            }
          });
        } else {
          res
            .status(400)
            .send("incorrect code supplied");
        }
      } else {
        console.log(JSON.stringify(err, undefined, 2));
        res
          .status(500)
          .send("Server could not verify your reset code");
      }
    });
  }
})

router.post('/api/change_password/', (req, res) => {
  let rcvData = req.body;
  let {email, newPass, code} = rcvData;
  if (!(validator.isEmail(email))) {
    res
      .status(400)
      .send('invalid Email sent');
  } else if (!(validator.isAlphanumeric(code))) {
    res
      .status(200)
      .send('you don\'t have to tamper with the reset code please');
  } else {
    User.findOne({
      email
    }, 'passResetKey', (err, rez) => {
      console.log(rez.passResetKey, code);
      if (!err) {
        if (rez.passResetKey === code) {
          const saltRounds = 5;
          bcrypt.hash(newPass, saltRounds, (error, hash) => {
            if (!error) {
              User.findOneAndUpdate({
                email
              }, {
                password: hash
              }, (err, result) => {
                if (!err) {
                  res
                    .status(200)
                    .send("Passsword reset successfull!");
                } else {
                  res
                    .status(500)
                    .send("Could not reset password");
                }
              });
            } else {
              res
                .status(500)
                .send("Could not reset password");
            }
          });
        } else {
          res
            .status(400)
            .send("incorrect code supplied");
        }
      } else {
        console.log(JSON.stringify(err, undefined, 2));
        res
          .status(500)
          .send("Server could not verify your reset code");
      }
    });
  }
})

router.post('/api/check_reset_code', (req, res) => {
  let {code, email} = req.body;
  if (code && email) {
    if (!(validator.isEmail(email))) {
      res
        .status(400)
        .send('Email is invalid');
    } else if (!(validator.isAlphanumeric(code))) {
      res
        .status(400)
        .send('Oga! try again');
    } else {
      User.findOne({
        email
      }, 'passResetKey', (err, rez) => {
        if (code === rez.passResetKey) {
          res
            .status(200)
            .send(true);
        } else {
          res
            .status(400)
            .send(false);
        }
      })
    }
  } else {
    res
      .status(400)
      .send('Email and password must be supplied');
  }
})

router.post('/api/checkemailExistence', (req, res) => {
  if (req.body.query) {
    let email = req.body.query;
    if (validator.isEmail(email)) {
      User
        .find({email})
        .count()
        .exec((err, result) => {
          console.log("email:", email, "was queried for existence");
          if (result > 0) {
            res
              .status(200)
              .send(true);
          } else {
            res
              .status(200)
              .send(false);
          }
        });
    } else {
      res
        .status(400)
        .send("invalid query!");
    }
  }
})

// / authorization middleware
router.use((req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
});

app.get('/logout', logout);

// protected pages
router.get('/timeline', (req, res) => {
  let userInfo = req.session.user;
  Promise.all([
    GetUserDetails(userInfo.email),
    FetchNewPosts()
  ]).then(datas => {
    let userDetails = datas[0];
    let posts = datas[1];
    if (userDetails.followers) {
      userDetails.followersCount = userDetails.followers.length
    } else {
      userDetails.followersCount = 0;
    }
    if (!userDetails.no_of_queries) 
      userDetails.no_of_queries = 0;
    
    res.render('timeline', {
      title: "Under35 | Timeline",
      userDetails,
      posts
    })
  });
});

router.get('/profile', (req, res) => {
  let userInfo = req.session.user;
  Promise
    .all([GetUserDetails(userInfo.email)])
    .then(datas => {
      let userDetails = datas[0];
      if (userDetails.followers) {
        userDetails.followersCount = userDetails.followers.length
      } else {
        userDetails.followersCount = 0;
      }
      if (!userDetails.no_of_queries) 
        userDetails.no_of_queries = 0;
      
      res.render('profile', {
        title: "Under35 | Profile",
        userDetails
      })
    });
});

router.get('/followers', (req, res) => {
  let userInfo = req.session.user;
  Promise.all([
    GetUserDetails(userInfo.email),
    FetchUsers()
  ]).then(datas => {
    let userDetails = datas[0];
    let Users = datas[1];
    if (userDetails.followers) {
      userDetails.followersCount = userDetails.followers.length
    } else {
      userDetails.followersCount = 0;
    }
    if (!userDetails.no_of_queries) 
      userDetails.no_of_queries = 0;
    
    res.render('followers', {
      title: "Under35 | Followers",
      userDetails,
      Users
    });
  });
});

router.get('/edit_profile', (req, res) => {
  let userInfo = req.session.user;

  let userName = userInfo.name;
  let userEmail = userInfo.email;

  Promise
    .all([GetUserDetails(userEmail)])
    .then(datas => {
      let user_detail = datas[0];
      let {
        fullname,
        email,
        occupation,
        current_address,
        phone_number,
        origin_state,
        origin_town,
        local_government,
        party,
        fb_id,
        tw_id,
        gPlus_id,
        date_of_birth
      } = user_detail;

      res.render('edit_profile', {
        title: 'Edit Profile',
        details: user_detail
      });
    });
});

// protected APIs
router.patch('/api/edit_profile', (req, res) => {
  let {
    fullname,
    email,
    occupation,
    current_address,
    phone,
    state,
    town,
    local_gov,
    party,
    fb,
    gplus,
    tw,
    dob
  } = req.body;

  update = {};
  if (fullname) {
    update.fullname = fullname;
  }
  if (email && validator.isEmail(email)) {
    update.email = email;
  }
  if (occupation) {
    update.occupation = occupation;
  }
  if (current_address) {
    update.current_address = current_address;
  }
  if (phone) {
    update.phone_number = phone;
  }
  if (state) {
    update.origin_state = state;
  }
  if (town) {
    update.origin_town = town;
  }
  if (local_gov) {
    update.local_government = local_gov;
  }
  if (party) {
    update.party = party;
  }
  if (fb) {
    update.fb_id = fb;
  }
  if (gplus) {
    update.gPlus_id = gplus;
  }
  if (tw) {
    update.tw_id = tw;
  }
  if (dob) {
    update.date_of_birth = dob;
  }
  User.findOneAndUpdate({
    email
  }, update, (err, data) => {
    if (!err) {
      res
        .status(200)
        .send("Your data has been successfully updated!");
    } else {
      console.log(JSON.stringify(err, null, 2));
      res
        .status(500)
        .send("there was an error updating your data");
    }
  })
});
router.post('/api/profile', (req, res) => {
  let lmt = req.body.limit
  User.find({}, 'fullname occupation local_government email')
    .limit(lmt)
    .exec((err, data) => {
      res
        .status(200)
        .send(data);
    })
})
router.post('/api/writePost', (req, res) => {
  if (req.session.user) {
    var body = req.body.post;
    var email = req.session.user.email;
    var author_id = req.session.user.id;
    var user_pic = req.session.user.id;
    var postData = {
      body,
      author_id,
      createdOn: new Date().getTime()
    };
    console.log('newPost', JSON.stringify(postData, null, 2));

    let newPost = new Post(postData)
    newPost
      .save()
      .then(() => {
        console.log(req.session.user.name + ' has posted a new status');
        postData.author_pic = user_pic;
        io
          .sockets
          .emit('newPost', {postData});
        res
          .status(200)
          .send("Post successfully broadcasted");
      })
      .catch(err => {
        console.log("Post error:", JSON.stringify(err, null, 2));
        res
          .status(500)
          .send(err);
      });
  } else {
    res.redirect('/login');
  }
});
router.post('/api/getBasicUserData', (req, res) => {
  if (req.session.user) {
    var userID = req.body.id;
    User.findById(userID, 'profile_pic fullname occupation origin_state local_government', (err, data) => {
      if (!err) {
        res
          .status(200)
          .send(data);
      } else {
        console.log(JSON.stringify(err, null, 2));
        res
          .status(500)
          .send(err);
      }
    });
  }
});
router.post('/api/follow', (req, res) => {
  var user_toFollow = req.body.toFollow;
  var user_id = req.session.user.id;

  User.findById(user_id, (err, doc) => {
    doc
      .following
      .push(user_toFollow);
    doc
      .save()
      .then(() => {
        User.findById(user_id, (err, data) => {
          console.log(JSON.stringify(data, null, 2));
          res
            .status(200)
            .send(data);
        })
      }).catch(e => {
        console.log(JSON.stringify(e, null, 2));
        res.status(500).send("error following user");
      })
  })

  // User.findByIdAndUpdate(user_id, {
  //   $push: {
  //     following: user_toFollow
  //   }
  // }, (err, result) => {
  //   if (!err) {
  //     console.log(JSON.stringify(result, null, 2));
  //     res
  //       .status(200)
  //       .send("user successfully followed");
  //   } else {
  //     res
  //       .status(500)
  //       .send("there is an issue following this user, we are fixing this already");
  //   }
  // });
});
router.post('/api/fetchPosts', (req, res) => {
  var lmt = req.body.limit || 20;
  Post
    .find({})
    .limit()
    .exec((err, doc) => {
      if (!err) {
        res
          .status(200)
          .send(doc);
      } else {
        console.log(JSON.stringify(err, null, 2));
        res
          .status(500)
          .send(err);
      }
    })
})
router.put('/api/changePass/onDash', (req, res) => {
  let username = req.session.user.username;
  let newPass = req.body.newpass;
  let salt = bcrypt.genSaltSync(5);
  let password = bcrypt.hashSync(newPass, salt);

  User.findOneAndUpdate({
    username: username
  }, {
    password: password,
    salt: salt
  }, err => {
    if (!err) {
      res
        .status(200)
        .send("success");
    } else {
      res.send({message: "error", code: 'NOT_OK'});
    }
  })
});

router.post('/api/upload/image', fileParser, (req, res) => {
  let imageFile = req.files.file;
  cloudinary
    .uploader
    .upload(imageFile.path, (result) => {
      if (result.url) {
        res.send({result});
      } else {
        res.send({message: "Error uploading to cloudinary", code: 'NOT_OK'});
        console.log('Error uploading to cloudinary: ', result);
      }
    });
});

app.use(router);

const server = http.createServer(app);
const io = socketio(server);
const port = app.set('PORT', process.env.PORT || config.port);

server.listen(app.get('PORT'), () => {
  console.log(`server running on port ${app.get('PORT')}`);
});