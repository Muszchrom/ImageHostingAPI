const mongoose = require('mongoose');

const clusters = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  clusterName: { type: String, required: true, unique: true },
  clusterURI: { type: String, required: true, unique: true },
  timestampStart: { type: Number },
  timestampEnd: { type: Number }
});

module.exports = mongoose.model('Clusters', clusters);
