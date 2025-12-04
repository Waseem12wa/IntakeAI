# IntakeAI Integration Manager Guide

## Overview

This guide provides instructions for integrating external systems with IntakeAI's n8n workflow quote generation system.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [API Endpoints](#api-endpoints)
3. [Data Models](#data-models)
4. [Integration Examples](#integration-examples)
5. [Simple Web Interface](#simple-web-interface)
6. [Error Handling](#error-handling)
7. [Security Considerations](#security-considerations)

## System Architecture

The n8n quote generation system follows a serverless architecture with local pricing logic to minimize LLM costs:

```
[Client] → [API Layer] → [Validation] → [Parsing] → [Pricing] → [LLM (Optional)] → [Quote]
                            ↓
                    [Review Queue] ← [Flagging Logic]
```

## API Endpoints

### POST /api/n8n-quote/validate
Validates an uploaded n8n workflow JSON file

**Request:**
```
Content-Type: multipart/form-data
Body:
- workflow: n8n workflow JSON file
```

**Response:**
```json
{
  "success": true,
  "message": "Workflow validation successful"
}
```

### POST /api/n8n-quote/price-list
Generates a price list from an uploaded n8n workflow

**Request:**
```
Content-Type: multipart/form-data
Body:
- workflow: n8n workflow JSON file
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_price": 87.50,
    "total_delta": 12.75,
    "items": [
      {
        "node_id": "1735e687-9835-4936-b244-969563034f8c",
        "node_label": "HTTP Request",
        "node_type": "httpRequest",
        "base_price": 10.00,
        "modifiers": [
          {
            "name": "concurrency",
            "value": 2,
            "type": "per_unit",
            "price": 4.00
          }
        ],
        "total_price": 14.00
      }
    ]
  }
}
```

### POST /api/n8n-quote/compact-payload
Builds a compact payload for LLM processing

**Request:**
```
Content-Type: multipart/form-data
Body:
- workflow: n8n workflow JSON file
- customer_text: (optional) Customer request text
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workflow_summary": "4 nodes: httpRequest, set, if, emailSend",
    "price_list": [...],
    "customer_text": "Need this workflow built urgently"
  }
}
```

### POST /api/n8n-quote/build-prompt
Creates LLM prompts from compact payload

**Request:**
```
Content-Type: application/json
Body:
- compact_payload: Output from /compact-payload endpoint
```

**Response:**
```json
{
  "success": true,
  "data": {
    "system_prompt": "You are a technical quote estimator...",
    "user_prompt": "Generate a professional quote for this workflow..."
  }
}
```

### POST /api/n8n-quote/add-to-review-queue
Adds a quote to the manual review queue

**Request:**
```
Content-Type: application/json
Body:
- quote: Generated quote object
- reasons: Array of reasons for review
- original_request: Original request data
- customer_email: Customer contact email
```

**Response:**
```json
{
  "success": true,
  "queue_id": "review-queue-id-123"
}
```

## Data Models

### n8n Workflow Node
```json
{
  "node_id": "unique-identifier",
  "node_label": "Human readable name",
  "node_type": "httpRequest|webhook|set|if|switch|function|code|scheduleTrigger|emailSend|databaseQuery",
  "position": [x, y],
  "parameters": { /* node-specific parameters */ }
}
```

### Price List Item
```json
{
  "node_id": "unique-identifier",
  "node_label": "HTTP Request",
  "node_type": "httpRequest",
  "base_price": 10.00,
  "modifiers": [
    {
      "name": "concurrency",
      "value": 2,
      "type": "per_unit",
      "price": 4.00
    }
  ],
  "total_price": 14.00
}
```

## Integration Examples

### Python Example
```python
import requests

def generate_n8n_quote(file_path, customer_email):
    # Step 1: Validate workflow
    with open(file_path, 'rb') as f:
        files = {'workflow': f}
        response = requests.post('http://localhost:5000/api/n8n-quote/validate', files=files)
        if not response.json()['success']:
            raise Exception("Invalid workflow file")
    
    # Step 2: Generate price list
    with open(file_path, 'rb') as f:
        files = {'workflow': f}
        response = requests.post('http://localhost:5000/api/n8n-quote/price-list', files=files)
        return response.json()['data']
```

### JavaScript Example
```javascript
async function generateN8nQuote(file, customerEmail) {
    // Step 1: Validate workflow
    const validateFormData = new FormData();
    validateFormData.append('workflow', file);
    
    const validateResponse = await fetch('/api/n8n-quote/validate', {
        method: 'POST',
        body: validateFormData
    });
    
    const validateData = await validateResponse.json();
    if (!validateData.success) {
        throw new Error('Invalid workflow file');
    }
    
    // Step 2: Generate price list
    const priceListFormData = new FormData();
    priceListFormData.append('workflow', file);
    
    const priceListResponse = await fetch('/api/n8n-quote/price-list', {
        method: 'POST',
        body: priceListFormData
    });
    
    return await priceListResponse.json();
}
```

## Simple Web Interface

A simple HTML/JavaScript interface is available at `/n8n-quote` for manual quote generation:

- **File Upload**: Drag and drop or browse for n8n JSON files
- **Form Inputs**: Customer email, request text, urgent flag
- **Quote Generation**: Processes workflow and displays pricing
- **Export Options**: Download as PDF or CSV
- **Review Queue**: Flags complex quotes for manual review

To access: `http://localhost:5000/n8n-quote`

## Error Handling

All API endpoints return structured error responses:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid workflow file structure",
  "details": {
    "reason": "Missing required field: nodes"
  }
}
```

Common error types:
- `VALIDATION_ERROR`: Workflow structure issues
- `FILE_TOO_LARGE`: File exceeds 5MB limit
- `INVALID_FILE_TYPE`: Non-JSON file uploaded
- `INTERNAL_ERROR`: Server-side processing errors

## Security Considerations

- All file uploads are limited to 5MB
- Only JSON files are accepted
- Workflow validation prevents malicious payloads
- CORS is configured for web interface access
- Rate limiting should be implemented in production