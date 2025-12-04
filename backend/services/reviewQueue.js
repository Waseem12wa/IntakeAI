const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { sendQuoteApprovalNotification } = require('./notificationService');

// Define the path for the review queue storage
const REVIEW_QUEUE_FILE = path.join(__dirname, '../../data/review_queue.json');

/**
 * Initialize the review queue storage file if it doesn't exist
 */
function initializeReviewQueue() {
  if (!fs.existsSync(REVIEW_QUEUE_FILE)) {
    fs.writeFileSync(REVIEW_QUEUE_FILE, JSON.stringify([]));
  }
}

/**
 * Load the review queue from storage
 * @returns {Array} Array of review items
 */
function loadReviewQueue() {
  try {
    const data = fs.readFileSync(REVIEW_QUEUE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading review queue:', error);
    return [];
  }
}

/**
 * Save the review queue to storage
 * @param {Array} queue - Array of review items
 */
function saveReviewQueue(queue) {
  try {
    fs.writeFileSync(REVIEW_QUEUE_FILE, JSON.stringify(queue, null, 2));
  } catch (error) {
    console.error('Error saving review queue:', error);
    throw error;
  }
}

/**
 * Add a quote to the review queue
 * @param {Object} quote - The generated quote
 * @param {Array} reasons - Review reasons
 * @param {Object} originalRequest - Original request data
 * @param {string} customerEmail - Customer email
 * @returns {string} Queue ID
 */
function addToReviewQueue(quote, reasons, originalRequest, customerEmail) {
  initializeReviewQueue();
  
  const queueId = uuidv4();
  const reviewItem = {
    queue_id: queueId,
    created_at: new Date().toISOString(),
    customer_email: customerEmail || '',
    original_request: originalRequest || {},
    generated_quote: quote || {},
    review_reasons: reasons || [],
    status: 'pending',
    reviewed_by: '',
    reviewed_at: '',
    notes: '',
    customer_notified: false // New field to track if customer was notified
  };

  const queue = loadReviewQueue();
  queue.push(reviewItem);
  saveReviewQueue(queue);

  return queueId;
}

/**
 * Get all pending reviews
 * @returns {Array} Array of pending review items
 */
function getPendingReviews() {
  initializeReviewQueue();
  
  const queue = loadReviewQueue();
  return queue.filter(item => item.status === 'pending');
}

/**
 * Get all reviews (for admin purposes)
 * @returns {Array} Array of all review items
 */
function getAllReviews() {
  initializeReviewQueue();
  return loadReviewQueue();
}

/**
 * Approve a review
 * @param {string} queueId - The queue ID
 * @param {string} reviewerEmail - Email of the reviewer
 * @param {string} notes - Review notes
 * @returns {boolean} Success status
 */
function approveReview(queueId, reviewerEmail, notes) {
  initializeReviewQueue();
  
  const queue = loadReviewQueue();
  const itemIndex = queue.findIndex(item => item.queue_id === queueId);
  
  if (itemIndex === -1) {
    return false;
  }
  
  queue[itemIndex].status = 'approved';
  queue[itemIndex].reviewed_by = reviewerEmail;
  queue[itemIndex].reviewed_at = new Date().toISOString();
  queue[itemIndex].notes = notes || '';
  
  // Send notification to customer
  sendQuoteApprovalNotification(queue[itemIndex]);
  
  saveReviewQueue(queue);
  return true;
}

/**
 * Reject a review
 * @param {string} queueId - The queue ID
 * @param {string} reviewerEmail - Email of the reviewer
 * @param {string} notes - Review notes
 * @returns {boolean} Success status
 */
function rejectReview(queueId, reviewerEmail, notes) {
  initializeReviewQueue();
  
  const queue = loadReviewQueue();
  const itemIndex = queue.findIndex(item => item.queue_id === queueId);
  
  if (itemIndex === -1) {
    return false;
  }
  
  queue[itemIndex].status = 'rejected';
  queue[itemIndex].reviewed_by = reviewerEmail;
  queue[itemIndex].reviewed_at = new Date().toISOString();
  queue[itemIndex].notes = notes || '';
  
  saveReviewQueue(queue);
  return true;
}

/**
 * Get a specific review by queue ID
 * @param {string} queueId - The queue ID
 * @returns {Object|null} Review item or null if not found
 */
function getReviewById(queueId) {
  initializeReviewQueue();
  
  const queue = loadReviewQueue();
  const item = queue.find(item => item.queue_id === queueId);
  return item || null;
}

module.exports = {
  addToReviewQueue,
  getPendingReviews,
  getAllReviews,
  approveReview,
  rejectReview,
  getReviewById,
  loadReviewQueue, // Export this function
  saveReviewQueue  // Export this function
};