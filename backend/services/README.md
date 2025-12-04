# n8n Workflow Validator

This module provides validation for n8n workflow JSON files.

## Features

- Validates n8n workflow structure against JSON schema
- Checks file size limits (5MB default)
- Returns detailed error messages with path information
- Handles JSON parsing errors

## Usage

### Validate a workflow object
```javascript
const { validateN8nWorkflow } = require('./n8nWorkflowValidator');

const workflowData = { /* n8n workflow JSON */ };
const result = validateN8nWorkflow(workflowData);

if (result.isValid) {
  console.log('Valid workflow');
} else {
  console.log('Invalid workflow:', result.message);
}
```

### Validate file size
```javascript
const { validateFileSize } = require('./n8nWorkflowValidator');

const result = validateFileSize(fileSizeInBytes, maxSizeInBytes);
```

## API Endpoints

### POST /api/n8n-quote/validate
Validates an uploaded n8n workflow JSON file.

**Request:**
- Form data with `workflow` field containing the JSON file

**Response (Success):**
```json
{
  "success": true,
  "message": "Workflow validation successful"
}
```

**Response (Error):**
```json
{
  "error": "INVALID_N8N_SCHEMA",
  "message": "human readable description",
  "details": { "path": "nodes[3].type", "reason": "missing required field" }
}
```

## Error Types

- `INVALID_N8N_SCHEMA` - Workflow doesn't match expected structure
- `FILE_TOO_LARGE` - File exceeds size limit
- `INVALID_JSON` - File is not valid JSON
- `FILE_READ_ERROR` - Error reading the file
- `NO_FILE_UPLOADED` - No file provided
- `INVALID_FILE_TYPE` - File is not JSON

## Testing

Run the unit tests:
```bash
npm test
```