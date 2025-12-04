const { 
  loadTranslationKey, 
  lookupByNodeType, 
  applyModifier, 
  computePrice 
} = require('./services/translationKey');

console.log('Testing translation key loader module...');

// Test loading translation key
console.log('\n1. Testing loadTranslationKey:');
const key = loadTranslationKey();
console.log('Translation key loaded with', Object.keys(key.node_types).length, 'node types');

// Test lookup by node type
console.log('\n2. Testing lookupByNodeType:');
const httpRequestItem = lookupByNodeType('httpRequest');
console.log('HTTP Request item:', JSON.stringify(httpRequestItem, null, 2));

// Test apply modifier
console.log('\n3. Testing applyModifier:');
const concurrencyModifier = applyModifier(httpRequestItem, 'concurrency', 3);
console.log('Concurrency modifier result:', JSON.stringify(concurrencyModifier, null, 2));

const attachmentModifier = applyModifier(httpRequestItem, 'attachment_mb', 5);
console.log('Attachment modifier result:', JSON.stringify(attachmentModifier, null, 2));

// Test compute price (matching the example in requirements)
console.log('\n4. Testing computePrice (example from requirements):');
const item = lookupByNodeType('httpRequest');
const price = computePrice(item, { 'attachment_mb': 5, 'concurrency': 3 });
console.log('Price calculation result:', JSON.stringify(price, null, 2));

// Test with a different node type
console.log('\n5. Testing computePrice with function node:');
const functionItem = lookupByNodeType('function');
const functionPrice = computePrice(functionItem, { 
  'lines_of_code': 100, 
  'external_libs': 2 
});
console.log('Function node price:', JSON.stringify(functionPrice, null, 2));

// Test with boolean modifier
console.log('\n6. Testing computePrice with boolean modifier:');
const webhookItem = lookupByNodeType('webhook');
const webhookPrice = computePrice(webhookItem, { 
  'auth_required': true,
  'payload_size_kb': 25
});
console.log('Webhook price with auth:', JSON.stringify(webhookPrice, null, 2));

// Test invalid node type
console.log('\n7. Testing with invalid node type:');
const invalidItem = lookupByNodeType('invalidNodeType');
console.log('Invalid item:', invalidItem);

const invalidPrice = computePrice(invalidItem, { 'some_modifier': 5 });
console.log('Price for invalid item:', JSON.stringify(invalidPrice, null, 2));