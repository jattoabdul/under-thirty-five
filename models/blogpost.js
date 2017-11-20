var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');

var blogPostSchema = new Schema({
  title: String,
  image: {
    type: String,
    default: 'https://unsplash.com/photos/WYd_PkCa1BY'
  },
  content:  String,
  author_id: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  updated_at: Schema.Types.Mixed,
  createdOn: { type: Number, default: (new Date()).getTime() },
}, {runSettersOnQuery: true});

blogPostSchema.pre('save', function (next) {
  var currentDate = new Date().getTime();
  this.updated_at = currentDate;
  if (!this.createdOn)
    this.createdOn = currentDate;
  next();
});

var BlogPost = mongoose.model('BlogPost', blogPostSchema);

module.exports = BlogPost;
