var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var querySchema = new Schema({
  body: String,
  author_fullName: String,
  author_imageUrl: String,
  author_id: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  post_id: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },
  createdOn: { type: Number, default: (new Date()).getTime() },
  updated_at: Schema.Types.Mixed,
});

querySchema.query.byCategory = function (category) {
  return this.find({
    category: new RegExp(category, 'i')
  });
};

querySchema.pre('save', function (next) {
  var currentDate = new Date().getTime();
  this.updated_at = currentDate;
  if (!this.createdOn)
    this.createdOn = currentDate;
  next();
});

var Query = mongoose.model('Query', querySchema);

module.exports = Query;