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

// 1. PRVO OSNOVNI MIDDLEWARE (ovo je moralo na vrh da bi Express čitao podatke iz forme!)
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


//promenljiva user postaje dostupna u svakom navbaru sa ovim parcetom koda
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.currentUser = req.session.user || null; // Dodali smo i ovo da podrži oba naziva
  next();
});


// 2. KONEKCIJA SA BAZOM
mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

// 3. KONTROLERI I RUTE (sada dolaze nakon middleware-a)
const authController = require('./controllers/auth.js');
app.use('/auth', authController);

const requestsController = require('./controllers/requests.js');
app.use('/requests', requestsController);

const publicationsController = require('./controllers/publications.js');
app.use('/publications', publicationsController);

// Početna ruta
app.get('/', (req, res) => {
  res.render('index.ejs', {
    user: req.session.user,
  });
});

const port = process.env.PORT ? process.env.PORT : '3000';

app.listen(port, () => {
  console.log(`The express app is ready on port ${port}!`);
});