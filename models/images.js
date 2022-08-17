const mongoose = require('mongoose');

const images = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  image: { type: String, required: true },
  imageName: { type: String, required: true },
  extension: { type: String, required: true },
  clusterId: { type: String, required: true }
});

module.exports = mongoose.model('Images', images);
