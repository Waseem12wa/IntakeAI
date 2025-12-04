const mongoose = require('mongoose');

const N8nQuoteChatSchema = new mongoose.Schema({
  workflowId: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'ai'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  modifications: {
    type: String,
    default: ''
  },
  totalPrice: {
    type: Number,
    required: true
  },
  basePrice: {
    type: Number,
    required: true
  },
  modificationsPrice: {
    type: Number,
    default: 0
  },
  items: [{
    nodeId: String,
    nodeLabel: String,
    nodeType: String,
    basePrice: Number,
    totalPrice: Number
  }],
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
N8nQuoteChatSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('N8nQuoteChat', N8nQuoteChatSchema);