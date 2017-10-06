const mongoose = require('mongoose'),
  crypto = require('crypto'),
  Schema = mongoose.Schema;

let userSchema = new Schema({
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
  profile_pic : {
    type: String
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
  occupation: {
    type: String
  },
  following: [{user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }}],
  local_government: String,
  party: String,
  summary: String,
  no_of_queries: Number,
  followers: [{name: String, occupation: String, local_government: String, profile_url: String}],
  education: [{institution: String, programe: String, startDate: Number, endDate: Number}],
  professional_experience: [{post: String, where: String, startDate: Number, endDate: Number}],
  activities_societies: [{course: String, where: String, details: String, startDate: Number, endDate: Number, reference_link: String}],
  fb_id: String,
  gPlus_id: String,
  tw_id: String,
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

userSchema.pre('save', function(next) {
  this.email = this.email.toLowerCase();

  let hash = crypto.createHash('md5').update(this.email).digest('hex');
  this.profile_pic = `https://www.gravatar.com/avatar/${hash}`;

  var currentDate = new Date().valueOf();
  this.updated_at = currentDate;
  if (!this.created_at)
    this.created_at = currentDate;
  next();
});

var user = mongoose.model('user', userSchema);

module.exports = user;