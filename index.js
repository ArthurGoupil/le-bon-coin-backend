const express = require('express');
const formidableMiddleware = require('express-formidable');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(formidableMiddleware({ multiples: true }));
app.use(cors());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/le-bon-coin', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
});

const userRoutes = require('./routes/user');
app.use(userRoutes);
const offerRoutes = require('./routes/offer');
app.use(offerRoutes);

app.all('*', (req, res) => {
  res.json({ message: 'all routes.' });
});

app.listen(process.env.PORT || 3200, () => {
  console.log('Server has started.');
});
