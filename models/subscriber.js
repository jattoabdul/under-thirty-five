const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

let subscriberSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true},
  month: { type: String, required: true, trim: true},
  year: { type: Number, required: true}
}, {runSettersOnQuery: true});

let Subscriber = mongoose.model('Subscriber', subscriberSchema);

module.exports = Subscriber;

// Category
//   .find()
//   .populate('posts.pubslihed')
// .exec(function(err, stories) {
//     //do your stuff here
// });