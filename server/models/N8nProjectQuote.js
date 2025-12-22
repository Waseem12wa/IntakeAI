const mongoose = require('mongoose');

const N8nProjectQuoteSchema = new mongoose.Schema({
    projectId: {
        type: String,
        required: true
    },
    projectData: {
        type: Object,
        required: true
    },
    quote: {
        type: Object,
        required: true
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

module.exports = mongoose.model('N8nProjectQuote', N8nProjectQuoteSchema);
