const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },     // Ko je poslao zahtev (Editor)
  publication: { type: mongoose.Schema.Types.ObjectId, ref: 'Publication', required: true }, // Kojoj publikaciji pripada
  req_description: { type: String, required: true }, // Opis zadatka / multimedijalnih resursa
  file_location: { type: String, required: true },   // Lokacija fajla (link / putanja)
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Completed'], // Statusi prebačeni na engleski
    default: 'Pending' 
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }    // Kome je dodeljeno (Processor)
});

const Request = mongoose.model('Request', requestSchema);

module.exports = Request;