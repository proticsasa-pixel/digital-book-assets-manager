const dns = require("node:dns/promises");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const morgan = require('morgan');
const session = require('express-session');

// Uvoz Request modela radi brojanja zahteva
const Request = require('./models/request.js');

// 1. PRVO OSNOVNI MIDDLEWARE
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
// app.use(morgan('dev'));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

// Promenljiva user postaje dostupna u svakom navbaru
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.currentUser = req.session.user || null;
  next();
});

// Omogućavanje učitavanja fajlova iz public foldera
app.use(express.static('public'));

// 2. KONEKCIJA SA BAZOM
mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

// 3. KONTROLERI I RUTE
const authController = require('./controllers/auth.js');
app.use('/auth', authController);

const requestsController = require('./controllers/requests.js');
app.use('/requests', requestsController);

const publicationsController = require('./controllers/publications.js');
app.use('/publications', publicationsController);

// Početna ruta sa proširenim brojanjem (Pending i Needs Clarification)
app.get('/', async (req, res) => {
  try {
    let newRequestsCount = 0;

    if (req.session.user) {
      const currentUser = req.session.user;
      
      // Definišemo uslov za statuse na koje treba skrenuti pažnju
      const statusCondition = { $in: ['Pending', 'Needs Clarification'] };

      if (currentUser.role === 'editor' || currentUser.role === 'admin') {
        // Urednik/admin vidi sve zahteve sa ovim statusima
        newRequestsCount = await Request.countDocuments({ status: statusCondition });
      } else {
        // Procesor vidi samo svoje zahteve sa ovim statusima
        newRequestsCount = await Request.countDocuments({ assignedTo: currentUser._id, status: statusCondition });
      }
    }

    res.render('index.ejs', {
      user: req.session.user,
      newRequestsCount: newRequestsCount
    });
  } catch (error) {
    console.log(error);
    res.render('index.ejs', {
      user: req.session.user,
      newRequestsCount: 0
    });
  }
});

const port = process.env.PORT ? process.env.PORT : '3000';

app.listen(port, () => {
  console.log(`The express app is ready on port ${port}!`);
});