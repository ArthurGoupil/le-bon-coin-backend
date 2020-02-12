const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer');
const isAuthenticated = require('../middleware/isAuthenticated');
const filtersSettings = require('../middleware/filtersSettings');

// Publish an offer
router.post('/offer/publish', async (req, res) => {
  try {
    const title = req.fields.title;
    const description = req.fields.description;
    const price = req.fields.price;
    const hasRequiredFields = title && price;
    const isGoodDescriptionLength = description.length <= 500;
    const isGoodTitleLength = title.length <= 50;
    const isGoodPriceLimit = price <= 100000;
    if (!hasRequiredFields) {
      return res.status(400).json({ error: 'Field(s) missing.' });
    }
    if (!isGoodDescriptionLength) {
      return res
        .status(400)
        .json({ error: 'Description length must be under 500 caracters.' });
    }
    if (!isGoodTitleLength) {
      return res
        .status(400)
        .json({ error: 'Title length must be under 50 caracters.' });
    }
    if (!isGoodPriceLimit) {
      return res.status(400).json({ error: 'Price must be under 100000.' });
    }
    const offer = new Offer({
      title,
      description,
      price,
      created: new Date().toLocaleString(),
      creator: req.user
    });
    await offer.save();
    return res.status(200).json({
      _id: offer._id,
      title: offer.title,
      description: offer.description,
      price: offer.price,
      created: offer.created,
      creator: {
        account: offer.creator.account,
        _id: offer.creator._id
      }
    });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// Get all offers
router.get('/offer', async (req, res) => {
  try {
    const offers = await Offer.find();
    res.json(offers);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Generic function that deals with pagination
const paginationSearch = (search, req, limit) => {
  const page = req.query.page;
  search.limit(limit).skip(limit * (page - 1));
  return search;
};

// Generic function that deals with sorting
const sortSearch = (search, req, dataToSort) => {
  if (req.query.sort === dataToSort + '-asc' || req.query.sort === 'date-asc') {
    search.sort({ [dataToSort]: 1 });
  } else if (
    req.query.sort === dataToSort + '-desc' ||
    req.query.sort === 'date-desc'
  ) {
    search.sort({ [dataToSort]: -1 });
  }
};

// Get all offers with count
router.get('/offer/with-count', filtersSettings, async (req, res) => {
  try {
    const filters = req.filters;
    const search = Offer.find(filters).populate('creator', 'account');
    if (req.query.sort) {
      const sortType = req.query.sort.slice(0, req.query.sort.indexOf('-'));
      if (sortType === 'date') {
        sortSearch(search, req, 'created');
      } else {
        sortSearch(search, req, sortType);
      }
    }
    const count = (await Offer.find(filters)).length;
    if (req.query.page) {
      paginationSearch(search, req, 3);
    }
    const offers = await search;
    res.status(200).json({ count, offers });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Get an offer with giver ID
router.get('/offer/:id', async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate(
      'creator',
      'account'
    );
    res.status(200).json({ offer });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
