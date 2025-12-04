const { buildCompactPayload, comparePayloadSizes } = require('./services/llmPayloadBuilder');

console.log('Testing LLM payload builder...');

// Test with a sample price list
console.log('\n1. Testing with sample price list:');
const samplePriceList = {
  items: [
    {
      id: "n1",
      label: "HTTP Request - Get Users",
      node_type: "httpRequest",
      base_price: 10.0,
      modifiers: ["concurrency", "attachment_mb"],
      notes: "Min $5, Max $200",
      params_hash: "abc123",
      estimated_units: 1
    },
    {
      id: "n2",
      label: "Webhook Receiver",
      node_type: "webhook",
      base_price: 8.0,
      modifiers: ["payload_size_kb", "auth_required"],
      notes: "Min $4, Max $150"
    },
    {
      id: "n3",
      label: "Data Transformation",
      node_type: "set",
      base_price: 5.0,
      modifiers: ["field_count", "complexity"],
      notes: "Min $3, Max $100",
      requires_manual_review: true
    }
  ],
  summary: {
    total_items: 3,
    estimated_base_total: 23.0
  }
};

const customerText = "Please increase reliability and add file attachment support. Keep cost low.";
const businessRules = {
  allow_new_item: false,
  approval_threshold_percent: 20,
  max_price_increase_percent: 50
};

const compactPayload = buildCompactPayload(samplePriceList, customerText, businessRules);
console.log('Compact payload:', JSON.stringify(compactPayload, null, 2));

// Test payload size comparison
console.log('\n2. Testing payload size comparison:');
const sizeComparison = comparePayloadSizes(samplePriceList, compactPayload);
console.log('Size comparison:', JSON.stringify(sizeComparison, null, 2));

// Test with empty price list
console.log('\n3. Testing with empty price list:');
const emptyPriceList = { items: [], summary: { total_items: 0, estimated_base_total: 0 } };
const emptyPayload = buildCompactPayload(emptyPriceList, "Customer request", {});
console.log('Empty payload:', JSON.stringify(emptyPayload, null, 2));

// Test with null input
console.log('\n4. Testing with null input:');
const nullPayload = buildCompactPayload(null, "Customer request", {});
console.log('Null payload:', JSON.stringify(nullPayload, null, 2));