# Prompt Engine

This module designs the exact system and user prompts to send to the LLM for quote generation.

## Features

- Provides the exact system prompt for workflow automation pricing
- Builds user prompts from compact payloads
- Follows strict rules for LLM behavior
- Ensures valid JSON output format

## Usage

### Build prompts
```javascript
const { buildPrompt } = require('./promptEngine');

const compactPayload = { /* compact payload */ };
const prompts = buildPrompt(compactPayload);

console.log(prompts.system);
console.log(prompts.user);
```

### System Prompt
The system prompt contains strict rules for the LLM:
1. Use ONLY the workflow items provided - do not invent prices
2. Map customer requests to existing item IDs
3. When a customer requests something not in the workflow, set requires_manual_review: true
4. Calculate price changes using the base prices and modifiers provided
5. If price change exceeds approval threshold, set requires_manual_review: true
6. Output ONLY valid JSON - no explanatory text
7. Keep remarks under 150 words

### User Prompt Template
The user prompt follows this structure:
```
Workflow items:
{workflow_json}

Customer request:
{customer_text}

Business rules:
{business_rules_json}

Generate a quote following the rules above.
```

## API Endpoints

### POST /api/n8n-quote/build-prompt
Builds LLM prompts from compact payload.

**Request:**
- JSON body with compact payload

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "system": "System prompt text",
    "user": "User prompt text"
  }
}
```

**Response (Error):**
```json
{
  "error": "MISSING_PAYLOAD",
  "message": "Compact payload is required",
  "details": { "reason": "Compact payload is required for prompt building" }
}
```

## Output Schema

The LLM must output JSON following this schema:
```json
{
  "quote": {
    "items": [
      {
        "item_id": "string (from workflow)",
        "action": "adjust|add|remove|none",
        "requested_change": "brief description",
        "new_price": number,
        "price_delta": number,
        "reason": "brief explanation",
        "mapping_confidence": 0.0-1.0,
        "requires_manual_review": boolean
      }
    ],
    "total_price": number,
    "total_delta": number,
    "flags": ["ok"|"requires_manual_review"|"out_of_bounds"],
    "remarks": "sales-ready summary"
  }
}
```

## Error Handling

- Gracefully handles empty or null inputs
- Provides default values for missing information
- Maintains prompt structure even with incomplete data

## Integration

The prompt engine integrates with:
- [llmPayloadBuilder.js](file:///c:/Users/alyba/Documents/Intake.Ai/IntakeAI/IntakeAI/project-root/backend/services/llmPayloadBuilder.js) for compact payload input