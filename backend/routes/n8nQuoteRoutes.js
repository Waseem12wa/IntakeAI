const express = require('express');
const multer = require('multer');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { authenticateUser } = require('../middleware/auth');
const { validateN8nWorkflowFile } = require('../services/n8nWorkflowValidator');
const { parseN8nToStructured } = require('../services/n8nWorkflowParser');
const { generatePriceList } = require('../services/priceListGenerator');
const { buildCompactPayload } = require('../services/llmPayloadBuilder');
const { parseCustomerIntent } = require('../services/intentParser');
const { buildPrompt } = require('../services/promptEngine');
const { parseAndValidateLlmResponse } = require('../services/llmResponseParser');
const {
  addToReviewQueue,
  getPendingReviews,
  getAllReviews,
  approveReview,
  rejectReview,
  getReviewById
} = require('../services/reviewQueue');
const { sendReviewNotification, sendQuoteApprovalNotification } = require('../services/notificationService');
const N8nQuoteChat = require('../models/N8nQuoteChat');
// Add PendingEstimate model
const PendingEstimate = require('../models/PendingEstimate');
// Add the new N8nProjectQuote model
const N8nProjectQuote = require('../models/N8nProjectQuote');

const router = express.Router();

// Configure multer for file uploads with size limit
const storage = multer.diskStorage({
  destination: os.tmpdir(),
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Only accept JSON files
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'));
    }
  }
});

/**
 * POST /api/n8n-quote/validate
 * Validates an uploaded n8n workflow JSON file
 */
router.post('/validate', upload.single('workflow'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'NO_FILE_UPLOADED',
        message: 'No file was uploaded',
        details: { reason: 'File is required' }
      });
    }

    // Validate the workflow file
    const validationResult = await validateN8nWorkflowFile(req.file);

    if (validationResult.isValid) {
      return res.status(200).json({
        success: true,
        message: validationResult.message
      });
    } else {
      // Clean up the temporary file
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to clean up temporary file:', cleanupError);
      }

      return res.status(400).json(validationResult);
    }
  } catch (error) {
    // Handle multer errors (like file too large)
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'FILE_TOO_LARGE',
        message: 'File size exceeds maximum allowed size of 5MB',
        details: { reason: error.message }
      });
    }

    // Handle other multer errors
    if (error.message === 'Only JSON files are allowed') {
      return res.status(400).json({
        error: 'INVALID_FILE_TYPE',
        message: 'Only JSON files are allowed',
        details: { reason: error.message }
      });
    }

    // Handle unexpected errors
    console.error('Unexpected error in n8n quote validation:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred during validation',
      details: { reason: error.message }
    });
  }
});

/**
 * POST /api/n8n-quote/parse
 * Parses an uploaded n8n workflow JSON file into structured format
 */
router.post('/parse', upload.single('workflow'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'NO_FILE_UPLOADED',
        message: 'No file was uploaded',
        details: { reason: 'File is required' }
      });
    }

    // Validate the workflow file first
    const validationResult = await validateN8nWorkflowFile(req.file);

    if (!validationResult.isValid) {
      // Clean up the temporary file
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to clean up temporary file:', cleanupError);
      }

      return res.status(400).json(validationResult);
    }

    // Read and parse the JSON file
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const workflowData = JSON.parse(fileContent);

    // Clean up the temporary file
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary file:', cleanupError);
    }

    // Parse the workflow into structured format
    const structuredWorkflow = parseN8nToStructured(workflowData);

    return res.status(200).json({
      success: true,
      data: structuredWorkflow
    });
  } catch (error) {
    // Handle multer errors (like file too large)
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'FILE_TOO_LARGE',
        message: 'File size exceeds maximum allowed size of 5MB',
        details: { reason: error.message }
      });
    }

    // Handle other multer errors
    if (error.message === 'Only JSON files are allowed') {
      return res.status(400).json({
        error: 'INVALID_FILE_TYPE',
        message: 'Only JSON files are allowed',
        details: { reason: error.message }
      });
    }

    // Handle unexpected errors
    console.error('Unexpected error in n8n quote parsing:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred during parsing',
      details: { reason: error.message }
    });
  }
});

/**
 * POST /api/n8n-quote/price-list
 * Generates a price list from an uploaded n8n workflow JSON file
 */
