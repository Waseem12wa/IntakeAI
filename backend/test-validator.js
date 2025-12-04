const { validateN8nWorkflow, validateFileSize } = require('./services/n8nWorkflowValidator');
const fs = require('fs');
const path = require('path');

// Test with valid workflow
console.log('Testing with valid workflow...');
const validWorkflowPath = path.join(__dirname, '../examples/valid-n8n-workflow.json');
const validWorkflow = JSON.parse(fs.readFileSync(validWorkflowPath, 'utf8'));
const validResult = validateN8nWorkflow(validWorkflow);
console.log('Valid workflow result:', validResult);

console.log('\nTesting with invalid workflow...');
const invalidWorkflowPath = path.join(__dirname, '../examples/invalid-n8n-workflow.json');
const invalidWorkflow = JSON.parse(fs.readFileSync(invalidWorkflowPath, 'utf8'));
const invalidResult = validateN8nWorkflow(invalidWorkflow);
console.log('Invalid workflow result:', invalidResult);

console.log('\nTesting file size validation...');
const sizeResult1 = validateFileSize(4 * 1024 * 1024); // 4MB - should pass
console.log('4MB file test:', sizeResult1);

const sizeResult2 = validateFileSize(6 * 1024 * 1024); // 6MB - should fail
console.log('6MB file test:', sizeResult2);