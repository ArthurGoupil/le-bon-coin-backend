const mongoose = require('mongoose');

const User = mongoose.model('User', {
  email: {
    type: String,
    unique: true,
    required: true
  },
  token: {
    type: String,
    required: true
  },
  salt: {
    type: String,
    required: true
  },
  hash: {
    type: String,
    required: true
  },
  account: {
    username: {
      type: String,
      required: true
    }
  }
});

module.exports = User;
