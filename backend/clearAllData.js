/**
 * Comprehensive script to clear ALL data from the database
 * Run this with: node clearAllData.js
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import ALL models
const N8nQuoteChat = require('./models/N8nQuoteChat');
const N8nProjectQuote = require('./models/N8nProjectQuote');
const PendingEstimate = require('./models/PendingEstimate');

// Review queue file path
const REVIEW_QUEUE_FILE = path.join(__dirname, 'data/review_queue.json');

async function clearAllData() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'NOT FOUND');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully');
        console.log('Database:', mongoose.connection.db.databaseName);

        // Count documents before deletion
        console.log('\n📊 Counting documents before deletion...');
        const chatCount = await N8nQuoteChat.countDocuments();
        const projectCount = await N8nProjectQuote.countDocuments();
        const estimateCount = await PendingEstimate.countDocuments();

        console.log(`   - N8nQuoteChat: ${chatCount} documents`);
        console.log(`   - N8nProjectQuote: ${projectCount} documents`);
        console.log(`   - PendingEstimate: ${estimateCount} documents`);

        if (chatCount === 0 && projectCount === 0 && estimateCount === 0) {
            console.log('\n✅ Database is already clean!');
        } else {
            console.log('\n🗑️  Starting deletion...');

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

            console.log('\n✅ All database records have been deleted!');
        }

        // Clear review queue file
        console.log('\n🗑️  Clearing review queue file...');
        if (fs.existsSync(REVIEW_QUEUE_FILE)) {
            const queueData = JSON.parse(fs.readFileSync(REVIEW_QUEUE_FILE, 'utf8'));
            console.log(`   - Review queue has ${queueData.length} items`);
            fs.writeFileSync(REVIEW_QUEUE_FILE, JSON.stringify([], null, 2));
            console.log('✅ Review queue cleared');
        } else {
            console.log('ℹ️  Review queue file does not exist');
        }

        // Verify deletion
        console.log('\n📊 Verifying deletion...');
        const finalChatCount = await N8nQuoteChat.countDocuments();
        const finalProjectCount = await N8nProjectQuote.countDocuments();
        const finalEstimateCount = await PendingEstimate.countDocuments();

        console.log(`   - N8nQuoteChat: ${finalChatCount} documents remaining`);
        console.log(`   - N8nProjectQuote: ${finalProjectCount} documents remaining`);
        console.log(`   - PendingEstimate: ${finalEstimateCount} documents remaining`);

        if (finalChatCount === 0 && finalProjectCount === 0 && finalEstimateCount === 0) {
            console.log('\n✅✅✅ SUCCESS! Database is completely clean!');
        } else {
            console.log('\n⚠️  WARNING: Some documents still remain!');
        }

        console.log('\n📋 Final Summary:');
        console.log(`   - N8nQuoteChat: ${chatCount} → ${finalChatCount}`);
        console.log(`   - N8nProjectQuote: ${projectCount} → ${finalProjectCount}`);
        console.log(`   - PendingEstimate: ${estimateCount} → ${finalEstimateCount}`);
        console.log(`   - Review queue: cleared`);

    } catch (error) {
        console.error('\n❌ Error clearing data:', error);
        console.error('Error details:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 MongoDB connection closed');
        process.exit(0);
    }
}

// Run the script
clearAllData();
