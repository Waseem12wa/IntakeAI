const mongoose = require('mongoose');

const PendingEstimateSchema = new mongoose.Schema({
    jobId: {
        type: String,
        required: true,
        unique: true
    },
    questions: {
        type: Array,
        default: []
    },
    answers: {
        type: Array,
        default: []
    },
    originalEstimate: {
        type: String
    },
    finalEstimate: {
        type: String
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'approved', 'rejected']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Explicitly set to false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('PendingEstimate', PendingEstimateSchema);