router.post('/price-list', upload.single('workflow'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'NO_FILE_UPLOADED',
        message: 'No file was uploaded',
        details: { reason: 'File is required' }
      });
    }

    // Validate the workflow file first
    const validationResult = await validateN8nWorkflowFile(req.file);

    if (!validationResult.isValid) {
      // Clean up the temporary file
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to clean up temporary file:', cleanupError);
      }

      return res.status(400).json(validationResult);
    }

    // Read and parse the JSON file
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const workflowData = JSON.parse(fileContent);

    // Clean up the temporary file
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary file:', cleanupError);
    }

    // Parse the workflow into structured format
    const structuredWorkflow = parseN8nToStructured(workflowData);

    // Generate price list
    const priceList = generatePriceList(structuredWorkflow);

    return res.status(200).json({
      success: true,
      data: priceList
    });
  } catch (error) {
    // Handle multer errors (like file too large)
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'FILE_TOO_LARGE',
        message: 'File size exceeds maximum allowed size of 5MB',
        details: { reason: error.message }
      });
    }

    // Handle other multer errors
    if (error.message === 'Only JSON files are allowed') {
      return res.status(400).json({
        error: 'INVALID_FILE_TYPE',
        message: 'Only JSON files are allowed',
        details: { reason: error.message }
      });
    }

    // Handle unexpected errors
    console.error('Unexpected error in n8n quote price list generation:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred during price list generation',
      details: { reason: error.message }
    });
  }
});

/**
 * POST /api/n8n-quote/compact-payload
 * Generates a compact payload for LLM processing
 */
router.post('/compact-payload', upload.single('workflow'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'NO_FILE_UPLOADED',
        message: 'No file was uploaded',
        details: { reason: 'File is required' }
      });
    }

    // Validate the workflow file first
    const validationResult = await validateN8nWorkflowFile(req.file);

    if (!validationResult.isValid) {
      // Clean up the temporary file
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to clean up temporary file:', cleanupError);
      }

      return res.status(400).json(validationResult);
    }

    // Read and parse the JSON file
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const workflowData = JSON.parse(fileContent);

    // Clean up the temporary file
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary file:', cleanupError);
    }

    // Parse the workflow into structured format
    const structuredWorkflow = parseN8nToStructured(workflowData);

    // Generate price list
    const priceList = generatePriceList(structuredWorkflow);

    // Get customer text and business rules from request body
    const customerText = req.body.customer_text || '';
    const businessRules = req.body.business_rules || {};

    // Build compact payload
    const compactPayload = buildCompactPayload(priceList, customerText, businessRules);

    return res.status(200).json({
      success: true,
      data: compactPayload
    });
  } catch (error) {
    // Handle multer errors (like file too large)
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'FILE_TOO_LARGE',
        message: 'File size exceeds maximum allowed size of 5MB',
        details: { reason: error.message }
      });
    }

    // Handle other multer errors
    if (error.message === 'Only JSON files are allowed') {
      return res.status(400).json({
        error: 'INVALID_FILE_TYPE',
        message: 'Only JSON files are allowed',
        details: { reason: error.message }
      });
    }

    // Handle unexpected errors
    console.error('Unexpected error in n8n quote compact payload generation:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred during compact payload generation',
      details: { reason: error.message }
    });
  }
});

/**
 * POST /api/n8n-quote/parse-intent
 * Parses customer intent from text
 */
router.post('/parse-intent', (req, res) => {
  try {
    const { customer_text } = req.body;

    if (!customer_text) {
      return res.status(400).json({
        error: 'MISSING_CUSTOMER_TEXT',
        message: 'Customer text is required',
        details: { reason: 'Customer text is required for intent parsing' }
      });
    }

    const intent = parseCustomerIntent(customer_text);

    return res.status(200).json({
      success: true,
      data: intent
    });
  } catch (error) {
    console.error('Unexpected error in intent parsing:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred during intent parsing',
      details: { reason: error.message }
    });
  }
});

/**
 * POST /api/n8n-quote/build-prompt
 * Builds LLM prompts from compact payload
 */
router.post('/build-prompt', (req, res) => {
  try {
    const compactPayload = req.body;

    if (!compactPayload) {
      return res.status(400).json({
        error: 'MISSING_PAYLOAD',
        message: 'Compact payload is required',
        details: { reason: 'Compact payload is required for prompt building' }
      });
    }

    const prompts = buildPrompt(compactPayload);

    return res.status(200).json({
      success: true,
      data: prompts
    });
  } catch (error) {
    console.error('Unexpected error in prompt building:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred during prompt building',
      details: { reason: error.message }
    });
  }
});

/**
 * POST /api/n8n-quote/validate-llm-response
 * Validates and parses LLM response JSON
 */
router.post('/validate-llm-response', (req, res) => {
  try {
    const { llm_json, original_workflow } = req.body;

    if (!llm_json || !original_workflow) {
      return res.status(400).json({
        error: 'MISSING_DATA',
        message: 'LLM JSON and original workflow are required',
        details: { reason: 'LLM JSON and original workflow are required for validation' }
      });
    }

    const validationResult = parseAndValidateLlmResponse(llm_json, original_workflow);

    return res.status(200).json({
      success: true,
      data: validationResult
    });
  } catch (error) {
    console.error('Unexpected error in LLM response validation:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred during LLM response validation',
      details: { reason: error.message }
    });
  }
});

