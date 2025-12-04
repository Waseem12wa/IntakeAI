const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmployerProfile',
    required: false
  },
  
  
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance']
  },
  salary: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  requirements: {
    type: String,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  benefits: {
    type: String,
    trim: true
  },
  remote: {
    type: String,
    enum: ['On-site', 'Remote', 'Hybrid'],
    default: 'On-site'
  },
  experience: {
    type: String,
    enum: ['0-1', '1-3', '3-5', '5-10', '10+']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applications: [{
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployeeProfile'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Pending', 'Reviewed', 'Shortlisted', 'Rejected', 'Hired'],
      default: 'Pending'
    }
  }],
  postedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
JobSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Job', JobSchema);
