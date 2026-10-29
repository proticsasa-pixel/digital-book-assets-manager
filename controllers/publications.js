const express = require('express');
const router = express.Router();

const Publication = require('../models/publication.js');
const Request = require('../models/request.js'); // Dodato da bismo mogli da brišemo i zahteve
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
    const currentUser = await User.findById(req.session.user._id);
    const publications = await Publication.find({}).populate('owner');
    
    res.render('publications/index.ejs', { publications, currentUser });
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

// 2. Forma za kreiranje nove publikacije (SAMO za editora)
router.get('/new', async (req, res) => {
  try {
    if (!req.session.user) return res.redirect('/auth/sign-in');
    
    // Pronađi sve korisnike čija je uloga 'editor'
    const editors = await User.find({ role: 'editor' }); 

    res.render('publications/new.ejs', { editors });
  } catch (error) {
    console.log(error);
    res.redirect('/requests');
  }
});

// 3. Čuvanje nove publikacije u bazi (SAMO za editora)
router.post('/', ensureEditor, async (req, res) => {
  try {
    // Automatski dodajemo ID trenutno ulogovanog korisnika kao vlasnika publikacije
    req.body.owner = req.session.user._id;

    await Publication.create(req.body);
    res.redirect('/publications');
  } catch (error) {
    console.log(error);
    res.redirect('/publications/new');
  }
});

// 4. Brisanje publikacije I svih povezanih zahteva (SAMO za editora)
router.delete('/:id', ensureEditor, async (req, res) => {
  try {
    const publicationId = req.params.id;

    // Prvo brišemo sve zahteve koji su vezani za ovu publikaciju da ne ostanu "siročići"
    await Request.deleteMany({ publication: publicationId });

    // Zatim brišemo samu publikaciju
    await Publication.findByIdAndDelete(publicationId);

    res.redirect('/publications');
  } catch (error) {
    console.log(error);
    res.redirect('/publications');
  }
});

module.exports = router;