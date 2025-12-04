const fs = require('fs');
const path = require('path');

// Test the n8n quote approval with complete workflow data
async function testN8nApproval() {
  try {
    console.log('Testing n8n Quote Approval with Complete Workflow Data...\n');
    
    // First, we need to add a review to the queue
    // In a real test, we would simulate uploading a file and going through the process
    console.log('1. Simulating adding a custom modification request to review queue...');
    
    // For this test, we'll directly add an item to the review queue
    const { addToReviewQueue } = require('./services/reviewQueue');
    
    const sampleQuote = {
      total_price: 0,
      modifications_price: 0,
      items: []
    };
    
    const sampleRequest = {
      workflow: 'sample-n8n-workflow.json',
      modifications: 'Add email notification node after HTTP request'
    };
    
    const queueId = addToReviewQueue(
      sampleQuote, 
      ['Custom modification requested'], 
      sampleRequest, 
      'test@example.com'
    );
    
    console.log(`   Added review with queue ID: ${queueId}`);
    
    // Now test approving with price
    console.log('\n2. Testing approval with price...');
    
    // We'll simulate the approve-with-price endpoint call
    const { getReviewById, approveReview } = require('./services/reviewQueue');
    const PendingEstimate = require('./models/PendingEstimate');
    
    // Get the review item
    const reviewItem = getReviewById(queueId);
    console.log(`   Found review item: ${reviewItem ? 'Yes' : 'No'}`);
    
    if (reviewItem) {
      // Update with price (similar to what happens in the endpoint)
      reviewItem.generated_quote.total_price = 150.00;
      reviewItem.generated_quote.modifications_price = 150.00;
      reviewItem.generated_quote.items = [{
        node_label: "Custom Modification",
        node_type: "custom_modification",
        base_price: 150.00,
        total_price: 150.00,
        confidence: 1.0
      }];
      reviewItem.notes = 'Price set by admin: $150.00';
      
      // Approve the review
      const result = approveReview(queueId, 'admin@intakeai.com', reviewItem.notes);
      console.log(`   Review approval result: ${result ? 'Success' : 'Failed'}`);
      
      if (result) {
        // Create a pending estimate with workflow data (similar to what happens in the endpoint)
        const pendingEstimate = new PendingEstimate({
          jobId: `n8n-${queueId}`,
          originalEstimate: '$150.00',
          aiAnalysis: {
            initialAnalysis: "Custom n8n workflow modification",
            finalAnalysis: "Price set by admin for custom modifications",
            questionsAndAnswers: []
          },
          status: 'approved',
          adminNotes: 'Price set by admin: $150.00',
          calculatedPrice: '150.00',
          priceBreakdown: {
            estimatedWorkHours: "0",
            hourlyRate: "0",
            complexityFactor: "1",
            adminFee: "0",
            commission: "0",
            surcharges: "0",
            discounts: "0"
          },
          workflowData: reviewItem.original_request, // This is the key addition
          adminId: 'admin@intakeai.com'
        });
        
        // Save the estimate
        await pendingEstimate.save();
        console.log('   Pending estimate saved with workflow data');
        
        // Retrieve and verify the saved estimate
        const savedEstimate = await PendingEstimate.findById(pendingEstimate._id);
        console.log(`   Verified saved estimate: ${savedEstimate ? 'Found' : 'Not found'}`);
        
        if (savedEstimate && savedEstimate.workflowData) {
          console.log('   ✅ Workflow data preserved in approved estimate');
          console.log(`   Workflow file: ${savedEstimate.workflowData.workflow}`);
          console.log(`   Modifications: ${savedEstimate.workflowData.modifications}`);
        } else {
          console.log('   ❌ Workflow data not found in approved estimate');
        }
      }
    }
    
    console.log('\n✅ n8n Quote Approval Test Completed!');
    
  } catch (error) {
    console.error('❌ Error testing n8n approval:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testN8nApproval();