const { 
  addToReviewQueue, 
  getPendingReviews, 
  getAllReviews, 
  approveReview, 
  rejectReview,
  getReviewById
} = require('./services/reviewQueue');
const fs = require('fs');
const path = require('path');

console.log('Testing review queue system...');

// Clean up any existing review queue file
const REVIEW_QUEUE_FILE = path.join(__dirname, '../data/review_queue.json');
if (fs.existsSync(REVIEW_QUEUE_FILE)) {
  fs.unlinkSync(REVIEW_QUEUE_FILE);
}

// Test data
const testQuote = {
  items: [
    {
      item_id: "n1",
      action: "adjust",
      requested_change: "Add concurrency support",
      new_price: 15.0,
      price_delta: 5.0,
      reason: "Added concurrency modifier",
      mapping_confidence: 0.9,
      requires_manual_review: false
    }
  ],
  total_price: 15.0,
  total_delta: 5.0,
  flags: ["ok"],
  remarks: "Optimized HTTP request with concurrency support"
};

const testReasons = ["out_of_bounds", "low_confidence"];
const testOriginalRequest = { workflow: [], customer_text: "Test request" };
const testCustomerEmail = "test@example.com";

// Test adding to review queue
console.log('\n1. Testing add to review queue:');
const queueId = addToReviewQueue(testQuote, testReasons, testOriginalRequest, testCustomerEmail);
console.log('Added to queue with ID:', queueId);

// Test getting pending reviews
console.log('\n2. Testing get pending reviews:');
const pendingReviews = getPendingReviews();
console.log('Pending reviews count:', pendingReviews.length);
console.log('First pending review:', JSON.stringify(pendingReviews[0], null, 2));

// Test getting all reviews
console.log('\n3. Testing get all reviews:');
const allReviews = getAllReviews();
console.log('All reviews count:', allReviews.length);

// Test getting specific review by ID
console.log('\n4. Testing get review by ID:');
const specificReview = getReviewById(queueId);
console.log('Specific review:', JSON.stringify(specificReview, null, 2));

// Test approving a review
console.log('\n5. Testing approve review:');
const approveResult = approveReview(queueId, "admin@example.com", "Approved after verification");
console.log('Approve result:', approveResult);

// Check that the review was updated
const updatedReview = getReviewById(queueId);
console.log('Updated review status:', updatedReview.status);
console.log('Reviewed by:', updatedReview.reviewed_by);
console.log('Review notes:', updatedReview.notes);

// Add another review for rejection test
console.log('\n6. Testing reject review:');
const queueId2 = addToReviewQueue(testQuote, testReasons, testOriginalRequest, "another@example.com");
const rejectResult = rejectReview(queueId2, "admin@example.com", "Rejected due to pricing concerns");
console.log('Reject result:', rejectResult);

// Check that the review was updated
const rejectedReview = getReviewById(queueId2);
console.log('Rejected review status:', rejectedReview.status);

// Test with non-existent ID
console.log('\n7. Testing with non-existent ID:');
const nonExistentApprove = approveReview("non-existent-id", "admin@example.com", "test");
const nonExistentReject = rejectReview("non-existent-id", "admin@example.com", "test");
console.log('Non-existent approve result:', nonExistentApprove);
console.log('Non-existent reject result:', nonExistentReject);

// Final check of all reviews
console.log('\n8. Final review queue state:');
const finalReviews = getAllReviews();
console.log('Total reviews:', finalReviews.length);
finalReviews.forEach((review, index) => {
  console.log(`Review ${index + 1}: ${review.queue_id} - ${review.status}`);
});

// Clean up
if (fs.existsSync(REVIEW_QUEUE_FILE)) {
  fs.unlinkSync(REVIEW_QUEUE_FILE);
  console.log('\nCleaned up review queue file');
}