/**
 * POST /api/n8n-quote/add-to-review-queue
 * Adds a quote to the review queue
 */
router.post('/add-to-review-queue', async (req, res) => {
  try {
    const { quote, reasons, original_request, customer_email } = req.body;

    if (!quote || !reasons) {
      return res.status(400).json({
        error: 'MISSING_DATA',
        message: 'Quote and reasons are required',
        details: { reason: 'Quote and reasons are required for review queue' }
      });
    }

    const queueId = addToReviewQueue(quote, reasons, original_request, customer_email);

    // Send notification if review is required
    if (queueId) {
      const queueItem = getReviewById(queueId);
      if (queueItem) {
        await sendReviewNotification(queueItem);
      }
    }

    return res.status(200).json({
      success: true,
      queue_id: queueId
    });
  } catch (error) {
    console.error('Unexpected error adding to review queue:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while adding to review queue',
      details: { reason: error.message }
    });
  }
});

/**
 * POST /api/n8n-quote/save-chat
 * Saves n8n quote generation chat to database
 */
router.post('/save-chat', authenticateUser, async (req, res) => {
  try {
    const chatData = req.body;

    // Validate required fields
    if (!chatData.workflowId || !chatData.fileName || !chatData.messages || !chatData.totalPrice) {
      return res.status(400).json({
        error: 'MISSING_DATA',
        message: 'Required fields are missing',
        details: { reason: 'workflowId, fileName, messages, and totalPrice are required' }
      });
    }

    // Create new chat document
    const newChat = new N8nQuoteChat(chatData);
    const savedChat = await newChat.save();

    // Also save to the new N8nProjectQuote model for complete project tracking
    try {
      // Check if any nodes have zero price or require manual review
      // Send to admin if:
      // 1. Any node requires manual review (not in translation key)
      // 2. Any node has zero price (even if in translation key)
      const hasZeroPriceNodes = chatData.items && chatData.items.some(item =>
        (item.requiresManualReview !== undefined ? item.requiresManualReview : false) ||
        ((item.basePrice !== undefined ? item.basePrice : (item.base_price || 0)) === 0)
      );

      // Prepare customer email - filter out empty strings
      let customerEmailValue = undefined;
      if (chatData.customerEmail && chatData.customerEmail.trim() !== '') {
        customerEmailValue = chatData.customerEmail.trim();
      }

      // Get userId from authenticated request
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          error: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required to save quote',
          details: { reason: 'User must be logged in' }
        });
      }

      const projectQuoteData = {
        userId: req.user.id,
        projectId: `proj-${Date.now()}`, // Generate a unique project ID
        workflowId: chatData.workflowId,
        fileName: chatData.fileName,
        fileSize: chatData.fileSize || 0,
        customerEmail: customerEmailValue, // Use filtered value
        customerRequest: chatData.modifications || '',
        status: hasZeroPriceNodes ? 'pending_approval' : 'draft',
        basePrice: chatData.basePrice || 0,
        modificationsPrice: chatData.modificationsPrice || 0,
        totalPrice: chatData.totalPrice || 0,
        nodes: (chatData.items || []).map(item => ({
          nodeId: item.nodeId || item.node_id || '',
          nodeLabel: item.nodeLabel || item.node_label || '',
          nodeType: item.nodeType || item.node_type || '',
          basePrice: item.basePrice !== undefined ? item.basePrice : (item.base_price || 0),
          modifiers: [], // Modifiers would need to be populated from the actual workflow
          totalPrice: item.totalPrice !== undefined ? item.totalPrice : (item.total_price || (item.basePrice !== undefined ? item.basePrice : (item.base_price || 0))),
          requiresManualReview: item.requiresManualReview !== undefined ? item.requiresManualReview :
            ((item.basePrice !== undefined ? item.basePrice : (item.base_price || 0)) === 0)
        })),
        modifications: chatData.modifications ? [{
          description: chatData.modifications,
          price: chatData.modificationsPrice || 0,
          requiresApproval: hasZeroPriceNodes,
          approved: false
        }] : [],
        workflowData: null, // This would be populated with actual workflow data if available
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const newProjectQuote = new N8nProjectQuote(projectQuoteData);
      await newProjectQuote.save();

      // If there are zero price nodes or nodes requiring manual review, add to review queue
      if (hasZeroPriceNodes) {
        const zeroPriceItems = chatData.items.filter(item =>
          (item.requiresManualReview !== undefined ? item.requiresManualReview : false) ||
          ((item.basePrice !== undefined ? item.basePrice : (item.base_price || 0)) === 0)
        );
        const reasons = zeroPriceItems.map(item =>
          `Node "${item.nodeLabel || item.node_label || item.nodeType || item.node_type}" requires manual pricing`
        );

        const queueId = addToReviewQueue(
          {
            total_price: chatData.totalPrice || 0,
            modifications_price: chatData.modificationsPrice || 0,
            items: chatData.items.map(item => ({
              node_label: item.nodeLabel || item.node_label || '',
              node_type: item.nodeType || item.node_type || '',
              base_price: item.basePrice !== undefined ? item.basePrice : (item.base_price || 0),
              total_price: item.totalPrice !== undefined ? item.totalPrice : (item.total_price || (item.basePrice || item.base_price || 0)),
              confidence: (item.requiresManualReview !== undefined ? (item.requiresManualReview ? 0.1 : 0.95) :
                ((item.basePrice !== undefined ? item.basePrice : (item.base_price || 0)) === 0 ? 0.1 : 0.95)),
              requires_manual_review: item.requiresManualReview !== undefined ? item.requiresManualReview :
                ((item.basePrice !== undefined ? item.basePrice : (item.base_price || 0)) === 0)
            }))
          },
          reasons,
          {
            workflow: chatData.fileName,
            modifications: chatData.modifications || ''
          },
          chatData.customerEmail || 'customer@example.com'
        );

        console.log('Added to review queue with ID:', queueId);
      }
    } catch (quoteError) {
      console.error('Error saving project quote data:', quoteError);
      // We don't return an error here because the chat was saved successfully
    }

    return res.status(200).json({
      success: true,
      data: savedChat
    });
  } catch (error) {
    console.error('Unexpected error saving n8n quote chat:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while saving chat',
      details: { reason: error.message }
    });
  }
});

