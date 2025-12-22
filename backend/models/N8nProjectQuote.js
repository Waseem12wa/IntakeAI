const mongoose = require('mongoose');

const N8nProjectQuoteSchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: true
  },
  projectData: {
    type: Object,
    required: false
  },
  quote: {
    type: Object,
    required: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    default: 'pending_approval',
    enum: ['pending_approval', 'approved', 'rejected']
  },
  totalPrice: {
    type: Number
  },
  adminNotes: {
    type: String
  },
  priceBreakdown: {
    type: Object
  },
  reviewedAt: {
    type: Date
  },
  adminId: {
    type: String
  },
  fileName: {
    type: String
  }
});

module.exports = mongoose.model('N8nProjectQuote', N8nProjectQuoteSchema);