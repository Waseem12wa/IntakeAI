# n8n Workflow Parser

This module parses n8n workflow JSON into a normalized internal structure.

## Features

- Converts raw n8n workflow JSON into structured format
- Handles missing fields gracefully
- Generates consistent parameter hashes for comparison
- Provides metadata about the workflow

## Usage

### Parse a workflow
```javascript
const { parseN8nToStructured } = require('./n8nWorkflowParser');

const workflowJson = { /* n8n workflow JSON */ };
const structuredWorkflow = parseN8nToStructured(workflowJson);

console.log(structuredWorkflow);
```

### Output Format
```json
{
  "nodes": [
    {
      "node_id": "abc123",
      "node_type": "httpRequest",
      "short_label": "Fetch User Data",
      "params_hash": "md5hash",
      "estimated_units": 1
    }
  ],
  "metadata": {
    "total_nodes": 5,
    "workflow_name": "Customer Sync"
  }
}
```

## API Endpoints

### POST /api/n8n-quote/parse
Parses an uploaded n8n workflow JSON file into structured format.

**Request:**
- Form data with `workflow` field containing the JSON file

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "nodes": [...],
    "metadata": {...}
  }
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

## Field Processing

### node_id
- Uses the original `id` from the n8n node
- Generates a unique ID if missing

### node_type
- Extracts the base type from the full n8n type string
- Example: "n8n-nodes-base.httpRequest" → "httpRequest"
- Defaults to "unknown" if missing

### short_label
- Uses the `name` field from the n8n node
- Generates a default name if missing (e.g., "Unnamed httpRequest Node")

### params_hash
- MD5 hash of the node parameters
- Keys are sorted for consistent hashing
- Defaults to hash of empty object if missing

### estimated_units
- Currently defaults to 1 for all nodes
- Will be enhanced in later phases with pricing logic

## Edge Cases Handled

- Missing workflow name
- Missing nodes array
- Nodes with missing required fields
- Null or undefined input
- Parameter objects with inconsistent key ordering