/**
 * GET /api/n8n-quote/chats
 */
// Get all pending n8n quotes
router.get('/pending', async (req, res) => {
  try {
    const quotes = await N8nQuote.find({ status: 'Pending' }).sort({ createdAt: -1 });
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get('/chats', async (req, res) => {
  try {
    const chats = await N8nQuoteChat.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: chats
    });
  } catch (error) {
    console.error('Unexpected error getting n8n quote chats:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while getting chats',
      details: { reason: error.message }
    });
  }
});

/**
 * GET /api/n8n-quote/chats/:id
 * Gets a specific n8n quote chat by ID
 */
router.get('/chats/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const chat = await N8nQuoteChat.findById(id);

    if (!chat) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Chat not found',
        details: { reason: 'Chat with specified ID not found' }
      });
    }

    return res.status(200).json({
      success: true,
      data: chat
    });
  } catch (error) {
    console.error('Unexpected error getting n8n quote chat:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while getting chat',
      details: { reason: error.message }
    });
  }
});

/**
 * GET /api/n8n-quote/pending-reviews
 * Gets all pending reviews
 */
router.get('/pending-reviews', (req, res) => {
  try {
    const pendingReviews = getPendingReviews();

    return res.status(200).json({
      success: true,
      reviews: pendingReviews // Changed from 'data' to 'reviews' to match frontend expectations
    });
  } catch (error) {
    console.error('Unexpected error getting pending reviews:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while getting pending reviews',
      details: { reason: error.message }
    });
  }
});

/**
 * GET /api/n8n-quote/all-reviews
 * Gets all reviews
 */
router.get('/all-reviews', (req, res) => {
  try {
    const allReviews = getAllReviews();

    return res.status(200).json({
      success: true,
      reviews: allReviews // Changed from 'data' to 'reviews' for consistency
    });
  } catch (error) {
    console.error('Unexpected error getting all reviews:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while getting all reviews',
      details: { reason: error.message }
    });
  }
});

/**
 * POST /api/n8n-quote/approve-review
 * Approves a review
 */
router.post('/approve-review', (req, res) => {
  try {
    const { queue_id, reviewer_email, notes } = req.body;

    if (!queue_id || !reviewer_email) {
      return res.status(400).json({
        error: 'MISSING_DATA',
        message: 'Queue ID and reviewer email are required',
        details: { reason: 'Queue ID and reviewer email are required for approval' }
      });
    }

    const result = approveReview(queue_id, reviewer_email, notes);

    if (!result) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Review not found',
        details: { reason: 'Review with specified queue ID not found' }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Review approved successfully'
    });
  } catch (error) {
    console.error('Unexpected error approving review:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while approving review',
      details: { reason: error.message }
    });
  }
});

/**
 * POST /api/n8n-quote/approve-with-price
 * Approves a review and sets a price for custom modifications
 */
