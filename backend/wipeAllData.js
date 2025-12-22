require('dotenv').config();
const mongoose = require('mongoose');

// Import all relevant models (using bare mongoose names if file paths are tricky, but requiring files is safer)
// We'll try to rely on collection names or strict model requirements
const Project = require('./models/Project');
const N8nQuote = require('./models/N8nQuote');
const PendingEstimate = require('./models/PendingEstimate');
const N8nProjectQuote = require('./models/N8nProjectQuote');
// Check if Quote model exists
// const Quote = require('./models/Quote'); 

const wipeData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        console.log('Deleting all N8nQuotes...');
        await N8nQuote.deleteMany({});

        console.log('Deleting all N8nProjectQuotes...');
        await N8nProjectQuote.deleteMany({});

        console.log('Deleting all PendingEstimates...');
        await PendingEstimate.deleteMany({});

        console.log('Deleting all Projects...');
        await Project.deleteMany({});

        console.log('Data wipe complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error wiping data:', error);
        process.exit(1);
    }
};

wipeData();
