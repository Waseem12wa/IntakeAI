const mongoose = require('mongoose');

const EmployeeProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  experience: {
    type: String,
    required: true,
    enum: ['0-1', '1-3', '3-5', '5-10', '10+']
  },
  skills: {
    type: String,
    required: true,
    trim: true
  },
  bio: {
    type: String,
    trim: true
  },
  jobType: {
    type: String,
    required: true,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'],
    default: 'Full-time'
  },
  remote: {
    type: String,
    enum: ['On-site', 'Remote', 'Hybrid'],
    default: 'Hybrid'
  },
  linkedin: {
    type: String,
    trim: true
  },
  portfolio: {
    type: String,
    trim: true
  },
  salary: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
EmployeeProfileSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('EmployeeProfile', EmployeeProfileSchema);