router.post('/approve-with-price', async (req, res) => {
  try {
    const { queue_id, reviewer_email, price, notes, nodePrices } = req.body;

    if (!queue_id || !reviewer_email || !price) {
      return res.status(400).json({
        error: 'MISSING_DATA',
        message: 'Queue ID, reviewer email, and price are required',
        details: { reason: 'Queue ID, reviewer email, and price are required for approval' }
      });
    }

    // Get the review item
    const reviewItem = getReviewById(queue_id);
    if (!reviewItem) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Review not found',
        details: { reason: 'Review with specified queue ID not found' }
      });
    }

    // Ensure generated_quote exists
    if (!reviewItem.generated_quote) {
      reviewItem.generated_quote = {
        total_price: 0,
        modifications_price: 0,
        items: []
      };
    }

    // Update the review item with the price
    reviewItem.generated_quote.total_price = parseFloat(price);
    reviewItem.generated_quote.modifications_price = parseFloat(price);

    // Preserve original items if they exist, otherwise create a custom modification item
    if (!reviewItem.generated_quote.items || reviewItem.generated_quote.items.length === 0) {
      reviewItem.generated_quote.items = [{
        node_label: "Custom Modification",
        node_type: "custom_modification",
        base_price: parseFloat(price),
        total_price: parseFloat(price),
        confidence: 1.0
      }];
    } else {
      // Update the existing items with the new pricing information
      // For items with zero price or requiring manual review, update their base_price and total_price
      // For items with existing prices, keep their original prices
      reviewItem.generated_quote.items = reviewItem.generated_quote.items.map(item => {
        // If the item has zero price or requires manual review, update it with the admin-set price
        if (item.base_price === 0 ||
          (item.basePrice !== undefined && item.basePrice === 0) ||
          item.requires_manual_review === true ||
          (item.requiresManualReview !== undefined && item.requiresManualReview === true)) {
          // Check if we have individual node pricing
          let newPrice = parseFloat(price);
          if (nodePrices && nodePrices[item.node_id || item.nodeId || item.node_label || item.node_type]) {
            newPrice = parseFloat(nodePrices[item.node_id || item.nodeId || item.node_label || item.node_type]);
          }

          return {
            ...item,
            base_price: item.base_price === 0 ? newPrice : item.base_price,
            total_price: item.total_price === 0 ? newPrice : item.total_price
          };
        }
        // Otherwise, keep the original item
        return item;
      });
    }

    reviewItem.notes = notes || `Price set by admin: $${price}`;

    // Approve the review
    const result = approveReview(queue_id, reviewer_email, reviewItem.notes);

    if (!result) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Review not found',
        details: { reason: 'Review with specified queue ID not found' }
      });
    }

    // Send notification to customer about approval
    try {
      await sendQuoteApprovalNotification(reviewItem);
    } catch (notificationError) {
      console.error('Error sending quote approval notification:', notificationError);
      // We don't return an error here because the approval was successful
    }

    // Save chat data for the approved quote with complete details
    const chatData = {
      workflowId: 'workflow-' + Date.now(),
      fileName: reviewItem.original_request?.workflow || 'n8n-workflow.json',
      fileSize: 0,
      messages: [],
      modifications: reviewItem.original_request?.modifications || '',
      totalPrice: reviewItem.generated_quote.total_price || parseFloat(price),
      basePrice: 0,
      modificationsPrice: reviewItem.generated_quote.modifications_price || parseFloat(price),
      items: [{
        nodeId: 'custom-modification',
        nodeLabel: "Custom Modification",
        nodeType: "custom_modification",
        basePrice: parseFloat(price),
        totalPrice: parseFloat(price)
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // If we have more detailed quote information, use it instead
    if (reviewItem.generated_quote && reviewItem.generated_quote.items) {
      chatData.items = reviewItem.generated_quote.items.map(item => ({
        nodeId: item.node_id || item.nodeId || 'custom-modification',
        nodeLabel: item.node_label || item.nodeLabel || 'Custom Modification',
        nodeType: item.node_type || item.nodeType || 'custom_modification',
        basePrice: item.base_price !== undefined ? item.base_price : (item.basePrice || 0),
        totalPrice: item.total_price !== undefined ? item.total_price : (item.totalPrice || (item.base_price !== undefined ? item.base_price : (item.basePrice || 0))),
        requiresManualReview: item.requires_manual_review !== undefined ? item.requires_manual_review : (item.requiresManualReview || false)
      }));

      // Update pricing information
      chatData.basePrice = (reviewItem.generated_quote.total_price || 0) - (reviewItem.generated_quote.modifications_price || 0);
      chatData.modificationsPrice = reviewItem.generated_quote.modifications_price || parseFloat(price);
      chatData.totalPrice = reviewItem.generated_quote.total_price || parseFloat(price);
    }

    try {
      const newChat = new N8nQuoteChat(chatData);
      await newChat.save();
    } catch (chatError) {
      console.error('Error saving chat data:', chatError);
      // We don't return an error here because the approval was successful
    }

    // Also save to the new N8nProjectQuote model for complete project tracking
    try {
      // Try to find existing project quote by workflow ID or create new one
      let projectQuote = await N8nProjectQuote.findOne({ workflowId: reviewItem.original_request?.workflow || 'n8n-workflow.json' });

      // Prepare customer email - filter out empty strings
      let customerEmailValue = undefined;
      if (reviewItem.customer_email && reviewItem.customer_email.trim() !== '') {
        customerEmailValue = reviewItem.customer_email.trim();
      }

      if (!projectQuote) {
        // Create new project quote if not found
        const projectQuoteData = {
          projectId: `proj-${queue_id}`,
          workflowId: 'workflow-' + Date.now(),
          fileName: reviewItem.original_request?.workflow || 'n8n-workflow.json',
          fileSize: 0,
          customerEmail: customerEmailValue, // Use filtered value
          customerRequest: reviewItem.original_request?.modifications || '',
          status: 'approved',
          adminId: reviewer_email,
          adminNotes: notes || `Price set by admin: $${price}`,
          basePrice: (reviewItem.generated_quote.total_price || 0) - (reviewItem.generated_quote.modifications_price || 0),
          modificationsPrice: reviewItem.generated_quote.modifications_price || parseFloat(price),
          totalPrice: reviewItem.generated_quote.total_price || parseFloat(price),
          priceBreakdown: {
            estimatedWorkHours: 0,
            hourlyRate: 0,
            complexityFactor: 1,
            adminFee: 0,
            commission: 0,
            surcharges: 0,
            discounts: 0
          },
          nodes: reviewItem.generated_quote.items ? reviewItem.generated_quote.items.map(item => ({
            nodeId: item.node_id || item.nodeId || 'custom-modification',
            nodeLabel: item.node_label || item.nodeLabel || 'Custom Modification',
            nodeType: item.node_type || item.nodeType || 'custom_modification',
            basePrice: item.base_price !== undefined ? item.base_price : (item.basePrice !== undefined ? item.basePrice : 0),
            modifiers: [],
            totalPrice: item.total_price !== undefined ? item.total_price : (item.totalPrice !== undefined ? item.totalPrice : (item.base_price !== undefined ? item.base_price : (item.basePrice !== undefined ? item.basePrice : 0))),
            requiresManualReview: item.requires_manual_review !== undefined ? item.requires_manual_review : (item.requiresManualReview !== undefined ? item.requiresManualReview : false)
          })) : [{
            nodeId: 'custom-modification',
            nodeLabel: "Custom Modification",
            nodeType: "custom_modification",
            basePrice: parseFloat(price),
            modifiers: [],
            totalPrice: parseFloat(price),
            requiresManualReview: false
          }],
          modifications: reviewItem.original_request?.modifications ? [{
            description: reviewItem.original_request.modifications,
            price: reviewItem.generated_quote.modifications_price || parseFloat(price),
            requiresApproval: true,
            approved: true
          }] : [],
          workflowData: reviewItem.original_request || null,
          integrationStatus: 'pending', // Set initial integration status
          createdAt: new Date(),
          updatedAt: new Date(),
          reviewedAt: new Date()
        };

        projectQuote = new N8nProjectQuote(projectQuoteData);
      } else {
        // Update existing project quote
        projectQuote.status = 'approved';
        projectQuote.adminId = reviewer_email;
        projectQuote.adminNotes = notes || `Price set by admin: $${price}`;
        projectQuote.basePrice = (reviewItem.generated_quote.total_price || 0) - (reviewItem.generated_quote.modifications_price || 0);
        projectQuote.modificationsPrice = reviewItem.generated_quote.modifications_price || parseFloat(price);
        projectQuote.totalPrice = reviewItem.generated_quote.total_price || parseFloat(price);
        projectQuote.nodes = reviewItem.generated_quote.items ? reviewItem.generated_quote.items.map(item => ({
          nodeId: item.node_id || item.nodeId || 'custom-modification',
          nodeLabel: item.node_label || item.nodeLabel || 'Custom Modification',
          nodeType: item.node_type || item.nodeType || 'custom_modification',
          basePrice: item.base_price !== undefined ? item.base_price : (item.basePrice !== undefined ? item.basePrice : 0),
          modifiers: [],
          totalPrice: item.total_price !== undefined ? item.total_price : (item.totalPrice !== undefined ? item.totalPrice : (item.base_price !== undefined ? item.base_price : (item.basePrice !== undefined ? item.basePrice : 0))),
          requiresManualReview: item.requires_manual_review !== undefined ? item.requires_manual_review : (item.requiresManualReview || false)
        })) : [{
          nodeId: 'custom-modification',
          nodeLabel: "Custom Modification",
          nodeType: "custom_modification",
          basePrice: parseFloat(price),
          modifiers: [],
          totalPrice: parseFloat(price),
          requiresManualReview: false
        }];
        projectQuote.modifications = reviewItem.original_request?.modifications ? [{
          description: reviewItem.original_request.modifications,
          price: parseFloat(price),
          requiresApproval: true,
          approved: true
        }] : [];
        projectQuote.integrationStatus = 'pending'; // Reset integration status on approval
        projectQuote.updatedAt = new Date();
        projectQuote.reviewedAt = new Date();
      }

      await projectQuote.save();
    } catch (quoteError) {
      console.error('Error saving project quote data:', quoteError);
      // We don't return an error here because the approval was successful
    }

    // Create a pending estimate for this approved quote with complete details
    // Use a special identifier that can be found by both n8n quotes and the admin dashboard
    // Wrap in try-catch to prevent errors from causing false error responses
    let approvedEstimateData = null;
    let estimateId = null;

    try {
      const pendingEstimate = new PendingEstimate({
        jobId: `n8n-${queue_id}`, // Changed format to be more consistent
        originalEstimate: `$${parseFloat(price).toFixed(2)}`,
        aiAnalysis: {
          initialAnalysis: "Custom n8n workflow modification",
          finalAnalysis: "Price set by admin for custom modifications",
          questionsAndAnswers: []
        },
        status: 'approved',
        adminNotes: notes || `Price set by admin: $${price}`,
        calculatedPrice: parseFloat(price).toFixed(2),
        priceBreakdown: {
          estimatedWorkHours: "0",
          hourlyRate: "0",
          complexityFactor: "1",
          adminFee: "0",
          commission: "0",
          surcharges: "0",
          discounts: "0"
        },
        adminId: reviewer_email
      });

      // Add the complete workflow data to the estimate for reference
      if (reviewItem.original_request) {
        pendingEstimate.workflowData = reviewItem.original_request;
      }

      await pendingEstimate.save();

      // Build the complete approved estimate with all details
      approvedEstimateData = {
        _id: pendingEstimate._id,
        jobId: pendingEstimate.jobId,
        originalEstimate: pendingEstimate.originalEstimate,
        aiAnalysis: pendingEstimate.aiAnalysis,
        status: pendingEstimate.status,
        adminNotes: pendingEstimate.adminNotes,
        calculatedPrice: pendingEstimate.calculatedPrice,
        priceBreakdown: pendingEstimate.priceBreakdown,
        adminId: pendingEstimate.adminId,
        createdAt: pendingEstimate.createdAt,
        reviewedAt: pendingEstimate.reviewedAt,
        // Include the complete workflow data
        workflowData: reviewItem.original_request
      };

      estimateId = pendingEstimate._id;
    } catch (estimateError) {
      console.error('Error saving pending estimate:', estimateError);
      // Build a fallback estimate data object
      approvedEstimateData = {
        jobId: `n8n-${queue_id}`,
        originalEstimate: `$${parseFloat(price).toFixed(2)}`,
        aiAnalysis: {
          initialAnalysis: "Custom n8n workflow modification",
          finalAnalysis: "Price set by admin for custom modifications",
          questionsAndAnswers: []
        },
        status: 'approved',
        adminNotes: notes || `Price set by admin: $${price}`,
        calculatedPrice: parseFloat(price).toFixed(2),
        priceBreakdown: {
          estimatedWorkHours: "0",
          hourlyRate: "0",
          complexityFactor: "1",
          adminFee: "0",
          commission: "0",
          surcharges: "0",
          discounts: "0"
        },
        adminId: reviewer_email,
        createdAt: new Date(),
        workflowData: reviewItem.original_request
      };
      // Don't return error here because the core approval was successful
    }

    // Always return success since the core approval operation completed
    return res.status(200).json({
      success: true,
      message: 'Review approved successfully with price set',
      estimateId: estimateId,
      approvedEstimate: approvedEstimateData
    });
  } catch (error) {
    console.error('❌ Unexpected error approving review with price:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while approving review with price',
      details: {
        reason: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
});

/**
 * POST /api/n8n-quote/approve/:id
 * Approves an n8n quote and sets its pricing
 */
router.post('/approve/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { pricing } = req.body; // Expect pricing to be sent in the request body

    const quote = await N8nQuote.findById(id);
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // Update the quote status and pricing
    quote.status = 'Approved';
    quote.pricing = pricing; // Save confirmed pricing
    await quote.save();

    // Find the project associated with the quote using queueId
    // Assuming N8nQuote has a 'queueId' field that links to a Project
    const project = await Project.findOneAndUpdate(
      { queueId: quote.queueId },
      {
        status: 'Active',
        approvedQuoteId: quote._id,
        n8nPricing: quote.pricing
      },
      { new: true }
    );

    // Generate success link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const successLink = `${frontendUrl}/success?id=${quote._id}`;

    res.status(200).json({ message: 'Quote approved successfully', successLink });
  } catch (error) {
    console.error('Error approving n8n quote:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/n8n-quote/reject-review
 * Rejects a review
 */
router.post('/reject-review', (req, res) => {
  try {
    const { queue_id, reviewer_email, notes } = req.body;

    if (!queue_id || !reviewer_email) {
      return res.status(400).json({
        error: 'MISSING_DATA',
        message: 'Queue ID and reviewer email are required',
        details: { reason: 'Queue ID and reviewer email are required for rejection' }
      });
    }

    const result = rejectReview(queue_id, reviewer_email, notes);

    if (!result) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Review not found',
        details: { reason: 'Review with specified queue ID not found' }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Review rejected successfully'
    });
  } catch (error) {
    console.error('Unexpected error rejecting review:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while rejecting review',
      details: { reason: error.message }
    });
  }
});

/**
 * GET /api/n8n-quote/project-quotes
 * Gets all project quotes for the authenticated user
 */
router.get('/project-quotes', authenticateUser, async (req, res) => {
  try {
    // Filter by userId - users only see their own quotes
    const projectQuotes = await N8nProjectQuote.find({ userId: req.user.id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: projectQuotes
    });
  } catch (error) {
    console.error('Unexpected error getting project quotes:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while getting project quotes',
      details: { reason: error.message }
    });
  }
});

/**
 * GET /api/n8n-quote/project-quotes/:id
 * Gets a specific project quote by ID (only if user owns it)
 */
router.get('/project-quotes/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const projectQuote = await N8nProjectQuote.findById(id);

    if (!projectQuote) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Project quote not found',
        details: { reason: 'Project quote with specified ID not found' }
      });
    }

    // Verify user owns this quote
    if (projectQuote.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Not authorized to view this quote',
        details: { reason: 'You can only view your own quotes' }
      });
    }

    return res.status(200).json({
      success: true,
      data: projectQuote
    });
  } catch (error) {
    console.error('Unexpected error getting project quote:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while getting project quote',
      details: { reason: error.message }
    });
  }
});

