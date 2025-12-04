const { parseAndValidateLlmResponse } = require('./services/llmResponseParser');

console.log('Testing LLM response parser...');

// Test with a valid LLM response
console.log('\n1. Testing with valid LLM response:');
const originalWorkflow = {
  workflow: [
    { id: "n1", label: "HTTP Request", base: 10, modifiers: ["concurrency"], node_type: "httpRequest" },
    { id: "n2", label: "Webhook", base: 8, modifiers: ["payload_size_kb"], node_type: "webhook" }
  ],
  customer_text: "Please optimize this workflow",
  business_rules: { allow_new_item: false, approval_threshold_percent: 20 }
};

const validLlmResponse = {
  quote: {
    items: [
      {
        item_id: "n1",
        action: "adjust",
        requested_change: "Add concurrency support",
        new_price: 15.0,
        price_delta: 5.0,
        reason: "Added concurrency modifier",
        mapping_confidence: 0.9,
        requires_manual_review: false
      },
      {
        item_id: "n2",
        action: "adjust",
        requested_change: "Increase payload size",
        new_price: 12.0,
        price_delta: 4.0,
        reason: "Increased payload size modifier",
        mapping_confidence: 0.85,
        requires_manual_review: false
      }
    ],
    total_price: 27.0,
    total_delta: 9.0,
    flags: ["ok"],
    remarks: "Optimized workflow with concurrency support and increased payload size"
  }
};

const validResult = parseAndValidateLlmResponse(validLlmResponse, originalWorkflow);
console.log('Valid response result:', JSON.stringify(validResult, null, 2));

// Test with invented item ID
console.log('\n2. Testing with invented item ID:');
const inventedItemResponse = {
  quote: {
    items: [
      {
        item_id: "n3", // This doesn't exist in original workflow
        action: "add",
        requested_change: "Add new functionality",
        new_price: 15.0,
        price_delta: 15.0,
        reason: "New node",
        mapping_confidence: 0.9,
        requires_manual_review: false
      }
    ],
    total_price: 15.0,
    total_delta: 15.0,
    flags: ["ok"],
    remarks: "Added new functionality"
  }
};

const inventedItemResult = parseAndValidateLlmResponse(inventedItemResponse, originalWorkflow);
console.log('Invented item result:', JSON.stringify(inventedItemResult, null, 2));

// Test with impossible price
console.log('\n3. Testing with impossible price:');
const impossiblePriceResponse = {
  quote: {
    items: [
      {
        item_id: "n1",
        action: "adjust",
        requested_change: "Extreme optimization",
        new_price: 300.0, // Way above max price for httpRequest (200)
        price_delta: 290.0,
        reason: "Maximum optimization",
        mapping_confidence: 0.9,
        requires_manual_review: false
      }
    ],
    total_price: 300.0,
    total_delta: 290.0,
    flags: ["ok"],
    remarks: "Extreme optimization applied"
  }
};

const impossiblePriceResult = parseAndValidateLlmResponse(impossiblePriceResponse, originalWorkflow);
console.log('Impossible price result:', JSON.stringify(impossiblePriceResult, null, 2));

// Test with low confidence
console.log('\n4. Testing with low confidence:');
const lowConfidenceResponse = {
  quote: {
    items: [
      {
        item_id: "n1",
        action: "adjust",
        requested_change: "Uncertain change",
        new_price: 12.0,
        price_delta: 2.0,
        reason: "Not sure about this",
        mapping_confidence: 0.3, // Low confidence
        requires_manual_review: false
      }
    ],
    total_price: 12.0,
    total_delta: 2.0,
    flags: ["ok"],
    remarks: "Made some changes"
  }
};

const lowConfidenceResult = parseAndValidateLlmResponse(lowConfidenceResponse, originalWorkflow);
console.log('Low confidence result:', JSON.stringify(lowConfidenceResult, null, 2));

// Test with malformed JSON
console.log('\n5. Testing with malformed JSON:');
const malformedResult = parseAndValidateLlmResponse(null, originalWorkflow);
console.log('Malformed JSON result:', JSON.stringify(malformedResult, null, 2));

// Test with missing fields
console.log('\n6. Testing with missing fields:');
const missingFieldsResponse = {
  quote: {
    items: [
      {
        item_id: "n1"
        // Missing all other required fields
      }
    ],
    total_price: 10.0
    // Missing other required fields
  }
};

const missingFieldsResult = parseAndValidateLlmResponse(missingFieldsResponse, originalWorkflow);
console.log('Missing fields result:', JSON.stringify(missingFieldsResult, null, 2));