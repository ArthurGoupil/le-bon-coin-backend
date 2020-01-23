const express = require('express');
const router = express.Router();
const uid2 = require('uid2');
const SHA256 = require('crypto-js/sha256');
const encBase64 = require('crypto-js/enc-base64');
const User = require('../models/User');

// Dealing with sign-up and password encryption
router.post('/user/sign_up', async (req, res) => {
  try {
    const token = uid2(16);
    const salt = uid2(64);
    const hash = SHA256(req.fields.password + salt).toString(encBase64);
    const existingUser = await User.findOne({ email: req.fields.email });
    const userName = req.fields.username;
    if (!existingUser && userName) {
      const user = new User({
        email: req.fields.email,
        token,
        salt,
        hash,
        account: {
          username: req.fields.username,
          phone: req.fields.phone
        }
      });
      await user.save();
      return res.status(200).json({
        _id: user._id,
        token,
        account: {
          username: user.account.username,
          phone: user.account.phone
        }
      });
    } else if (existingUser && !userName) {
      return res.status(400).json({
        message:
          'Email address already exists in our database and username field is missing.'
      });
    } else if (existingUser) {
      res
        .status(400)
        .json({ message: 'Email address already exists in our database.' });
    } else if (!userName) {
      return res.status(400).json({ message: 'Username field is missing.' });
    }
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// Dealing with log-in
router.post('/user/log_in', async (req, res) => {
  try {
    const userEmail = req.fields.email;
    const userPassword = req.fields.password;
    if (userEmail && userPassword) {
      const user = await User.findOne({ email: userEmail });
      if (user) {
        const loginHash = SHA256(userPassword + user.salt).toString(encBase64);
        if (loginHash === user.hash && user) {
          return res.status(200).json({
            _id: user._id,
            token: user.token,
            account: user.account
          });
        } else return res.status(400).json({ error: 'Unauthorized.' });
      } else return res.status(400).json({ error: 'Unauthorized.' });
    } else return res.status(400).json({ error: `Missing parameter(s)` });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

module.exports = router;
