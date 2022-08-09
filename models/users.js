const mongoose = require('mongoose');

// contains user credentials
const users = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  username: { type: String, required: true },
  password: { type: String, required: true }
});
module.exports = mongoose.model('Users', users);
