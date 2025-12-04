# Review Queue System

This module handles quotes that require manual review in a serverless quote generation system.

## Features

- Simple JSON file-based storage for review items
- CRUD operations for review queue management
- Status tracking (pending, approved, rejected)
- Review metadata (reviewer, timestamp, notes)

## Usage

### Add to review queue
```javascript
const { addToReviewQueue } = require('./reviewQueue');

const queueId = addToReviewQueue(quote, reasons, originalRequest, customerEmail);
```

### Get pending reviews
```javascript
const { getPendingReviews } = require('./reviewQueue');

const pendingReviews = getPendingReviews();
```

### Approve a review
```javascript
const { approveReview } = require('./reviewQueue');

const result = approveReview(queueId, reviewerEmail, notes);
```

### Reject a review
```javascript
const { rejectReview } = require('./reviewQueue');

const result = rejectReview(queueId, reviewerEmail, notes);
```

## Storage

The review queue is stored in a simple JSON file at `data/review_queue.json`. Each review item follows this schema:

```json
{
  "queue_id": "uuid",
  "created_at": "timestamp",
  "customer_email": "string",
  "original_request": { ... },
  "generated_quote": { ... },
  "review_reasons": ["out_of_bounds", "low_confidence", "new_item_requested"],
  "status": "pending|approved|rejected",
  "reviewed_by": "email",
  "reviewed_at": "timestamp",
  "notes": "string"
}
```

## API Endpoints

### POST /api/n8n-quote/add-to-review-queue
Adds a quote to the review queue.

**Request:**
- JSON body with `quote`, `reasons`, `original_request`, and `customer_email` fields

**Response (Success):**
```json
{
  "success": true,
  "queue_id": "uuid"
}
```

**Response (Error):**
```json
{
  "error": "MISSING_DATA",
  "message": "Quote and reasons are required",
  "details": { "reason": "Quote and reasons are required for review queue" }
}
```

### GET /api/n8n-quote/pending-reviews
Gets all pending reviews.

**Response (Success):**
```json
{
  "success": true,
  "data": [...]
}
```

### GET /api/n8n-quote/all-reviews
Gets all reviews.

**Response (Success):**
```json
{
  "success": true,
  "data": [...]
}
```

### POST /api/n8n-quote/approve-review
Approves a review.

**Request:**
- JSON body with `queue_id` and `reviewer_email` fields

**Response (Success):**
```json
{
  "success": true,
  "message": "Review approved successfully"
}
```

**Response (Error):**
```json
{
  "error": "NOT_FOUND",
  "message": "Review not found",
  "details": { "reason": "Review with specified queue ID not found" }
}
```

### POST /api/n8n-quote/reject-review
Rejects a review.

**Request:**
- JSON body with `queue_id` and `reviewer_email` fields

**Response (Success):**
```json
{
  "success": true,
  "message": "Review rejected successfully"
}
```

## Functions

### addToReviewQueue(quote, reasons, originalRequest, customerEmail)
Adds a quote to the review queue.

**Parameters:**
- `quote` (Object): The generated quote
- `reasons` (Array): Review reasons
- `originalRequest` (Object): Original request data
- `customerEmail` (string): Customer email

**Returns:** `string` Queue ID

### getPendingReviews()
Gets all pending reviews.

**Returns:** `Array` Array of pending review items

### getAllReviews()
Gets all reviews.

**Returns:** `Array` Array of all review items

### approveReview(queueId, reviewerEmail, notes)
Approves a review.

**Parameters:**
- `queueId` (string): The queue ID
- `reviewerEmail` (string): Email of the reviewer
- `notes` (string): Review notes

**Returns:** `boolean` Success status

### rejectReview(queueId, reviewerEmail, notes)
Rejects a review.

**Parameters:**
- `queueId` (string): The queue ID
- `reviewerEmail` (string): Email of the reviewer
- `notes` (string): Review notes

**Returns:** `boolean` Success status

### getReviewById(queueId)
Gets a specific review by queue ID.

**Parameters:**
- `queueId` (string): The queue ID

**Returns:** `Object|null` Review item or null if not found

## Error Handling

- Gracefully handles missing data
- Returns appropriate error codes for not found items
- Provides detailed error messages for debugging
- Ensures data persistence between operations

## Integration

The review queue system integrates with:
- Quote generation workflow
- LLM response validation
- Manual review flagging system