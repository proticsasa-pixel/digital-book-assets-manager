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

// 1. Prikazforme za Sign In
router.get('/sign-in', (req, res) => {
  res.render('auth/sign-in.ejs', { errorMessage: null });
});

// 2. Obrada prijave (Sign In) - ASINHRONO + TRIMOVANJE
router.post('/sign-in', async (req, res) => {
  try {
    // Trimujemo i stavljamo mala slova da ne zeza tipfeler
    const email = req.body.email ? req.body.email.trim().toLowerCase() : '';

    const userInDatabase = await User.findOne({ email: email });
    if (!userInDatabase) {
      return res.render('auth/sign-in.ejs', { errorMessage: 'Korisnik sa ovim email-om ne postoji.' });
    }
  
    // Asinhrono poređenje lozinki (ne koči server!)
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
  res.render('auth/new-user.ejs', { errorMessage: null });
});

// 5. Čuvanje novog korisnika u bazi - ASINHRONO + TRIMOVANJE
router.post('/new-user', ensureAdmin, async (req, res) => {
  try {
    const username = req.body.username ? req.body.username.trim() : '';
    const email = req.body.email ? req.body.email.trim().toLowerCase() : '';

    const userInDatabase = await User.findOne({ username: username });
    if (userInDatabase) {
      return res.render('auth/new-user.ejs', { errorMessage: 'Korisničko ime je već zauzeto.' });
    }

    if (req.body.password !== req.body.confirmPassword) {
      return res.render('auth/new-user.ejs', { errorMessage: 'Lozinke se ne poklapaju.' });
    }

    // Asinhrono heširanje nove lozinke
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    
    // Kreiramo objekat sa očišćenim podacima
    await User.create({
      username: username,
      email: email,
      password: hashedPassword,
      role: req.body.role
    });
    
    res.redirect('/');
  } catch (error) {
    console.log(error);
    res.render('auth/new-user.ejs', { errorMessage: 'Greška pri kreiranju korisnika.' });
  }
});

module.exports = router;