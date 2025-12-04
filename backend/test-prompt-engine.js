const { buildPrompt } = require('./services/promptEngine');

console.log('Testing prompt engine...');

// Test with sample compact payloads
console.log('\n1. Testing with sample compact payloads:');

const samplePayloads = [
  {
    workflow: [
      { id: "n1", label: "HTTP Request - Get Users", base: 10, modifiers: ["concurrency", "attachment_mb"] },
      { id: "n2", label: "Webhook Receiver", base: 8, modifiers: ["payload_size_kb", "auth_required"] }
    ],
    customer_text: "Please increase reliability and add file attachment support. Keep cost low.",
    business_rules: {
      allow_new_item: false,
      approval_threshold_percent: 20,
      max_price_increase_percent: 50
    }
  },
  {
    workflow: [
      { id: "n1", label: "Function Node", base: 15, modifiers: ["lines_of_code", "external_libs"] },
      { id: "n2", label: "Database Query", base: 12, modifiers: ["query_complexity", "result_size_mb"] }
    ],
    customer_text: "This is urgent and needs retry functionality added to all HTTP requests.",
    business_rules: {
      allow_new_item: true,
      approval_threshold_percent: 15,
      max_price_increase_percent: 30
    }
  },
  {
    workflow: [
      { id: "n1", label: "Schedule Trigger", base: 7, modifiers: ["frequency", "timezone_handling"] },
      { id: "n2", label: "Email Send", base: 3, modifiers: ["recipient_count", "attachment_mb"] }
    ],
    customer_text: "Add a webhook node and make it async for better performance.",
    business_rules: {
      allow_new_item: false,
      approval_threshold_percent: 25,
      max_price_increase_percent: 40
    }
  }
];

samplePayloads.forEach((payload, index) => {
  console.log(`\nSample ${index + 1}:`);
  console.log(`Customer request: "${payload.customer_text}"`);
  
  const prompts = buildPrompt(payload);
  
  console.log('\nSystem Prompt:');
  console.log(prompts.system.substring(0, 200) + '...'); // Truncate for readability
  
  console.log('\nUser Prompt:');
  console.log(prompts.user);
});

// Test with null input
console.log('\n2. Testing with null input:');
const nullPrompts = buildPrompt(null);
console.log('System Prompt (first 100 chars):', nullPrompts.system.substring(0, 100) + '...');
console.log('User Prompt:', nullPrompts.user);

// Test with empty payload
console.log('\n3. Testing with empty payload:');
const emptyPayload = {
  workflow: [],
  customer_text: '',
  business_rules: {}
};
const emptyPrompts = buildPrompt(emptyPayload);
console.log('User Prompt with empty payload:');
console.log(emptyPrompts.user);