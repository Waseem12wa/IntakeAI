# Simple Intent Parser

This module parses customer email text for obvious structured directives before sending to LLM.

## Features

- Detects common patterns in customer text
- Extracts structured directives from unstructured text
- Provides confidence scores for detected patterns
- Keeps LLM usage for final formatting while reducing ambiguity

## Usage

### Parse customer intent
```javascript
const { parseCustomerIntent } = require('./intentParser');

const customerText = "Please add retry functionality and make it urgent";
const intent = parseCustomerIntent(customerText);

console.log(intent);
```

### Output Format
```json
{
  "detected_patterns": [
    { "pattern": "add_retry", "confidence": 0.9 },
    { "pattern": "urgent", "confidence": 1.0 }
  ],
  "parsed_directives": [
    { "action": "modify", "target": "all_http", "change": "add_retry" }
  ],
  "needs_llm": true
}
```

## API Endpoints

### POST /api/n8n-quote/parse-intent
Parses customer intent from text.

**Request:**
- JSON body with `customer_text` field

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "detected_patterns": [...],
    "parsed_directives": [...],
    "needs_llm": true
  }
}
```

**Response (Error):**
```json
{
  "error": "MISSING_CUSTOMER_TEXT",
  "message": "Customer text is required",
  "details": { "reason": "Customer text is required for intent parsing" }
}
```

## Detected Patterns

The intent parser detects these common patterns:

1. **add_node** - Requests to add specific node types
2. **modify_timeout** - Requests to change timeout values
3. **make_async** - Requests to make workflow asynchronous
4. **add_retry** - Requests to add retry functionality
5. **modify_parameter** - Requests to increase/decrease parameters
6. **urgent** - Urgent or rush requests
7. **increase_reliability** - Requests to improve reliability
8. **add_attachment_support** - Requests for file attachment support
9. **cost_optimization** - Requests to keep costs low
10. **improve_performance** - Requests to improve performance

## Confidence Scoring

Each detected pattern receives a confidence score between 0.0 and 1.0:
- Higher scores indicate more certain matches
- Confidence is calculated based on match quality and text length

## Directives Structure

Parsed directives include:
- **action**: Type of action (add, modify, flag)
- **target**: Target of the action (workflow, all_nodes, all_http, etc.)
- **change**: Type of change to make
- **details**: Additional details from regex capture groups

## Error Handling

- Gracefully handles empty or null inputs
- Returns empty arrays for no matches
- Always sets `needs_llm: true` for LLM processing

## Integration

The intent parser integrates with:
- Customer text input from workflow requests
- LLM processing pipeline for final formatting