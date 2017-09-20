var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var Schema = mongoose.Schema;

var adminSchema = new Schema({
  fullname: {
    type: String,
    required: false,
    trim: true
  },
  firstname: {
    type: String,
    required: true,
    trim: true
  },
  lastname: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    index: true
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
  salt: {
    type: String,
    required: true
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

// adminSchema.methods.validatePassword = function (pswd) {
//   bcrypt.compareSync(password, pswd);
//   return this.password === pswd;
// };

adminSchema.pre('save', function(next) {
  this.email = this.email.toLowerCase();
  this.username = this.username.toLowerCase();

  this.fullname = this.firstname + ' ' + this.lastname;

  var currentDate = new Date().valueOf();
  this.updated_at = currentDate;
  if (!this.created_at)
    this.created_at = currentDate;
  next();
});

var Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;