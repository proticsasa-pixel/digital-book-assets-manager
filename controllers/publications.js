const express = require('express');
const router = express.Router();

const Publication = require('../models/publication.js');

// 1. Prikaz svih publikacija
router.get('/', async (req, res) => {
  try {
    const publications = await Publication.find({});
    res.render('publications/index.ejs', { publications });
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

// 2. Forma za kreiranje nove publikacije (samo za editora)
router.get('/new', (req, res) => {
  res.render('publications/new.ejs');
});

// 3. Čuvanje nove publikacije u bazi
router.post('/', async (req, res) => {
  try {
    await Publication.create(req.body);
    res.redirect('/publications');
  } catch (error) {
    console.log(error);
    res.redirect('/publications/new');
  }
});

module.exports = router;