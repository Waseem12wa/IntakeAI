const { sendReviewNotification, getNotificationConfig } = require('./services/notificationService');
const fs = require('fs');
const path = require('path');

console.log('Testing notification service...');

// Clean up any existing log file
const LOG_FILE = path.join(__dirname, '../data/review_notifications.log');
if (fs.existsSync(LOG_FILE)) {
  fs.unlinkSync(LOG_FILE);
}

// Test queue items
const testQueueItems = [
  {
    queue_id: 'urgent-quote-123',
    customer_email: 'urgent.customer@example.com',
    created_at: new Date().toISOString(),
    generated_quote: {
      total_price: 250.75,
      total_delta: 75.50
    },
    review_reasons: ['out_of_bounds', 'urgent']
  },
  {
    queue_id: 'normal-quote-456',
    customer_email: 'normal.customer@example.com',
    created_at: new Date().toISOString(),
    generated_quote: {
      total_price: 120.25,
      total_delta: 20.00
    },
    review_reasons: ['low_confidence']
  },
  {
    queue_id: 'missing-data-quote-789',
    customer_email: 'missing.data@example.com',
    created_at: new Date().toISOString()
    // Missing generated_quote and review_reasons
  }
];

// Test notification configuration
console.log('\n1. Testing notification configuration:');
const config = getNotificationConfig();
console.log('Current configuration:', JSON.stringify(config, null, 2));

// Test sending notifications
console.log('\n2. Testing notification sending:');

async function testNotifications() {
  for (let i = 0; i < testQueueItems.length; i++) {
    console.log(`\n--- Test ${i + 1} ---`);
    const queueItem = testQueueItems[i];
    console.log('Queue item:', JSON.stringify(queueItem, null, 2));
    
    const result = await sendReviewNotification(queueItem);
    console.log('Notification result:', result);
  }
  
  // Test with invalid input
  console.log('\n--- Test with invalid input ---');
  const invalidResult = await sendReviewNotification(null);
  console.log('Invalid input result:', invalidResult);
  
  // Check log file
  console.log('\n3. Checking log file:');
  if (fs.existsSync(LOG_FILE)) {
    const logContent = fs.readFileSync(LOG_FILE, 'utf8');
    console.log('Log file content:');
    console.log(logContent);
  } else {
    console.log('Log file not found');
  }
  
  // Clean up
  if (fs.existsSync(LOG_FILE)) {
    fs.unlinkSync(LOG_FILE);
    console.log('\nCleaned up log file');
  }
}

testNotifications().catch(console.error);