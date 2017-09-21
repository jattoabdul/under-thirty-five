const express = require("express"),
  router = express.Router(),
  helmet = require('helmet'),
  hbs = require('hbs'),
  logger = require('morgan'),
  session = require('express-session'),
  cookieParser = require('cookie-parser'),
  bcrypt = require('bcrypt'),
  path = require('path'),
  config = require('./config.json'),
  fs = require('fs'),
  nodemailer = require('nodemailer'),
  cloudinary = require('cloudinary'),
  fileParser = require('connect-multiparty')(),
  validator = require('validator'),
  mime = require("mime"),
  bodyParser = require('body-parser'),
  mongoose = require('mongoose'),
  _ = require('lodash'),
  app = express();

mongoose.Promise = global.Promise;

cloudinary.config({
  cloud_name: config.cloud_name,
  api_key: config.api_key,
  api_secret: config.api_secret
});

const online_DB_uri = `mongodb://${config.db_user}:${config.db_pass}@ds143754.mlab.com:43754/under35`,
  local_DB_uri = `mongodb://localhost:27017/under35`;

mongoose.connect(online_DB_uri, {
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
const GetPublishedPosts = () => {
  return Post
    .find({published: true})
    .exec((err, data) => {
      if (err) {
        console.log(JSON.stringify(err, undefined, 2));
        return err;
      } else {
        return data;
      }
    });
};
const GetUnpublishedPosts = () => {
  return Post
    .find({published: false})
    .exec((err, data) => {
      if (err) {
        console.log(JSON.stringify(err, undefined, 2));
        return err;
      } else {
        return data;
      }
    });
};
const GetFeaturedPosts = () => {
  return Post
    .find({featured: true})
    .exec((err, data) => {
      if (err) {
        return err;
      } else {
        return data;
      }
    });
};
const GetCategories = cat => {
  return Category
    .find({})
    .select('name')
    .exec((err, cats) => {
      return cats;
    });
};
const GetPostsByCategory = cat => {
  return Post
    .find({category: cat})
    .exec((err, data) => {
      if (err) {
        console.log(JSON.stringify(err, undefined, 2));
        return err;
      } else {
        return data;
      }
    });
};
const GetPublishedPostsByCategory = cat => {
  return Post
    .find({category: cat, published: true})
    .exec((err, data) => {
      if (err) {
        console.log(JSON.stringify(err, undefined, 2));
        return err;
      } else {
        return data;
      }
    });
};
const GetsinglePost = (year, month, slug) => {
  return Post.findOne({
    slug: slug
  }, (err, post) => {
    if (err)
      return 0;
    return post;
  });
};
const GetPostWithSlug = (slug) => {
  return Post.findOne({
    slug: slug
  }, (err, post) => {
    if (err)
      return 0;
    return post;
  });
}
const GetNoOfPosts = () => {
  return Post.count({}, (err, count) => {
    if (err)
      return 0;
    return count;
  });
};
const GetNoOfPublishedPosts = () => {
  return Post.count({
    published: true
  }, (err, count) => {
    if (err)
      return 0;
    return count;
  });
};
const GetNoOfUnpublishedPosts = () => {
  return Post.count({
    published: false
  }, (err, count) => {
    if (err)
      return 0;
    return count;
  });
};
const GetNoOfPostsInCategory = cat => {
  return Post.count({
    category: cat
  }, (err, count) => {
    if (err)
      return 0;
    return count;
  });
};
const GetNoOfPublishedPostsInCategory = cat => {
  return Post.count({
    category: cat,
    published: true
  }, (err, count) => {
    if (err)
      return 0;
    return count;
  });
};

const GetMetadata = () => {
  return Metadata
    .find()
    .exec((err, data) => {
      if (err)
        return 0;
      return data;
    });
};

let logout = (req, res, next) => {
  delete req.session.user
  req
    .session
    .destroy();
  // res.send("logout success!");
  res.redirect('/controls/login');
};

let authorize = (req, res, next) => {
  if (req.session.user) {
    next()
  } else {
    res.send("<h1>login</h1>")
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

// *****  public APIs  ********
// &&&&&&&&&&&&&&&&&&&&&&&&&&&&
// login
router.post('/api/login', (req, res) => {
  console.log(req.body);
  let credential = req
    .body
    .loginCred
    .toLowerCase();
  let password = req.body.password

  console.log(credential,password);

  User.findOne({
    email: credential
  }, (err, data) => {
    if (err) {
      res.sendStatus(401);
    } else if (data && data !== null) {
      let pass = data.password;
      if(bcrypt.compareSync(password, pass)){
        let user = {
          id: data._id,
          name: data.fullname
        }
        req.session.user = user;
        req.session.user.expires = new Date(Date.now() + (3 * 24 * 3600 * 1000));
        User.findOneAndUpdate(data._id, {
          last_login: new Date().getTime()
        });
        res.send({message: "Welcome!", status: '200'});
      } else {
        res.status(401).send("login details doesn't match");
      }
    } else {
      res.status(401).send("invalid credentials");
    }
  });
});
// sign up
router.post('/api/signup', (req, res) => {
  let rcvData = req.body;

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
    }

    newUser = new User(regData);

    newUser
      .save()
      .then(() => {
        res.send({message: 'Welcome on board!', code: 'OK'});
      })
      .catch(err => {
        console.log(JSON.stringify(err, undefined, 2));
        res.send({message: 'error creating user', code: 'NOT_OK'});
      });
  });

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



// prottection APIs
router.put('/api/changePass', (req, res) => {
  let username = req.session.user.username;
  let newPass = req.body.newpass;
  let salt = bcrypt.genSaltSync(5);
  let password = bcrypt.hashSync(newPass, salt);

  User.findOneAndUpdate({username: username}, {password: password, salt: salt}, err => {
    if(!err) {
      res.send({message: "sucess", code: 'OK'});
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

  User.findOneAndUpdate({username: username}, {firstname: newfname, lastname: newlname, email: newEmail}, (err, data) => {
    if(!err) {
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
  if(media != null){
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


  Post.findOneAndUpdate({slug: slug}, postUpdate, (err) => {
    if(!err){
      res.send({message: 'Post modified successfully', code: 'OK'});
    } else {
      res.send({message: 'error creating post', code: 'NOT_OK'});
    }
  })
});

router.delete('/api/deletePost', (req, res) => {
  let slug = req.body.postID;
  Post.deleteOne({slug: slug}, err => {
    if(!err){
      res.send({message: 'post deleted successfully', code: 'OK'});
    } else {
      res.send({message: 'Could not delete post', code: 'NOT_OK'});
    }
  });
});













app.use('/', router);



const port = app.set('PORT', process.env.PORT || 8080);
app.listen(app.get('PORT'), () => {
  console.log(`server running on port ${app.get('PORT')}`);
});
