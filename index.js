const express = require("express"),
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

/**
 * generate a Picture profile link via gravatar
 * function accepts email, hash it(md5), then generate a gravatar link with it
 * @param {String} email
 * @return url or false if email supplied is invalid
 */
const generateProfilepicLink = (email) => {
  let hash = crypto.createHash('md5').update(email).digest('hex');
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
  var key = shortid.generate();
  while(!(validator.isAlphanumeric(key))) {
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
    res.redirect('/timeline')
  } else {
    res.render('login', {title: "Under35 | Sign in"});
  }
})

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
      res.sendStatus(401);
    } else if (data && data !== null) {
      let pass = data.password;
      if (bcrypt.compareSync(password, pass)) {
        let user = {
          id: data._id,
          name: data.fullname
        };
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
            res.status(200).send('Welcome on board!');
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
    User.findOne({email},'passResetKey', (err, rez) => {
      console.log(rez.passResetKey, code);
      if(!err){
        if(rez.passResetKey === code){
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
          res.status(400).send("incorrect code supplied");
        }
      } else {
        console.log(JSON.stringify(err, undefined, 2));
        res.status(500).send("Server could not verify your reset code");
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
    User.findOne({email},'passResetKey', (err, rez) => {
      console.log(rez.passResetKey, code);
      if(!err){
        if(rez.passResetKey === code){
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
          res.status(400).send("incorrect code supplied");
        }
      } else {
        console.log(JSON.stringify(err, undefined, 2));
        res.status(500).send("Server could not verify your reset code");
      }
    });
  }
})

router.post('/api/check_reset_code', (req, res) => {
  let { code, email } = req.body;
  if(code && email){
    if(!(validator.isEmail(email))){
      res.status(400).send('Email is invalid');
    } else if(!(validator.isAlphanumeric(code))) {
      res.status(400).send('Oga! try again');
    } else {
      User.findOne({email}, 'passResetKey',(err, rez) => {
        if(code === rez.passResetKey) {
          res.status(200).send(true);
        } else {
          res.status(400).send(false);
        }
      })
    }
  } else {
    res.status(400).send('Email and password must be supplied');
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
  res.render('timeline', {title: "Under35 | Timeline"})
})

router.get('/profile', (req, res) => {
  res.render('profile', {title: "Under35 | Profile"})
})

router.get('/followers', (req, res) => {
  res.render('timeline', {title: "Under35 | Followers"});
})

// protected APIs
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

router.put('/api/changeDetails', (req, res) => {
  let username = req.session.user.username;

  let newfname = req.body.firstname;
  let newlname = req.body.lastname;
  let newEmail = req.body.email;

  User.findOneAndUpdate({
    username: username
  }, {
    firstname: newfname,
    lastname: newlname,
    email: newEmail
  }, (err, data) => {
    if (!err) {
      console.log(JSON.stringify(data, undefined, 2));
      res.send({message: 'update successful', code: 'OK'});
      req.session.user.name = data.fullname;
    } else {
      console.log(JSON.stringify(err, undefined, 2));
      res.send({message: 'update failed', code: 'NOT_OK'});
    }
  });
});

router.post('/api/upload/image', fileParser, (req, res) => {
  var imageFile = req.files.file;
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

router.post('/api/createPost', (req, res) => {
  let title = req.body.title,
    author = req.session.user.name || 'robotester',
    description = req.body.description,
    body = req.body.body,
    category = req.body.category;

  thisTime = new Date(),
  createdOn = thisTime.getTime();
  month = config.monthNames[thisTime.getMonth()],
  year = thisTime.getFullYear(),
  published = req.body.published,
  media = req.body.media

  let newPost = new Post({
    author,
    title,
    description,
    body,
    category,
    month,
    media,
    year,
    published
  });

  newPost
    .save()
    .then(() => {
      // TODO: add the postID to post category
      res.send({message: 'Post created successfully', code: 'OK'});
    })
    .catch(err => {
      console.log(JSON.stringify(err, undefined, 2));
      res.send({message: 'error creating post', code: 'NOT_OK'});
    });
});

router.post('/api/editPost/:slug', (req, res) => {
  let slug = req.params.slug;
  title = req.body.title,
  author = req.session.user.name || 'robotester',
  description = req.body.description,
  body = req.body.body,
  category = req.body.category;
  thisTime = new Date(),
  createdOn = thisTime.getTime();
  month = config.monthNames[thisTime.getMonth()],
  year = thisTime.getFullYear(),
  published = req.body.published,
  media = req.body.media

  let postUpdate = {}
  if (media != null) {
    postUpdate = {
      author,
      title,
      description,
      body,
      category,
      month,
      media,
      year,
      published
    }
  } else {
    postUpdate = {
      author,
      title,
      description,
      body,
      category,
      month,
      year,
      published
    }
  }

  Post.findOneAndUpdate({
    slug: slug
  }, postUpdate, (err) => {
    if (!err) {
      res.send({message: 'Post modified successfully', code: 'OK'});
    } else {
      res.send({message: 'error creating post', code: 'NOT_OK'});
    }
  })
});

router.delete('/api/deletePost', (req, res) => {
  let slug = req.body.postID;
  Post.deleteOne({
    slug: slug
  }, err => {
    if (!err) {
      res.send({message: 'post deleted successfully', code: 'OK'});
    } else {
      res.send({message: 'Could not delete post', code: 'NOT_OK'});
    }
  });
});

app.use(router);

const port = app.set('PORT', process.env.PORT || 8080);
app.listen(app.get('PORT'), () => {
  console.log(`server running on port ${app.get('PORT')}`);
});
