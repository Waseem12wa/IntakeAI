const mongoose = require('mongoose');

const N8nProjectQuoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Project identification
  projectId: {
    type: String,
    required: true,
    index: true
  },
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

  // Customer information
  customerEmail: {
    type: String,
    required: false,
    validate: {
      validator: function (v) {
        // Allow null, undefined, or non-empty strings
        return v == null || v.length > 0;
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  customerRequest: {
    type: String,
    default: ''
  },

  // Quote status and approval
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'rejected', 'completed'],
    default: 'draft'
  },
  adminId: {
    type: String,
    default: null
  },
  adminNotes: {
    type: String,
    default: ''
  },

  // Pricing details
  basePrice: {
    type: Number,
    required: true
  },
  modificationsPrice: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    required: true
  },

  // Detailed price breakdown
  priceBreakdown: {
    estimatedWorkHours: { type: Number, default: 0 },
    hourlyRate: { type: Number, default: 0 },
    complexityFactor: { type: Number, default: 1 },
    adminFee: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
    surcharges: { type: Number, default: 0 },
    discounts: { type: Number, default: 0 }
  },

  // Node details with individual pricing
  nodes: [{
    nodeId: {
      type: String,
      required: true
    },
    nodeLabel: {
      type: String,
      required: true
    },
    nodeType: {
      type: String,
      required: true
    },
    basePrice: {
      type: Number,
      required: true
    },
    modifiers: [{
      name: String,
      type: String,
      value: mongoose.Schema.Types.Mixed,
      price: Number
    }],
    totalPrice: {
      type: Number,
      required: true
    },
    requiresManualReview: {
      type: Boolean,
      default: false
    }
  }],

  // Modifications requested
  modifications: [{
    description: String,
    price: Number,
    requiresApproval: {
      type: Boolean,
      default: false
    },
    approved: {
      type: Boolean,
      default: false
    }
  }],

  // Workflow data
  workflowData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  // Integration status tracking
  integrationStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending'
  },
  integrationCompletedAt: {
    type: Date,
    default: null
  },
  integrationError: {
    type: String,
    default: null
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date,
    default: null
  }
});

// Update the updatedAt field before saving
N8nProjectQuoteSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('N8nProjectQuote', N8nProjectQuoteSchema);