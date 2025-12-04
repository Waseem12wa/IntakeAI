const { parseCustomerIntent } = require('./services/intentParser');

console.log('Testing intent parser...');

// Test with sample customer emails
console.log('\n1. Testing with sample customer emails:');

const sampleEmails = [
  "Please increase reliability and add file attachment support. Keep cost low.",
  "This is urgent and needs retry functionality added to all HTTP requests.",
  "Add a webhook node and make it async for better performance.",
  "Increase the timeout to 30 seconds and improve overall reliability.",
  "We need this ASAP with attachment support and cost optimization.",
  "Please add retry logic and boost performance for this workflow.",
  "Hello, I hope you are well. Thanks for your help!",
  ""
];

sampleEmails.forEach((email, index) => {
  console.log(`\nSample ${index + 1}: "${email}"`);
  const result = parseCustomerIntent(email);
  console.log('Parsed intent:', JSON.stringify(result, null, 2));
});

// Test with null and undefined inputs
console.log('\n2. Testing with null and undefined inputs:');
const nullResult = parseCustomerIntent(null);
console.log('Null input result:', JSON.stringify(nullResult, null, 2));

const undefinedResult = parseCustomerIntent(undefined);
console.log('Undefined input result:', JSON.stringify(undefinedResult, null, 2));

// Test with complex email
console.log('\n3. Testing with complex email:');
const complexEmail = "This is an urgent request. Please add retry functionality to all HTTP requests, increase the timeout to 60 seconds, and add file attachment support. Also, make it async for better performance. Keep the cost low and improve overall reliability.";
const complexResult = parseCustomerIntent(complexEmail);
console.log('Complex email result:', JSON.stringify(complexResult, null, 2));