/**
 * GET /api/n8n-quote/approved-quotes
 * Gets all approved project quotes for the authenticated user
 */
router.get('/approved-quotes', authenticateUser, async (req, res) => {
  try {
    // Filter by userId and status - users only see their own approved quotes
    const approvedQuotes = await N8nProjectQuote.find({
      userId: req.user.id,
      status: 'approved'
    }).sort({ reviewedAt: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: approvedQuotes
    });
  } catch (error) {
    console.error('Unexpected error getting approved quotes:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while getting approved quotes',
      details: { reason: error.message }
    });
  }
});

/**
 * POST /api/n8n-quote/update-integration-status
 * Updates the integration status of a project quote
 */
router.post('/update-integration-status', authenticateUser, async (req, res) => {
  try {
    const { quoteId, status, error } = req.body;

    if (!quoteId || !status) {
      return res.status(400).json({
        error: 'MISSING_DATA',
        message: 'Quote ID and status are required',
        details: { reason: 'quoteId and status are required fields' }
      });
    }

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'INVALID_STATUS',
        message: 'Invalid integration status',
        details: { reason: `Status must be one of: ${validStatuses.join(', ')}` }
      });
    }

    const projectQuote = await N8nProjectQuote.findById(quoteId);

    if (!projectQuote) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Project quote not found',
        details: { reason: 'Project quote with specified ID not found' }
      });
    }

    // Verify user owns this quote
    if (projectQuote.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Not authorized to update this quote',
        details: { reason: 'You can only update your own quotes' }
      });
    }

    // Update integration status
    projectQuote.integrationStatus = status;

    // Set completion timestamp if completed or failed
    if (status === 'completed' || status === 'failed') {
      projectQuote.integrationCompletedAt = new Date();
    }

    // Set error message if failed
    if (status === 'failed' && error) {
      projectQuote.integrationError = error;
    } else if (status !== 'failed') {
      projectQuote.integrationError = null;
    }

    await projectQuote.save();

    return res.status(200).json({
      success: true,
      message: 'Integration status updated successfully',
      data: projectQuote
    });
  } catch (error) {
    console.error('Unexpected error updating integration status:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while updating integration status',
      details: { reason: error.message }
    });
  }
});

// Reject n8n Quote
router.post('/reject/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const quote = await N8nQuote.findById(id);
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    quote.status = 'Rejected';
    await quote.save();

    res.status(200).json({ message: 'Quote rejected successfully', quote });
  } catch (error) {
    console.error('Error rejecting n8n quote:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;