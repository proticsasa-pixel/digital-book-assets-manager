const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true }
}, { timestamps: true });

const requestSchema = new mongoose.Schema({
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },     
  publication: { type: mongoose.Schema.Types.ObjectId, ref: 'Publication', required: true }, 
  req_description: { type: String, required: true }, 
  file_location: { type: String, required: true },   
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Needs Clarification', 'Completed'], 
    default: 'Pending' 
  },
  comments: [commentSchema],
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }    
}, { timestamps: true });

const Request = mongoose.model('Request', requestSchema);
module.exports = Request;