const fs = require('fs');
const path = require('path');

// Load environment variables for notification configuration
require('dotenv').config();

// Notification configuration
const NOTIFICATION_CONFIG = {
  method: process.env.NOTIFICATION_METHOD || 'log', // 'email', 'slack', or 'log'
  email: {
    enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true',
    from: process.env.EMAIL_FROM || 'no-reply@intakeai.com',
    to: process.env.EMAIL_TO || 'reviews@intakeai.com'
  },
  slack: {
    enabled: process.env.SLACK_NOTIFICATIONS_ENABLED === 'true',
    webhookUrl: process.env.SLACK_WEBHOOK_URL || ''
  },
  log: {
    file: path.join(__dirname, '../../data/review_notifications.log')
  }
};

/**
 * Send a review notification
 * @param {Object} queueItem - The queue item requiring review
 * @returns {Promise<boolean>} Success status
 */
async function sendReviewNotification(queueItem) {
  try {
    // Validate input
    if (!queueItem) {
      console.error('Invalid queue item for notification');
      return false;
    }

    // Generate notification content
    const content = generateNotificationContent(queueItem);
    
    // Send notification based on configured method
    switch (NOTIFICATION_CONFIG.method) {
      case 'email':
        return await sendEmailNotification(content);
      case 'slack':
        return await sendSlackNotification(content);
      case 'log':
      default:
        return await sendLogNotification(content);
    }
  } catch (error) {
    console.error('Error sending review notification:', error);
    return false;
  }
}

/**
 * Generate notification content from queue item
 * @param {Object} queueItem - The queue item requiring review
 * @returns {Object} Formatted notification content
 */
