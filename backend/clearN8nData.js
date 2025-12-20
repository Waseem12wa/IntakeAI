/**
 * Script to clear all n8n quotes and projects from the database
 * Run this with: node clearN8nData.js
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import models
const N8nQuoteChat = require('./models/N8nQuoteChat');
const N8nProjectQuote = require('./models/N8nProjectQuote');
const PendingEstimate = require('./models/PendingEstimate');

// Review queue file path
const REVIEW_QUEUE_FILE = path.join(__dirname, 'data/review_queue.json');

async function clearN8nData() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Delete all N8nQuoteChat documents
        console.log('\n🗑️  Deleting N8nQuoteChat documents...');
        const chatResult = await N8nQuoteChat.deleteMany({});
        console.log(`✅ Deleted ${chatResult.deletedCount} N8nQuoteChat documents`);

        // Delete all N8nProjectQuote documents
        console.log('\n🗑️  Deleting N8nProjectQuote documents...');
        const projectResult = await N8nProjectQuote.deleteMany({});
        console.log(`✅ Deleted ${projectResult.deletedCount} N8nProjectQuote documents`);

        // Delete all PendingEstimate documents (projects)
        console.log('\n🗑️  Deleting PendingEstimate documents (projects)...');
        const estimateResult = await PendingEstimate.deleteMany({});
        console.log(`✅ Deleted ${estimateResult.deletedCount} PendingEstimate documents`);

        // Clear review queue file
        console.log('\n🗑️  Clearing review queue...');
        if (fs.existsSync(REVIEW_QUEUE_FILE)) {
            fs.writeFileSync(REVIEW_QUEUE_FILE, JSON.stringify([], null, 2));
            console.log('✅ Review queue cleared');
        } else {
            console.log('ℹ️  Review queue file does not exist');
        }

        console.log('\n✅ All n8n data and projects have been cleared successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - N8nQuoteChat: ${chatResult.deletedCount} deleted`);
        console.log(`   - N8nProjectQuote: ${projectResult.deletedCount} deleted`);
        console.log(`   - PendingEstimate: ${estimateResult.deletedCount} deleted`);
        console.log(`   - Review queue: cleared`);

    } catch (error) {
        console.error('❌ Error clearing n8n data:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 MongoDB connection closed');
        process.exit(0);
    }
}

// Run the script
clearN8nData();
