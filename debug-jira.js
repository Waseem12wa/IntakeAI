const axios = require('axios');

async function testJiraConnection() {
  const credentials = {
    email: 'mail@bmaikr.com',
    apiToken: 'xs4-Sign-In-Jira'
  };
  
  const baseUrl = 'https://bmaikr.atlassian.net';
  const apiVersion = '3';
  
  console.log('🔍 Testing Jira connection...');
  console.log('Email:', credentials.email);
  console.log('API Token:', credentials.apiToken);
  console.log('Base URL:', baseUrl);
  
  try {
    // Test 1: Check if the URL is reachable
    console.log('\n1️⃣ Testing URL reachability...');
    const urlTest = await axios.get(baseUrl, { timeout: 5000 });
    console.log('✅ URL is reachable, status:', urlTest.status);
  } catch (error) {
    console.log('❌ URL test failed:', error.message);
    return;
  }
  
  try {
    // Test 2: Test authentication
    console.log('\n2️⃣ Testing authentication...');
    const auth = Buffer.from(`${credentials.email}:${credentials.apiToken}`).toString('base64');
    console.log('Auth token:', auth.substring(0, 20) + '...');
    
    const response = await axios.get(`${baseUrl}/rest/api/${apiVersion}/myself`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Authentication successful!');
    console.log('Response status:', response.status);
    console.log('User data:', response.data);
    
  } catch (error) {
    console.log('❌ Authentication failed:');
    console.log('Error message:', error.message);
    console.log('Error code:', error.code);
    console.log('Response status:', error.response?.status);
    console.log('Response data:', error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Possible solutions:');
      console.log('1. Check if the email is correct');
      console.log('2. Verify the API token is valid');
      console.log('3. Make sure the API token has proper permissions');
      console.log('4. Try generating a new API token from Jira');
    } else if (error.response?.status === 403) {
      console.log('\n💡 Possible solutions:');
      console.log('1. Check API token permissions');
      console.log('2. Verify the user has access to the Jira instance');
    } else if (error.response?.status === 404) {
      console.log('\n💡 Possible solutions:');
      console.log('1. Check if the Jira URL is correct');
      console.log('2. Verify the API version is correct');
    }
  }
}

testJiraConnection();
