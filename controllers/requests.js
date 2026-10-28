const express = require('express');
const router = express.Router();

const Request = require('../models/request.js');
const Publication = require('../models/publication.js');
const User = require('../models/user.js');

// 1. Prikaz Dashboard-a (razlikuje se u zavisnosti od uloge)
router.get('/', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/sign-in');
    }

    const currentUser = await User.findById(req.session.user._id);

    let tasks = [];
    if (currentUser.role === 'editor') {
      tasks = await Request.find().populate('applicant publication assignedTo');
    } else {
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
    if (!req.session.user) return res.redirect('/auth/sign-in');
    const currentUser = await User.findById(req.session.user._id);
    if (currentUser.role !== 'editor') return res.redirect('/requests');

    const publications = await Publication.find({});
    const processors = await User.find({ role: 'processor' }); 
    
    res.render('requests/new.ejs', { publications, processors });
  } catch (error) {
    console.log(error);
    res.redirect('/requests');
  }
});

// 3. Čuvanje novog zahteva u bazi
router.post('/', async (req, res) => {
  try {
    if (!req.session.user) return res.redirect('/auth/sign-in');
    
    req.body.applicant = req.session.user._id;
    await Request.create(req.body);
    res.redirect('/requests');
  } catch (error) {
    console.log(error);
    res.redirect('/requests');
  }
});

// 4. Prikaz detalja pojedinačnog zahteva i prepiske (SHOW route)
router.get('/:id', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/sign-in');
    }

    const currentUser = await User.findById(req.session.user._id);

    const task = await Request.findById(req.params.id)
      .populate('publication')
      .populate('assignedTo')
      .populate('comments.author');
      
    if (!task) {
      return res.redirect('/requests');
    }

    res.render('requests/show.ejs', { task, currentUser });
  } catch (error) {
    console.log(error);
    res.redirect('/requests');
  }
});

// 5. Ažuriranje statusa i dodavanje poruke u prepisku (UPDATE route)
router.put('/:id', async (req, res) => {
  try {
    if (!req.session.user) return res.redirect('/auth/sign-in');

    const { status, commentText } = req.body;
    
    const request = await Request.findById(req.params.id);
    if (!request) return res.redirect('/requests');

    request.status = status;

    if (commentText && commentText.trim() !== '') {
      request.comments.push({
        author: req.session.user._id,
        text: commentText
      });
    }

    await request.save();
    res.redirect(`/requests/${request._id}`);
  } catch (error) {
    console.log(error);
    res.redirect('/requests');
  }
});


router.delete('/:id', async (req, res) => {
  try {
    await Request.findByIdAndDelete(req.params.id); // Prilagodi metod u zavisnosti od baze koju koristiš
    res.redirect('/requests');
  } catch (err) {
    console.log(err);
    res.redirect('/requests');
  }
});


module.exports = router;