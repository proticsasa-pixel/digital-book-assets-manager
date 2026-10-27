const express = require('express');
const router = express.Router();

const Publication = require('../models/publication.js');
const User = require('../models/user.js'); // Obavezno uključujemo i User model zbog provere uloge

// Middleware funkcija za proveru da li je korisnik ulogovan i da li je editor
const ensureEditor = async (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/sign-in');
  }
  try {
    const currentUser = await User.findById(req.session.user._id);
    if (currentUser.role !== 'editor') {
      return res.redirect('/requests'); // Ako nije editor, vraćamo ga nazad na dashboard
    }
    next(); // Ako jeste editor, puštamo ga dalje
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
};

// 1. Prikaz svih publikacija (ovo mogu da vide i jedni i drugi)
router.get('/', ensureEditor, async (req, res) => {
  try {
    const publications = await Publication.find({});
    res.render('publications/index.ejs', { publications });
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