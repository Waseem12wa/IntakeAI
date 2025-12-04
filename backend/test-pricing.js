const { 
  getPricingForNodeType, 
  calculatePriceForNode, 
  getAvailableNodeTypes,
  getGlobalModifiers
} = require('./services/pricingService');

console.log('Testing pricing service...');

// Test getting pricing for a node type
console.log('\n1. Testing getPricingForNodeType:');
const httpRequestPricing = getPricingForNodeType('httpRequest');
console.log('HTTP Request pricing:', JSON.stringify(httpRequestPricing, null, 2));

// Test calculating price for a node with modifiers
console.log('\n2. Testing calculatePriceForNode:');
const priceCalculation = calculatePriceForNode('httpRequest', {
  concurrency: 3,
  attachment_mb: 10
});
console.log('Price calculation result:', JSON.stringify(priceCalculation, null, 2));

// Test with a function node
console.log('\n3. Testing function node pricing:');
const functionPrice = calculatePriceForNode('function', {
  lines_of_code: 150,
  external_libs: 3
});
console.log('Function node price:', JSON.stringify(functionPrice, null, 2));

// Test with boolean modifier
console.log('\n4. Testing boolean modifier:');
const webhookPrice = calculatePriceForNode('webhook', {
  auth_required: true,
  payload_size_kb: 50
});
console.log('Webhook price with auth:', JSON.stringify(webhookPrice, null, 2));

// Test available node types
console.log('\n5. Available node types:');
const nodeTypes = getAvailableNodeTypes();
console.log(nodeTypes);

// Test global modifiers
console.log('\n6. Global modifiers:');
const globalModifiers = getGlobalModifiers();
console.log(globalModifiers);

// Test invalid node type
console.log('\n7. Testing invalid node type:');
const invalidPrice = calculatePriceForNode('invalidNodeType');
console.log('Invalid node type result:', JSON.stringify(invalidPrice, null, 2));