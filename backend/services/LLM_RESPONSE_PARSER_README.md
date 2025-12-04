# LLM Response Parser

This module parses and validates the LLM response JSON for quote generation.

## Features

- Validates LLM response against original workflow
- Checks item IDs, prices, and required fields
- Post-processes response for consistency
- Flags items requiring manual review
- Validates JSON structure and math

## Usage

### Parse and validate LLM response
```javascript
const { parseAndValidateLlmResponse } = require('./llmResponseParser');

const llmJson = { /* LLM response JSON */ };
const originalWorkflow = { /* original workflow structure */ };

const result = parseAndValidateLlmResponse(llmJson, originalWorkflow);

console.log(result);
```

### Output Format
```json
{
  "validated_quote": { ... },
  "validation_errors": [...],
  "requires_review": boolean,
  "review_reasons": [...]
}
```

## API Endpoints

### POST /api/n8n-quote/validate-llm-response
Validates and parses LLM response JSON.

**Request:**
- JSON body with `llm_json` and `original_workflow` fields

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "validated_quote": { ... },
    "validation_errors": [...],
    "requires_review": boolean,
    "review_reasons": [...]
  }
}
```

**Response (Error):**
```json
{
  "error": "MISSING_DATA",
  "message": "LLM JSON and original workflow are required",
  "details": { "reason": "LLM JSON and original workflow are required for validation" }
}
```

## Validation Checks

The parser performs these validation checks:

1. **Item ID Validation** - All item_ids must exist in original workflow
2. **Price Bounds Validation** - Prices must be within min/max bounds from translation key
3. **Required Fields Validation** - All required fields must be present
4. **Confidence Validation** - mapping_confidence must be between 0-1
5. **New Item Validation** - No new items unless explicitly allowed
6. **Math Validation** - Calculated totals must match reported totals

## Post-processing

The parser performs these post-processing steps:

- If item_id not found → set requires_manual_review: true
- If price > max or < min → set out_of_bounds flag
- If confidence < 0.6 → set requires_manual_review: true
- Calculate totals and validate math

## Error Handling

- Detects when LLM invents item_id
- Detects when LLM suggests impossible price
- Handles malformed JSON
- Validates required fields are present
- Flags low confidence mappings

## Integration

The LLM response parser integrates with:
- LLM output validation
- Quote generation workflow
- Manual review flagging system