const express = require('express');
const router = express.Router();

const Request = require('../models/request.js');
const Publication = require('../models/publication.js');
const User = require('../models/user.js');

// 1. Prikaz Dashboard-a (razlikuje se u zavisnosti od uloge)
router.get('/', async (req, res) => {
  try {
    // Provera da li je korisnik ulogovan preko sesije
    if (!req.session.user) {
      return res.redirect('/auth/sign-in');
    }

    // Nalazimo ulogovanog korisnika u bazi da proverimo njegovu ulogu
    const currentUser = await User.findById(req.session.user._id);

    let tasks = [];
    if (currentUser.role === 'editor') {
      // Editor vidi sve zahteve u sistemu
      tasks = await Request.find().populate('applicant publication assignedTo');
    } else {
      // Procesor vidi samo zahteve dodeljene njemu
      tasks = await Request.find({ assignedTo: currentUser._id }).populate('applicant publication assignedTo');
    }

    res.render('requests/index.ejs', { tasks, currentUser });
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

// 2. Forma za kreiranje novog zahteva (samo za editora)
router.get('/new', async (req, res) => {
  try {
    const publications = await Publication.find({});
    const processors = await User.find({ role: 'processor' }); // Da editor može da izabere kome dodeljuje zadatak
    
    res.render('requests/new.ejs', { publications, processors });
  } catch (error) {
    console.log(error);
    res.redirect('/requests');
  }
});

// 3. Čuvanje novog zahteva u bazi
router.post('/', async (req, res) => {
  try {
    // Dodajemo ID ulogovanog korisnika kao podnosioca zahteva (applicant)
    req.body.applicant = req.session.user._id;
    
    await Request.create(req.body);
    res.redirect('/requests');
  } catch (error) {
    console.log(error);
    res.redirect('/requests');
  }
});

// 4. Ažuriranje statusa zadatka (za procesora)
router.put('/:id', async (req, res) => {
  try {
    // Proveri da li ovde uzimaš i status i clarificationNote iz req.body
    await Request.findByIdAndUpdate(req.params.id, {
      status: req.body.status,
      clarificationNote: req.body.clarificationNote // <--- OVO JE KLJUČNO DA SE SNIMI U BAZU
    });
    
    res.redirect('/requests');
  } catch (error) {
    console.log(error);
    res.redirect('/requests');
  }
});

module.exports = router;