function generateNotificationContent(queueItem) {
  const {
    queue_id,
    customer_email,
    generated_quote,
    review_reasons,
    created_at
  } = queueItem;

  const totalPrice = generated_quote?.total_price || 0;
  const priceDelta = generated_quote?.total_delta || 0;
  
  // Determine urgency based on review reasons
  const isUrgent = review_reasons?.includes('urgent') || 
                   review_reasons?.includes('out_of_bounds') || 
                   false;

  // Generate review URL (this would be your actual review interface URL)
  const reviewUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/admin/review/${queue_id}`;

  // Create notification text
  const notificationText = `🔍 Quote Requires Manual Review

Customer: ${customer_email || 'Not provided'}
Quote ID: ${queue_id}
Total: $${totalPrice.toFixed(2)} (Δ $${priceDelta.toFixed(2)})
Created: ${new Date(created_at).toLocaleString()}

Reasons:
${review_reasons?.map(reason => `- ${reason}`).join('\n') || 'No reasons provided'}

${isUrgent ? '🚨 URGENT REVIEW REQUIRED' : ''}
Review here: ${reviewUrl}`;

  return {
    subject: `Quote Review Required${isUrgent ? ' - URGENT' : ''} - ${queue_id}`,
    text: notificationText,
    isUrgent: isUrgent,
    queueId: queue_id,
    customerEmail: customer_email
  };
}

/**
 * Send email notification (mock implementation)
 * @param {Object} content - Notification content
 * @returns {Promise<boolean>} Success status
 */
async function sendEmailNotification(content) {
  if (!NOTIFICATION_CONFIG.email.enabled) {
    console.log('Email notifications are disabled');
    return false;
  }

  try {
    // In a real implementation, you would use nodemailer or similar
    console.log('📧 Sending email notification:');
    console.log(`To: ${NOTIFICATION_CONFIG.email.to}`);
    console.log(`From: ${NOTIFICATION_CONFIG.email.from}`);
    console.log(`Subject: ${content.subject}`);
    console.log(`Body: ${content.text}`);
    
    // Mock email sending
    // const transporter = nodemailer.createTransporter({...});
    // await transporter.sendMail({...});
    
    return true;
  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
}

/**
 * Send Slack notification (mock implementation)
 * @param {Object} content - Notification content
 * @returns {Promise<boolean>} Success status
 */
async function sendSlackNotification(content) {
  if (!NOTIFICATION_CONFIG.slack.enabled || !NOTIFICATION_CONFIG.slack.webhookUrl) {
    console.log('Slack notifications are disabled or webhook URL not configured');
    return false;
  }

  try {
    // In a real implementation, you would use axios or similar to POST to the webhook
    console.log('💬 Sending Slack notification:');
    console.log(`Webhook URL: ${NOTIFICATION_CONFIG.slack.webhookUrl}`);
    console.log(`Message: ${content.text}`);
    
    // Mock Slack sending
    // await axios.post(NOTIFICATION_CONFIG.slack.webhookUrl, {
    //   text: content.text,
    //   attachments: [...]
    // });
    
    return true;
  } catch (error) {
    console.error('Error sending Slack notification:', error);
    return false;
  }
}

/**
 * Send log notification
 * @param {Object} content - Notification content
 * @returns {Promise<boolean>} Success status
 */
async function sendLogNotification(content) {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'REVIEW_NOTIFICATION',
      urgent: content.isUrgent,
      queue_id: content.queueId,
      customer_email: content.customerEmail,
      subject: content.subject,
      message: content.text
    };

    // Ensure log directory exists
    const logDir = path.dirname(NOTIFICATION_CONFIG.log.file);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Append to log file
    fs.appendFileSync(
      NOTIFICATION_CONFIG.log.file,
      JSON.stringify(logEntry) + '\n'
    );

    console.log('📝 Logged review notification:', content.subject);
    return true;
  } catch (error) {
    console.error('Error logging notification:', error);
    return false;
  }
}

/**
 * Send a quote approval notification to the customer
 * @param {Object} queueItem - The approved queue item
 * @returns {Promise<boolean>} Success status
 */
async function sendQuoteApprovalNotification(queueItem) {
  try {
    // Validate input
    if (!queueItem || queueItem.status !== 'approved') {
      console.error('Invalid or non-approved queue item for customer notification');
      return false;
    }

    // Only send notification if customer email is provided
    if (!queueItem.customer_email) {
      console.log('No customer email provided, skipping customer notification');
      return false;
    }

    // Generate notification content
    const content = generateApprovalNotificationContent(queueItem);
    
    // For now, we'll just log the notification
    // In a real implementation, you would send an actual email or other notification
    console.log('📧 Sending quote approval notification to customer:');
    console.log(`To: ${queueItem.customer_email}`);
    console.log(`Subject: ${content.subject}`);
    console.log(`Body: ${content.text}`);
    
    // Mark customer as notified in the queue item
    // Import the review queue functions properly
    const { loadReviewQueue, saveReviewQueue } = require('./reviewQueue');
    const queue = loadReviewQueue();
    const itemIndex = queue.findIndex(item => item.queue_id === queueItem.queue_id);
    if (itemIndex !== -1) {
      queue[itemIndex].customer_notified = true;
      saveReviewQueue(queue);
    }
    
    return true;
  } catch (error) {
    console.error('Error sending quote approval notification:', error);
    return false;
  }
}

/**
 * Generate approval notification content from queue item
 * @param {Object} queueItem - The approved queue item
 * @returns {Object} Formatted notification content
 */
function generateApprovalNotificationContent(queueItem) {
  const {
    queue_id,
    customer_email,
    generated_quote,
    notes,
    reviewed_at,
    original_request
  } = queueItem;

  const totalPrice = generated_quote?.total_price || 0;
  const modificationsPrice = generated_quote?.modifications_price || 0;
  
  // Get project/quote name from original request
  // Try multiple possible locations for the workflow name
  const projectName = original_request?.workflow || 
                     original_request?.fileName || 
                     original_request?.filename || 
                     original_request?.file_name ||
                     'n8n Workflow';
  
  // Generate quote URL (this would be your actual quote page URL)
  const quoteUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/n8n-project-quote/${queue_id}`;

  // Create notification text
  const notificationText = `🎉 Your n8n Workflow Quote Has Been Approved!

Hello,

Great news! Your custom n8n workflow quote has been reviewed and approved by our team.

Quote Details:
- Project: ${projectName}
- Quote ID: ${queue_id}
- Total Price: $${totalPrice.toFixed(2)}
- Modifications Price: $${modificationsPrice.toFixed(2)}
- Approved on: ${new Date(reviewed_at).toLocaleString()}

Notes from our team:
${notes || 'No additional notes provided'}

You can view your complete quote and proceed with the next steps here:
${quoteUrl}

If you have any questions or need further assistance, please don't hesitate to contact us.

Best regards,
The IntakeAI Team`;

  return {
    subject: `✅ Your n8n Workflow Quote Has Been Approved - ${projectName}`,
    text: notificationText,
    queueId: queue_id,
    customerEmail: customer_email,
    projectName: projectName
  };
}

/**
 * Get notification configuration
 * @returns {Object} Current notification configuration
 */
function getNotificationConfig() {
  return NOTIFICATION_CONFIG;
}

module.exports = {
  sendReviewNotification,
  sendQuoteApprovalNotification,
  getNotificationConfig
};