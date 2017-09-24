var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  fullname: {
    type: String,
    required: false,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  passResetKey: String,
  current_address: {
    type: String
  },
  origin_state: {
    type: String,
    required: true
  },
  origin_town: {
    type: String,
    required: true
  },
  phone_number: {
    type: String
  },
  gender: {
    type: String,
    required: true
  },
  age: {
    type: String,
    required: false
  },
  date_of_birth: {
    type: Number,
    required: false
  },
  created_at: {
    type: Date,
    required: false
  },
  disabled: {
    type: Number,
    required: true,
    default: false
  },
  updated_at: {
    type: Number,
    required: false
  },
  last_login: {
    type: Number,
    required: false
  }
}, { runSettersOnQuery: true });

// userSchema.methods.validatePassword = function (pswd) {
//   bcrypt.compareSync(password, pswd);
//   return this.password === pswd;
// };

userSchema.pre('save', function(next) {
  this.email = this.email.toLowerCase();

  // this.fullname = this.firstname + ' ' + this.lastname;

  var currentDate = new Date().valueOf();
  this.updated_at = currentDate;
  if (!this.created_at)
    this.created_at = currentDate;
  next();
});

var user = mongoose.model('user', userSchema);

module.exports = user;