const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

let categorySchema = new Schema({
  name: { type: String, required: true, trim: true, unique: true },
  posts: {
    published: [{ type : Schema.Types.ObjectId, ref: 'Post' }],
    drafts: [{ type : Schema.Types.ObjectId, ref: 'Post' }]
  },
  month: { type: String, required: true, trim: true},
  year: { type: Number, required: true}
}, {runSettersOnQuery: true});

let Category = mongoose.model('Category', categorySchema);

module.exports = Category;