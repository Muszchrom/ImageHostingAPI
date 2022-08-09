const mongoose = require('mongoose');

const files = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  file: { type: String, required: true },
  fileName: { type: String, required: true },
  extension: { type: String, required: true },
  postID: mongoose.Schema.Types.ObjectId
});

module.exports = mongoose.model('Files', files);
