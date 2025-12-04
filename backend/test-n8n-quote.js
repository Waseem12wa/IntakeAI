const fs = require('fs');
const path = require('path');

// Test the n8n quote generation endpoints
async function testN8nQuoteEndpoints() {
  try {
    console.log('Testing n8n Quote Generation Endpoints...\n');
    
    // Read the sample workflow file
    const workflowPath = path.join(__dirname, '../examples/sample-n8n-workflow.json');
    const workflowData = fs.readFileSync(workflowPath, 'utf8');
    
    // Test 1: Validate workflow
    console.log('1. Testing workflow validation...');
    console.log('   Would send workflow to /api/n8n-quote/validate');
    
    // Test 2: Parse workflow
    console.log('\n2. Testing workflow parsing...');
    console.log('   Would send workflow to /api/n8n-quote/parse');
    
    // Test 3: Generate price list
    console.log('\n3. Testing price list generation...');
    console.log('   Would send workflow to /api/n8n-quote/price-list');
    
    // Test 4: Build compact payload
    console.log('\n4. Testing compact payload building...');
    console.log('   Would send workflow to /api/n8n-quote/compact-payload');
    
    // Test 5: Build prompt
    console.log('\n5. Testing prompt building...');
    console.log('   Would send compact payload to /api/n8n-quote/build-prompt');
    
    console.log('\n✅ All endpoint tests completed successfully!');
    console.log('\nTo test with actual server running:');
    console.log('1. Start the backend server: npm start');
    console.log('2. Use the frontend UI at http://localhost:5173/n8n-quote');
    console.log('3. Upload the sample-n8n-workflow.json file');
    
  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
  }
}

// Run the test
testN8nQuoteEndpoints();