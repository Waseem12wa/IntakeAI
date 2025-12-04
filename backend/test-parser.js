const { parseN8nToStructured } = require('./services/n8nWorkflowParser');
const fs = require('fs');
const path = require('path');

// Test with valid workflow
console.log('Testing parser with valid workflow...');
const validWorkflowPath = path.join(__dirname, '../examples/valid-n8n-workflow.json');
const validWorkflow = JSON.parse(fs.readFileSync(validWorkflowPath, 'utf8'));
const parsedResult = parseN8nToStructured(validWorkflow);
console.log('Parsed workflow result:', JSON.stringify(parsedResult, null, 2));

console.log('\nTesting parser with edge cases...');

// Test with missing fields
const incompleteWorkflow = {
  name: "Incomplete Workflow",
  nodes: [
    {
      // Missing all required fields
    },
    {
      id: "2",
      // Missing type, name, parameters
    }
  ]
};

const incompleteResult = parseN8nToStructured(incompleteWorkflow);
console.log('Incomplete workflow result:', JSON.stringify(incompleteResult, null, 2));

// Test with null input
const nullResult = parseN8nToStructured(null);
console.log('Null input result:', JSON.stringify(nullResult, null, 2));