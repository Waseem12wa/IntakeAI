const mongoose = require('mongoose');

const EmployerProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  contactName: {
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
  website: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    required: true,
    enum: ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Retail', 'Consulting', 'Marketing', 'Other']
  },
  companySize: {
    type: String,
    required: true,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  companyType: {
    type: String,
    required: true,
    enum: ['Private', 'Public', 'Startup', 'Non-profit', 'Government', 'Agency'],
    default: 'Private'
  },
  hiringNeeds: {
    type: String,
    enum: ['Immediate', 'Next 30 days', 'Next 3 months', 'Ongoing', 'Project-based']
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  benefits: {
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
EmployerProfileSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('EmployerProfile', EmployerProfileSchema);
