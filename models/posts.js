const mongoose = require('mongoose');

const posts = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  title: { type: String },
  images: [{
    type: String,
    required: true
  }],
  category: {type: String, required: true },
  description: { type: String },
  timestamp: { type: Number },
  location: {
    country: { type: String },
    city: { type: String },
    place: { type: String },
  }
});

module.exports = mongoose.model('Posts', posts);
