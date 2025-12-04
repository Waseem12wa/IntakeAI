# Compact LLM Payload Builder

This module builds a compact payload for LLM processing to minimize token usage while retaining essential information.

## Features

- Creates compact payloads with only essential information
- Removes detailed descriptions, parameter hashes, and internal metadata
- Estimates token count reduction
- Compares payload sizes between full and compact versions

## Usage

### Build compact payload
```javascript
const { buildCompactPayload } = require('./llmPayloadBuilder');

const priceList = { /* structured price list */ };
const customerText = "Please optimize this workflow";
const businessRules = { allow_new_item: false, approval_threshold_percent: 20 };

const compactPayload = buildCompactPayload(priceList, customerText, businessRules);

console.log(compactPayload);
```

### Output Format
```json
{
  "workflow": [
    { "id": "n1", "label": "HTTP Request", "base": 10, "modifiers": ["attachments_mb", "concurrency"] }
  ],
  "customer_text": "Please increase reliability and add file attachment support. Keep cost low.",
  "business_rules": {
    "allow_new_item": false,
    "approval_threshold_percent": 20,
    "max_price_increase_percent": 50
  }
}
```

### Estimate token count
```javascript
const { estimateTokenCount } = require('./llmPayloadBuilder');

const tokenCount = estimateTokenCount("Text to estimate tokens for");
```

### Compare payload sizes
```javascript
const { comparePayloadSizes } = require('./llmPayloadBuilder');

const comparison = comparePayloadSizes(fullPayload, compactPayload);
```

## API Endpoints

### POST /api/n8n-quote/compact-payload
Generates a compact payload for LLM processing from an uploaded n8n workflow JSON file.

**Request:**
- Form data with `workflow` field containing the JSON file
- Optional form fields: `customer_text`, `business_rules`

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "workflow": [...],
    "customer_text": "...",
    "business_rules": {...}
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

## Payload Structure

### Workflow Items
Each workflow item contains only essential information:
- **id**: Node identifier
- **label**: Human-readable label
- **base**: Base price
- **modifiers**: List of available modifiers

### Customer Text
Customer instructions or requirements for the workflow.

### Business Rules
Business rules for processing:
- **allow_new_item**: Whether new items can be added
- **approval_threshold_percent**: Approval threshold percentage
- **max_price_increase_percent**: Maximum price increase percentage

## Size Reduction

The compact payload builder significantly reduces token usage by:
1. Removing detailed descriptions
2. Removing parameter hashes
3. Removing internal metadata
4. Keeping only essential fields for LLM processing

## Error Handling

- Gracefully handles empty or null inputs
- Provides appropriate defaults for missing information
- Maintains payload structure even with incomplete data

## Integration

The LLM payload builder integrates with:
- [priceListGenerator.js](file:///c:\Users\alyba\Documents\Intake.Ai\IntakeAI\IntakeAI\project-root\backend\services\priceListGenerator.js) for structured price list input