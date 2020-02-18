const mongoose = require('mongoose');

const Offer = mongoose.model('Offer', {
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true
  },
  created: {
    type: String,
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  pictures: {
    type: Array,
    default: []
  }
});

module.exports = Offer;
