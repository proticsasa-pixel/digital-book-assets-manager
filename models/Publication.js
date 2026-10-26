const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  grade: { type: Number, required: true },
  subject: { type: String, required: true },
  owner: { type: String }
});


const Publication = mongoose.model('Publication', publicationSchema);
module.exports = Publication;