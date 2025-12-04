/**
 * Prompt template engine for LLM-based quote generation
 */

// System prompt as specified
const SYSTEM_PROMPT = `You are a quoting assistant for workflow automation pricing. 

Rules:
1. Use ONLY the workflow items provided - do not invent prices
2. Map customer requests to existing item IDs
3. When a customer requests something not in the workflow, set requires_manual_review: true
4. Calculate price changes using the base prices and modifiers provided
5. If price change exceeds approval threshold, set requires_manual_review: true
6. Output ONLY valid JSON - no explanatory text
7. Keep remarks under 150 words

Output schema:
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
}`;

/**
 * User prompt template
 * @param {Object} workflow - Workflow items
 * @param {string} customerText - Customer request
 * @param {Object} businessRules - Business rules
 * @returns {string} Formatted user prompt
 */
function buildUserPrompt(workflow, customerText, businessRules) {
  return `Workflow items:
${JSON.stringify(workflow, null, 2)}

Customer request:
${customerText}

Business rules:
${JSON.stringify(businessRules, null, 2)}

Generate a quote following the rules above.`;
}

/**
 * Builds the complete prompt set for the LLM
 * @param {Object} compactPayload - Compact payload with workflow, customer text, and business rules
 * @returns {Object} Object containing system and user prompts
 */
function buildPrompt(compactPayload) {
  // Handle edge case: null or undefined input
  if (!compactPayload) {
    return {
      system: SYSTEM_PROMPT,
      user: buildUserPrompt([], '', {})
    };
  }

  const { workflow, customer_text, business_rules } = compactPayload;
  
  return {
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(workflow, customer_text, business_rules)
  };
}

module.exports = {
  SYSTEM_PROMPT,
  buildUserPrompt,
  buildPrompt
};