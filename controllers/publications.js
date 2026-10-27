const express = require('express');
const router = express.Router();

const Publication = require('../models/publication.js');
const User = require('../models/user.js');

// Middleware za proveru da li je korisnik ulogovan (bilo ko)
const ensureSignedIn = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/sign-in');
  }
  next();
};

// Middleware za proveru da li je korisnik editor
const ensureEditor = async (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/sign-in');
  }
  try {
    const currentUser = await User.findById(req.session.user._id);
    if (!currentUser || currentUser.role !== 'editor') {
      return res.redirect('/requests'); 
    }
    next();
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
};

// 1. Prikaz svih publikacija (dostupno i editoru i procesoru)
router.get('/', ensureSignedIn, async (req, res) => {
  try {
    const publications = await Publication.find({});
    const currentUser = await User.findById(req.session.user._id);
    
    res.render('publications/index.ejs', { publications, currentUser });
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

// 2. Forma za kreiranje nove publikacije (SAMO za editora)
router.get('/new', ensureEditor, (req, res) => {
  res.render('publications/new.ejs');
});

// 3. Čuvanje nove publikacije u bazi (SAMO za editora)
router.post('/', ensureEditor, async (req, res) => {
  try {
    await Publication.create(req.body);
    res.redirect('/publications');
  } catch (error) {
    console.log(error);
    res.redirect('/publications/new');
  }
});

module.exports = router;