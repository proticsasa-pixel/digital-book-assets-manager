const express = require('express');
const router = express.Router();

const Publication = require('../models/publication.js');
const Request = require('../models/request.js'); 
const User = require('../models/user.js');

// Middleware za proveru da li je korisnik ulogovan (bilo ko)
const ensureSignedIn = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/sign-in');
  }
  next();
};

// Middleware za proveru da li je korisnik editor ILI admin
const ensureEditorOrAdmin = async (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/sign-in');
  }
  try {
    const currentUser = await User.findById(req.session.user._id);
    // Dozvoljavamo pristup samo ako je editor ili admin (procesor ovde nema pristup)
    if (!currentUser || (currentUser.role !== 'editor' && currentUser.role !== 'admin')) {
      return res.redirect('/requests'); 
    }
    next();
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
};

// 1. Prikaz svih publikacija (dostupno svima ulogovanima)
router.get('/', ensureSignedIn, async (req, res) => {
  try {
    const currentUser = await User.findById(req.session.user._id);
    const publications = await Publication.find({}).populate('owner');
    
    // Provera da li postoji poruka o grešci pri brisanju
    let errorMessage = null;
    if (req.query.error === 'unauthorized') {
      errorMessage = 'Nemate dozvolu da obrišete ovu publikaciju jer niste njen vlasnik.';
    }

    res.render('publications/index.ejs', { publications, currentUser, errorMessage });
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

// 2. Forma za kreiranje nove publikacije
router.get('/new', ensureEditorOrAdmin, async (req, res) => {
  try {
    const users = await User.find({}); 
    res.render('publications/new.ejs', { users: users });
  } catch (error) {
    console.log(error);
    res.redirect('/requests');
  }
});

// 3. Čuvanje nove publikacije u bazi (Automatski postavlja vlasnika)
router.post('/', ensureEditorOrAdmin, async (req, res) => {
  try {
    const currentUser = await User.findById(req.session.user._id);
    
    // Ako je ulogovan urednik, vlasnik je uvek on. Ako je admin, uzima se iz forme (ili admin ako nije izabran)
    const ownerId = (currentUser.role === 'editor' || !req.body.owner) ? currentUser._id : req.body.owner;

    await Publication.create({
      title: req.body.title,
      grade: req.body.grade,
      subject: req.body.subject,
      owner: ownerId
    });

    res.redirect('/publications');
  } catch (error) {
    console.log(error);
    res.redirect('/publications/new');
  }
});

// 4. Brisanje publikacije (Admin briše sve, urednik samo svoje)
router.delete('/:id', ensureEditorOrAdmin, async (req, res) => {
  try {
    const publicationId = req.params.id;
    const currentUser = await User.findById(req.session.user._id);
    const publication = await Publication.findById(publicationId);

    if (!publication) {
      return res.redirect('/publications');
    }

    // Provera dozvola za brisanje:
    const isAdmin = currentUser.role === 'admin';
    const isOwner = publication.owner && publication.owner.toString() === currentUser._id.toString();

    if (isAdmin || isOwner) {
      // Prvo brišemo sve zahteve vezane za publikaciju
      await Request.deleteMany({ publication: publicationId });
      // Zatim brišemo samu publikaciju
      await Publication.findByIdAndDelete(publicationId);
      return res.redirect('/publications');
    } else {
      // Ako nema pravo, preusmeravamo nazad sa parametrom greške
      return res.redirect('/publications?error=unauthorized');
    }
  } catch (error) {
    console.log(error);
    res.redirect('/publications');
  }
});

module.exports = router;