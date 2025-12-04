const { generatePriceList } = require('./services/priceListGenerator');
const { parseN8nToStructured } = require('./services/n8nWorkflowParser');
const fs = require('fs');
const path = require('path');

console.log('Testing price list generator...');

// Test with a parsed workflow
console.log('\n1. Testing with parsed workflow:');
const validWorkflowPath = path.join(__dirname, '../examples/valid-n8n-workflow.json');
const validWorkflow = JSON.parse(fs.readFileSync(validWorkflowPath, 'utf8'));
const parsedWorkflow = parseN8nToStructured(validWorkflow);

console.log('Parsed workflow:', JSON.stringify(parsedWorkflow, null, 2));

const priceList = generatePriceList(parsedWorkflow);
console.log('\nGenerated price list:', JSON.stringify(priceList, null, 2));

// Test with workflow containing unknown node types
console.log('\n2. Testing with unknown node types:');
const workflowWithUnknownNodes = {
  nodes: [
    {
      node_id: "1",
      node_type: "httpRequest",
      short_label: "Known Node"
    },
    {
      node_id: "2",
      node_type: "unknownNodeType",
      short_label: "Unknown Node"
    },
    {
      node_id: "3",
      node_type: "function",
      short_label: "Another Known Node"
    }
  ]
};

const priceListWithUnknown = generatePriceList(workflowWithUnknownNodes);
console.log('Price list with unknown nodes:', JSON.stringify(priceListWithUnknown, null, 2));

// Test with empty workflow
console.log('\n3. Testing with empty workflow:');
const emptyWorkflow = { nodes: [] };
const emptyPriceList = generatePriceList(emptyWorkflow);
console.log('Empty price list:', JSON.stringify(emptyPriceList, null, 2));

// Test with null input
console.log('\n4. Testing with null input:');
const nullPriceList = generatePriceList(null);
console.log('Null price list:', JSON.stringify(nullPriceList, null, 2));