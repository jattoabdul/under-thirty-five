var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var queriesSchema = new Schema({
  text: String,
  querier_id: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  post_id: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },
  createdOn: { type: Number, default: (new Date()).getTime() },
  updated_at: Schema.Types.Mixed,
  meta: {
    likes: Number,
    shares: Number
  },
  videos:[{url:String, title:String}],
  audios:[{url:String, title:String}],
  images: [{
    public_id: Schema.Types.Mixed,
    version: Schema.Types.Mixed,
    signature: Schema.Types.Mixed,
    width: Schema.Types.Mixed,
    height: Schema.Types.Mixed,
    format: Schema.Types.Mixed,
    resource_type: Schema.Types.Mixed,
    created_at: Schema.Types.Mixed,
    tags: [Schema.Types.Mixed],
    bytes: Schema.Types.Mixed,
    type: Schema.Types.Mixed,
    etag: Schema.Types.Mixed,
    url: Schema.Types.Mixed,
    secure_url: Schema.Types.Mixed,
    original_filename: Schema.Types.Mixed
  }]
}, {runSettersOnQuery: true});

queriesSchema.query.byCategory = function (category) {
  return this.find({
    category: new RegExp(category, 'i')
  });
};

queriesSchema.pre('save', function (next) {
  var currentDate = new Date().getTime();
  this.updated_at = currentDate;
  if (!this.createdOn)
    this.createdOn = currentDate;
  next();
});

var Queries = mongoose.model('Queries', queriesSchema);

module.exports = Queries;