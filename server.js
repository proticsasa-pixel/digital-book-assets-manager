const path = require("path");
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

// Podesavanje view engine-a i foldera
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

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

// Početna ruta sa proširenim brojanjem (Pending i Needs Clarification) i bezbednim ID-jem
app.get('/', async (req, res) => {
  try {
    let newRequestsCount = 0;

    if (req.session.user) {
      const currentUser = req.session.user;
      const statusCondition = { $in: ['Pending', 'Needs Clarification'] };

      if (currentUser.role === 'editor' || currentUser.role === 'admin') {
        newRequestsCount = await Request.countDocuments({ status: statusCondition });
      } else {
        const userId = mongoose.Types.ObjectId.isValid(currentUser._id) 
          ? new mongoose.Types.ObjectId(currentUser._id) 
          : currentUser._id;
        
        newRequestsCount = await Request.countDocuments({ 
          assignedTo: userId, 
          status: statusCondition 
        });
      }
    }

    res.render('index.ejs', {
      user: req.session.user,
      newRequestsCount: newRequestsCount
    });
  } catch (error) {
    console.error("GREŠKA NA POČETNOJ RUTI:", error);
    res.render('index.ejs', {
      user: req.session.user,
      newRequestsCount: 0
    });
  }
});

const port = process.env.PORT ? process.env.PORT : '3000';

// Ako koristiš Vercel (exportujemo app), a ako testiraš lokalno preko node server.js otkomentariši app.listen
// app.listen(port, () => {
//   console.log(`The express app is ready on port ${port}!`);
// });

module.exports = app;