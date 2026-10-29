const path = require("path");
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const morgan = require('morgan');
const session = require('express-session');

const Request = require('./models/request.js');

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback_secret',
    resave: false,
    saveUninitialized: true,
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.currentUser = req.session.user || null;
  next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Konekcija ka bazi (prilagođena za serverless da ne otvara duple konekcije)
let isConnected = false;
async function connectDB() {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log("Connected to MongoDB.");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

// Rute
const authController = require('./controllers/auth.js');
app.use('/auth', authController);

const requestsController = require('./controllers/requests.js');
app.use('/requests', requestsController);

const publicationsController = require('./controllers/publications.js');
app.use('/publications', publicationsController);

// Početna ruta sa obaveznom konekcijom i bezbednim try/catch
app.get('/', async (req, res) => {
  try {
    await connectDB();
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

// Eksport za Vercel serverless
module.exports = app;