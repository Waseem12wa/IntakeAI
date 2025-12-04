// Test script to check if the React component can communicate with the backend API
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch').default;

// Test the backend API endpoints
async function testApiEndpoints() {
  try {
    console.log('Testing API endpoints...');
    
    // Read the sample workflow file
    const filePath = path.join(__dirname, 'project-root', 'examples', 'sample-workflow.json');
    const fileBuffer = fs.readFileSync(filePath);
    
    // Test validation endpoint
    console.log('Testing validation endpoint...');
    const validateFormData = new FormData();
    validateFormData.append('workflow', fileBuffer, 'sample-workflow.json');
    
    const validateResponse = await fetch('http://localhost:5000/api/n8n-quote/validate', {
      method: 'POST',
      body: validateFormData
    });
    
    const validateData = await validateResponse.json();
    console.log('Validation response:', validateData);
    
    if (!validateData.success) {
      console.log('Validation failed:', validateData.message);
      return;
    }
    
    console.log('Validation successful!');
    
    // Test price list endpoint
    console.log('Testing price list endpoint...');
    const priceListFormData = new FormData();
    priceListFormData.append('workflow', fileBuffer, 'sample-workflow.json');
    
    const priceListResponse = await fetch('http://localhost:5000/api/n8n-quote/price-list', {
      method: 'POST',
      body: priceListFormData
    });
    
    const priceListData = await priceListResponse.json();
    console.log('Price list response:', priceListData);
    
    if (!priceListData.success) {
      console.log('Price list generation failed:', priceListData.message);
      return;
    }
    
    console.log('Price list generation successful!');
    console.log('Total price:', priceListData.data.total_price);
    console.log('Number of items:', priceListData.data.items.length);
    
  } catch (error) {
    console.error('Error testing API endpoints:', error);
  }
}

// Run the test
testApiEndpoints();