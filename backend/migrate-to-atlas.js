/**
 * MongoDB Migration Script
 * Migrates data from localhost MongoDB to MongoDB Atlas
 * 
 * Usage: node migrate-to-atlas.js
 */

const mongoose = require('mongoose');

// Connection strings
const LOCALHOST_URI = 'mongodb://localhost:27017/intakeai';
const ATLAS_URI = 'mongodb+srv://intake:1234@cluster0.wvrfuwo.mongodb.net/intakeai?retryWrites=true&w=majority';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function migrateData() {
  let localConnection = null;
  let atlasConnection = null;

  try {
    log('\n🚀 Starting MongoDB Migration...', 'cyan');
    log('━'.repeat(60), 'cyan');

    // Connect to localhost
    log('\n📡 Connecting to localhost MongoDB...', 'yellow');
    localConnection = await mongoose.createConnection(LOCALHOST_URI).asPromise();
    log('✅ Connected to localhost MongoDB', 'green');

    // Connect to Atlas
    log('\n📡 Connecting to MongoDB Atlas...', 'yellow');
    atlasConnection = await mongoose.createConnection(ATLAS_URI).asPromise();
    log('✅ Connected to MongoDB Atlas', 'green');

    // Get all collections from localhost
    log('\n📋 Fetching collections from localhost...', 'yellow');
    const collections = await localConnection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (collectionNames.length === 0) {
      log('⚠️  No collections found in localhost database', 'yellow');
      return;
    }

    log(`📦 Found ${collectionNames.length} collection(s): ${collectionNames.join(', ')}`, 'blue');

    // Migrate each collection
    log('\n🔄 Starting migration...', 'cyan');
    log('━'.repeat(60), 'cyan');

    let totalDocuments = 0;
    const migrationResults = [];

    for (const collectionName of collectionNames) {
      try {
        log(`\n📁 Processing collection: ${collectionName}`, 'yellow');

        // Get data from localhost
        const localCollection = localConnection.db.collection(collectionName);
        const documents = await localCollection.find({}).toArray();

        if (documents.length === 0) {
          log(`   ⚠️  Collection "${collectionName}" is empty, skipping...`, 'yellow');
          migrationResults.push({ collection: collectionName, count: 0, status: 'empty' });
          continue;
        }

        log(`   📊 Found ${documents.length} document(s)`, 'blue');

        // Insert into Atlas
        const atlasCollection = atlasConnection.db.collection(collectionName);
        
        // Clear existing data in Atlas (optional - comment out if you want to keep existing data)
        const existingCount = await atlasCollection.countDocuments();
        if (existingCount > 0) {
          log(`   🗑️  Clearing ${existingCount} existing document(s) in Atlas...`, 'yellow');
          await atlasCollection.deleteMany({});
        }

        // Insert documents
        log(`   ⬆️  Uploading ${documents.length} document(s) to Atlas...`, 'yellow');
        await atlasCollection.insertMany(documents);
        
        totalDocuments += documents.length;
        migrationResults.push({ collection: collectionName, count: documents.length, status: 'success' });
        
        log(`   ✅ Successfully migrated ${documents.length} document(s)`, 'green');

      } catch (error) {
        log(`   ❌ Error migrating collection "${collectionName}": ${error.message}`, 'red');
        migrationResults.push({ collection: collectionName, count: 0, status: 'failed', error: error.message });
      }
    }

    // Summary
    log('\n' + '━'.repeat(60), 'cyan');
    log('📊 MIGRATION SUMMARY', 'cyan');
    log('━'.repeat(60), 'cyan');

    migrationResults.forEach(result => {
      const icon = result.status === 'success' ? '✅' : result.status === 'empty' ? '⚠️' : '❌';
      const color = result.status === 'success' ? 'green' : result.status === 'empty' ? 'yellow' : 'red';
      log(`${icon} ${result.collection}: ${result.count} documents (${result.status})`, color);
    });

    log('\n📈 Total documents migrated: ' + totalDocuments, 'green');
    log('✨ Migration completed successfully!', 'green');

  } catch (error) {
    log('\n❌ Migration failed:', 'red');
    log(error.message, 'red');
    console.error(error);
    process.exit(1);

  } finally {
    // Close connections
    if (localConnection) {
      await localConnection.close();
      log('\n🔌 Disconnected from localhost', 'blue');
    }
    if (atlasConnection) {
      await atlasConnection.close();
      log('🔌 Disconnected from Atlas', 'blue');
    }
  }
}

// Verify connections before migration
async function verifyConnections() {
  log('\n🔍 Verifying connections...', 'cyan');
  
  try {
    // Test localhost
    log('   Testing localhost connection...', 'yellow');
    const localTest = await mongoose.createConnection(LOCALHOST_URI).asPromise();
    await localTest.close();
    log('   ✅ Localhost connection OK', 'green');

    // Test Atlas
    log('   Testing Atlas connection...', 'yellow');
    const atlasTest = await mongoose.createConnection(ATLAS_URI).asPromise();
    await atlasTest.close();
    log('   ✅ Atlas connection OK', 'green');

    return true;
  } catch (error) {
    log('   ❌ Connection verification failed:', 'red');
    log('   ' + error.message, 'red');
    return false;
  }
}

// Main execution
(async () => {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║         MongoDB Migration Tool - Localhost to Atlas        ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');

  log('\n📝 Configuration:', 'blue');
  log(`   Source:      ${LOCALHOST_URI}`, 'blue');
  log(`   Destination: mongodb+srv://intake:****@cluster0.wvrfuwo.mongodb.net/intakeai`, 'blue');

  // Verify connections first
  const connectionsOk = await verifyConnections();
  
  if (!connectionsOk) {
    log('\n❌ Please fix connection issues before proceeding.', 'red');
    log('\nTroubleshooting:', 'yellow');
    log('  1. Make sure localhost MongoDB is running', 'yellow');
    log('  2. Verify Atlas connection string is correct', 'yellow');
    log('  3. Check MongoDB Atlas Network Access (whitelist 0.0.0.0/0)', 'yellow');
    log('  4. Verify username and password are correct', 'yellow');
    process.exit(1);
  }

  // Ask for confirmation
  log('\n⚠️  WARNING: This will REPLACE all data in Atlas with localhost data!', 'yellow');
  log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...', 'yellow');

  await new Promise(resolve => setTimeout(resolve, 5000));

  // Run migration
  await migrateData();

  log('\n✅ All done! Your data has been migrated to MongoDB Atlas.', 'green');
  log('🎉 You can now deploy your application on Render!\n', 'green');

  process.exit(0);
})();
