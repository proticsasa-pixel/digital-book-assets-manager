const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema({
  title: { type: String, required: true },       // Naziv publikacije (npr. Matematika 5)
  grade: { type: Number, required: true },       // Razred
  subject: { type: String, required: true },     // Predmet
  owner: { type: String }                        // Vlasnik / Autor
});

const Publication = mongoose.model('Publication', publicationSchema);

module.exports = Publication;