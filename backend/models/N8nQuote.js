const mongoose = require('mongoose');

const N8nQuoteSchema = new mongoose.Schema({
    projectId: {
        type: String,
        required: true
    },
    projectName: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    pricing: {
        type: Number, // Assuming simple number or object, adjusting based on usage
        required: false
    },
    status: {
        type: String,
        default: 'Pending',
        enum: ['Pending', 'Approved', 'Rejected', 'Completed']
    },
    queueId: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { strict: false }); // Strict false to allow extra fields if needed

module.exports = mongoose.model('N8nQuote', N8nQuoteSchema);
