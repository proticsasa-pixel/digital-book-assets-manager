const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');

// Middleware za proveru da li je ulogovani korisnik admin
function ensureAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  res.redirect('/');
}

// 1. Prikaz forme za Sign In
router.get('/sign-in', (req, res) => {
  res.render('auth/sign-in.ejs', { errorMessage: null });
});

// 2. Obrada prijave (Sign In) - ASINHRONO + TRIMOVANJE
router.post('/sign-in', async (req, res) => {
  try {
    const email = req.body.email ? req.body.email.trim().toLowerCase() : '';

    const userInDatabase = await User.findOne({ email: email });
    if (!userInDatabase) {
      return res.render('auth/sign-in.ejs', { errorMessage: 'Korisnik sa ovim email-om ne postoji.' });
    }
  
    const validPassword = await bcrypt.compare(
      req.body.password,
      userInDatabase.password
    );
    
    if (!validPassword) {
      return res.render('auth/sign-in.ejs', { errorMessage: 'Pogrešna lozinka. Pokušaj ponovo.' });
    }
  
    req.session.user = {
      email: userInDatabase.email,
      _id: userInDatabase._id,
      role: userInDatabase.role
    };
  
    res.redirect('/');
  } catch (error) {
    console.log(error);
    res.render('auth/sign-in.ejs', { errorMessage: 'Došlo je do sistemske greške.' });
  }
});

// 3. Odjava (Sign Out)
router.get('/sign-out', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// 4. Prikaz forme za novog korisnika (samo za admina)
router.get('/new-user', ensureAdmin, (req, res) => {
  res.render('auth/new-user.ejs', { errorMessage: null, successMessage: null });
});

// 5. Čuvanje novog korisnika u bazi - ASINHRONO + TRIMOVANJE + PROVERA DUPLIKATA
router.post('/new-user', ensureAdmin, async (req, res) => {
  try {
    const username = req.body.username ? req.body.username.trim() : '';
    const email = req.body.email ? req.body.email.trim().toLowerCase() : '';

    // Provera da li username već postoji
    const existingUsername = await User.findOne({ username: username });
    if (existingUsername) {
      return res.render('auth/new-user.ejs', { errorMessage: 'Korisničko ime je već zauzeto.', successMessage: null });
    }

    // Provera da li email već postoji
    const existingEmail = await User.findOne({ email: email });
    if (existingEmail) {
      return res.render('auth/new-user.ejs', { errorMessage: 'Korisnik sa ovim email-om već postoji u bazi.', successMessage: null });
    }

    if (req.body.password !== req.body.confirmPassword) {
      return res.render('auth/new-user.ejs', { errorMessage: 'Lozinke se ne poklapaju.', successMessage: null });
    }

    // Asinhrono heširanje nove lozinke
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    
    // Kreiramo novog korisnika
    await User.create({
      username: username,
      email: email,
      password: hashedPassword,
      role: req.body.role
    });
    
    // Vraćamo formu sa porukom o uspehu
    return res.render('auth/new-user.ejs', { 
      errorMessage: null, 
      successMessage: 'Korisnik je uspešno unesen u bazu!' 
    });

  } catch (error) {
    console.log(error);
    res.render('auth/new-user.ejs', { errorMessage: 'Greška pri kreiranju korisnika.', successMessage: null });
  }
});

module.exports = router;