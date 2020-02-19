const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: 'goupil',
  api_key: '654369122393577',
  api_secret: 'kJffNbslYOF7UCnOo24giZYZSE8'
});
const Offer = require('../models/Offer');
const isAuthenticated = require('../middleware/isAuthenticated');
const filtersSettings = require('../middleware/filtersSettings');

// PUBLISH AN OFFER
router.post('/offer/publish', isAuthenticated, async (req, res) => {
  const { title, description, price } = req.fields;

  // Errors management
  const hasRequiredFields = title && price;
  const isGoodDescriptionLength = description.length <= 500;
  const isGoodTitleLength = title.length <= 50;
  const isGoodPriceLimit = price <= 100000;

  // Cloudinary variables
  const filesResults = [];
  const files = req.files.files;

  try {
    if (!hasRequiredFields) {
      return res.status(400).json({
        error: `Veuillez renseigner tous les champs marqués d'un astérisque.`
      });
    }
    if (!isGoodDescriptionLength) {
      return res.status(400).json({
        error: 'La description doit contenir au maximum 500 caractères.'
      });
    }
    if (!isGoodTitleLength) {
      return res
        .status(400)
        .json({ error: 'Le titre doit contenir au maximum 50 caractères.' });
    }
    if (!isGoodPriceLimit) {
      return res
        .status(400)
        .json({ error: 'Le prix doit se situer en dessous de 100000 €' });
    }

    if (typeof files === 'object') {
      if (files.length) {
        files.forEach(file => {
          cloudinary.v2.uploader.upload(
            file.path,
            {
              folder: 'le-bon-coin'
            },
            async (error, result) => {
              if (error) {
                return res.status(400).json({ error });
              } else {
                filesResults.push(result.secure_url);
              }
              if (filesResults.length === files.length) {
                const offer = new Offer({
                  pictures: filesResults,
                  title,
                  description,
                  price,
                  created: new Date().toLocaleString(),
                  creator: req.user
                });
                await offer.save();
                return res.status(200).json({
                  _id: offer._id,
                  pictures: offer.pictures,
                  title: offer.title,
                  description: offer.description,
                  price: offer.price,
                  created: offer.created,
                  creator: {
                    account: offer.creator.account,
                    _id: offer.creator._id
                  }
                });
              }
            }
          );
        });
      } else {
        cloudinary.v2.uploader.upload(
          files.path,
          {
            folder: 'le-bon-coin'
          },
          async (error, result) => {
            if (error) {
              return res.status(400).json({ error });
            } else {
              filesResults.push(result.secure_url);
            }
            const offer = new Offer({
              pictures: filesResults,
              title,
              description,
              price,
              created: new Date().toLocaleString(),
              creator: req.user
            });
            await offer.save();
            return res.status(200).json({
              _id: offer._id,
              pictures: offer.pictures,
              title: offer.title,
              description: offer.description,
              price: offer.price,
              created: offer.created,
              creator: {
                account: offer.creator.account,
                _id: offer.creator._id
              }
            });
          }
        );
      }
    } else {
      return res.send('No file uploaded.');
    }
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
      paginationSearch(search, req, 10);
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
