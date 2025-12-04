# Structured Price List Generator

This module generates a structured price list by combining parsed workflow structure with the translation key.

## Features

- Generates structured price list from parsed workflow
- Looks up pricing information for each node type
- Handles unmapped node types by marking them as "requires_manual_review"
- Provides summary with total items and estimated base total

## Usage

### Generate price list
```javascript
const { generatePriceList } = require('./priceListGenerator');

const structuredWorkflow = { /* parsed workflow structure */ };
const priceList = generatePriceList(structuredWorkflow);

console.log(priceList);
```

### Output Format
```json
{
  "items": [
    {
      "id": "n1",
      "label": "HTTP Request - Get Users",
      "node_type": "httpRequest",
      "base_price": 10.0,
      "modifiers": ["concurrency", "attachment_mb"],
      "notes": "Min $5, Max $200"
    }
  ],
  "summary": {
    "total_items": 5,
    "estimated_base_total": 50.0
  }
}
```

## API Endpoints

### POST /api/n8n-quote/price-list
Generates a price list from an uploaded n8n workflow JSON file.

**Request:**
- Form data with `workflow` field containing the JSON file

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "summary": {...}
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

## Field Descriptions

### Items
Each item in the price list contains:
- **id**: The node_id from the parsed workflow
- **label**: The short_label from the parsed workflow
- **node_type**: The node type for reference
- **base_price**: The base price from the translation key
- **modifiers**: List of available modifiers for this node type
- **notes**: Special pricing rules (min/max values)
- **requires_manual_review**: Boolean flag for unmapped node types

### Summary
The summary contains:
- **total_items**: Total number of items in the price list
- **estimated_base_total**: Sum of all base prices

## Error Handling

- Handles unmapped node types by marking them as "requires_manual_review"
- Gracefully handles empty or null input
- Provides appropriate defaults for missing information

## Integration

The price list generator integrates with:
- [n8nWorkflowParser.js](file:///c:/Users/alyba/Documents/Intake.Ai/IntakeAI/IntakeAI/project-root/backend/services/n8nWorkflowParser.js) for parsed workflow structure
- [translationKey.js](file:///c:/Users/alyba/Documents/Intake.Ai/IntakeAI/IntakeAI/project-root/backend/services/translationKey.js) for pricing information lookup