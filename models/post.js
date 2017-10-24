var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');

var postSchema = new Schema({
  body: String,
  author_id: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdOn: { type: Number, default: (new Date()).getTime() },
  updated_at: Schema.Types.Mixed,
  meta: {
    likes: Number,
    shares: Number
  },
  views: Number,
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

// postSchema.index({slug: 1, category: -1});

postSchema.query.byCategory = function (category) {
  return this.find({
    category: new RegExp(category, 'i')
  });
};

postSchema.pre('save', function (next) {
  // this.slug = this
  //   .title
  //   .replace(/\s+/g, '-')
  //   .replace(/[^\w\-]+/g, '')
  //   .replace(/\-\-+/g, '-')
  //   .replace(/^-+/, '')
  //   .replace(/-+$/, '');

  var currentDate = new Date().getTime();
  this.updated_at = currentDate;
  if (!this.createdOn)
    this.createdOn = currentDate;
  next();
});

// postSchema.virtual('url').get(function () {
//     var date = moment(this.date),
//       formatted = date.format('YYYY[/]MM[/]');

//     return '/' + formatted + this.slug;
//   });

var Post = mongoose.model('Post', postSchema);

module.exports = Post;

// sample query Post.find().byCategory('feminisim').exec(function(err, posts) {