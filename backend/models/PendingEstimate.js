const mongoose = require('mongoose');

const PendingEstimateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  jobId: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  originalEstimate: {
    type: String,
    required: true
  },
  aiAnalysis: {
    initialAnalysis: String,
    finalAnalysis: String,
    questionsAndAnswers: [{
      question: String,
      answer: String
    }]
  },
  // Add field to store complete conversation history
  conversationHistory: [{
    role: String,
    text: String
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'edited'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  editedEstimate: {
    type: String,
    default: null
  },
  calculatedPrice: {
    type: String,
    default: null
  },
  priceBreakdown: {
    estimatedWorkHours: { type: String, default: null },
    hourlyRate: { type: String, default: null },
    complexityFactor: { type: String, default: null },
    adminFee: { type: String, default: null },
    commission: { type: String, default: null },
    surcharges: { type: String, default: null },
    discounts: { type: String, default: null }
  },
  // Add field to store complete workflow data
  workflowData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  adminId: {
    type: String, // You can change this to ObjectId if you have admin users
    default: null
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

module.exports = mongoose.model('PendingEstimate', PendingEstimateSchema);