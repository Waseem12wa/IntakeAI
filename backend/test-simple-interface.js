const fs = require('fs');
const path = require('path');

// Test that our simple interface files exist and are properly configured
async function testSimpleInterface() {
  try {
    console.log('Testing Simple n8n Quote Interface Setup...\n');
    
    // Check that HTML file exists
    const htmlPath = path.join(__dirname, '../frontend/public/n8n-quote.html');
    const htmlExists = fs.existsSync(htmlPath);
    
    console.log('1. Checking HTML file...');
    if (htmlExists) {
      console.log('   ✅ n8n-quote.html found');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      const hasScriptTag = htmlContent.includes('<script src="quote-app.js"></script>');
      console.log(`   ${hasScriptTag ? '✅' : '❌'} Script tag for quote-app.js found: ${hasScriptTag}`);
    } else {
      console.log('   ❌ n8n-quote.html NOT found');
      return;
    }
    
    // Check that JS file exists
    const jsPath = path.join(__dirname, '../frontend/public/quote-app.js');
    const jsExists = fs.existsSync(jsPath);
    
    console.log('\n2. Checking JavaScript file...');
    if (jsExists) {
      console.log('   ✅ quote-app.js found');
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      const hasApiCall = jsContent.includes('/api/n8n-quote/');
      console.log(`   ${hasApiCall ? '✅' : '⚠️'} API endpoint references found: ${hasApiCall}`);
    } else {
      console.log('   ❌ quote-app.js NOT found');
      return;
    }
    
    // Check that server.js references the endpoint
    const serverPath = path.join(__dirname, 'server.js');
    const serverExists = fs.existsSync(serverPath);
    
    console.log('\n3. Checking server configuration...');
    if (serverExists) {
      console.log('   ✅ server.js found');
      const serverContent = fs.readFileSync(serverPath, 'utf8');
      const hasEndpoint = serverContent.includes('/n8n-quote');
      console.log(`   ${hasEndpoint ? '✅' : '⚠️'} /n8n-quote endpoint reference found: ${hasEndpoint}`);
    } else {
      console.log('   ❌ server.js NOT found');
      return;
    }
    
    console.log('\n🎉 Simple interface setup verification completed!');
    console.log('\nTo test the interface:');
    console.log('1. Start the backend server: npm start');
    console.log('2. Navigate to http://localhost:5000/n8n-quote');
    console.log('3. Upload a sample n8n workflow file');
    
  } catch (error) {
    console.error('❌ Error testing interface setup:', error.message);
  }
}

// Run the test
testSimpleInterface();