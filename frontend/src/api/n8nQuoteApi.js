// API helper for n8n quote generation endpoints
import { getAuthHeaders } from '../utils/api';

const API_BASE_URL = '/api/n8n-quote';

class N8nQuoteApi {
  // Validate an n8n workflow file
  static async validateWorkflow(file) {
    const formData = new FormData();
    formData.append('workflow', file);

    const response = await fetch(`${API_BASE_URL}/validate`, {
      method: 'POST',
      body: formData
    });

    return await response.json();
  }

  // Parse an n8n workflow into structured format
  static async parseWorkflow(file) {
    const formData = new FormData();
    formData.append('workflow', file);

    const response = await fetch(`${API_BASE_URL}/parse`, {
      method: 'POST',
      body: formData
    });

    return await response.json();
  }

  // Generate a price list from an n8n workflow
  static async generatePriceList(file) {
    const formData = new FormData();
    formData.append('workflow', file);

    const response = await fetch(`${API_BASE_URL}/price-list`, {
      method: 'POST',
      body: formData
    });

    return await response.json();
  }

  // Build a compact payload for LLM processing
  static async buildCompactPayload(file, customerText = '', businessRules = {}) {
    const formData = new FormData();
    formData.append('workflow', file);
    formData.append('customer_text', customerText);

    // Add business rules if provided
    Object.keys(businessRules).forEach(key => {
      formData.append(`business_rules[${key}]`, businessRules[key]);
    });

    const response = await fetch(`${API_BASE_URL}/compact-payload`, {
      method: 'POST',
      body: formData
    });

    return await response.json();
  }

  // Build LLM prompts from compact payload
  static async buildPrompt(compactPayload) {
    const response = await fetch(`${API_BASE_URL}/build-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(compactPayload)
    });

    return await response.json();
  }

  // Add a quote to the review queue
  static async addToReviewQueue(quote, reasons, originalRequest, customerEmail) {
    const response = await fetch(`${API_BASE_URL}/add-to-review-queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        quote,
        reasons,
        original_request: originalRequest,
        customer_email: customerEmail
      })
    });

    return await response.json();
  }

  // Get pending reviews
  static async getPendingReviews() {
    const response = await fetch(`${API_BASE_URL}/pending-reviews`);
    return await response.json();
  }

  // Get all reviews
  static async getAllReviews() {
    const response = await fetch(`${API_BASE_URL}/all-reviews`);
    return await response.json();
  }

  // Approve a review
  static async approveReview(queueId, reviewerEmail, notes = '') {
    const response = await fetch(`${API_BASE_URL}/approve-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        queue_id: queueId,
        reviewer_email: reviewerEmail,
        notes
      })
    });

    return await response.json();
  }

  // Reject a review
  static async rejectReview(queueId, reviewerEmail, notes = '') {
    const response = await fetch(`${API_BASE_URL}/reject-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        queue_id: queueId,
        reviewer_email: reviewerEmail,
        notes
      })
    });

    return await response.json();
  }

  // Save chat data
  static async saveChat(chatData) {
    const response = await fetch(`${API_BASE_URL}/save-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(chatData)
    });

    return await response.json();
  }

  // Get all project quotes
  static async getProjectQuotes() {
    const response = await fetch(`${API_BASE_URL}/project-quotes`, {
      headers: getAuthHeaders()
    });
    return await response.json();
  }

  // Get a specific project quote by ID
  static async getProjectQuoteById(id) {
    const response = await fetch(`${API_BASE_URL}/project-quotes/${id}`, {
      headers: getAuthHeaders()
    });
    return await response.json();
  }

  // Get approved quotes for the authenticated user
  static async getApprovedQuotes() {
    const response = await fetch(`${API_BASE_URL}/approved-quotes`, {
      headers: getAuthHeaders()
    });
    return await response.json();
  }

  // Update integration status for a quote
  static async updateIntegrationStatus(quoteId, status, error = null) {
    const response = await fetch(`${API_BASE_URL}/update-integration-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        quoteId,
        status,
        error
      })
    });

    return await response.json();
  }
}

export default N8nQuoteApi;