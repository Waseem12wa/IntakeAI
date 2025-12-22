require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./models/Project'); // Adjust path if needed
const N8nQuote = require('./models/N8nQuote'); // Adjust path if needed

const clearData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Delete all N8nQuotes that are Approved or Rejected (keep Pending for testing if desired, or delete all?)
        // User asked: "delete all the previos data from database that approved by admin already"
        const deleteResult = await N8nQuote.deleteMany({ status: { $in: ['Approved', 'Rejected', 'Completed'] } });
        console.log(`Deleted ${deleteResult.deletedCount} processed quotes.`);

        // 2. Reset Projects that were linked to these quotes
        // We want to effectively "Un-approve" them so they show as pending again or just clean them up?
        // "Approved quotes... likely referring to the ghosting ones".
        // Let's reset any Active project that came from n8n to 'Analysis In Progress' or similar if that's the start state.
        // Or just clear the approvedQuoteId.

        const updateResult = await Project.updateMany(
            { approvedQuoteId: { $exists: true, $ne: null } },
            {
                $unset: { approvedQuoteId: "", n8nPricing: "" },
                $set: { status: 'Analysis In Progress' } // Reset status
            }
        );
        console.log(`Reset ${updateResult.modifiedCount} projects.`);

        process.exit(0);
    } catch (error) {
        console.error('Error clearing data:', error);
        process.exit(1);
    }
};

clearData();
