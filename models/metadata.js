const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

let metadataSchema = new Schema({
  about: String,
  author: {
    about: String
  },
  picture: String,
  social: {
    facebook: { type : String, trim: true },
    twitter: { type: String, trim: true },
    instagram: { type: String, trim: true },
    googlePlus: { type: String , trim: true }
  }
}, {runSettersOnQuery: true});

let Metadata = mongoose.model('Metadata', metadataSchema);

module.exports = Metadata;
