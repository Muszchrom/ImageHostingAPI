const mongoose = require('mongoose');

// contains a name of the cluster and a timestamp
// reffering to time when for example photos were taken
// for example: Grecja wrzesień 2021
const clusters = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  cluster: { type: String, required: True },
  timestamp: { type: Number }
});
module.exports = mongoose.model('Clusters', clusters);
