/**
 * Builds a compact payload for LLM processing to minimize token usage
 * @param {Object} priceList - The structured price list from Phase 2C
 * @param {string} customerText - Customer instructions or requirements
 * @param {Object} businessRules - Business rules for processing
 * @returns {Object} Compact payload for LLM processing
 */
function buildCompactPayload(priceList, customerText, businessRules) {
  // Handle edge case: null or undefined inputs
  if (!priceList || !priceList.items) {
    return {
      workflow: [],
      customer_text: customerText || '',
      business_rules: businessRules || {}
    };
  }

  // Create compact workflow items with only essential information
  const compactWorkflow = priceList.items.map(item => ({
    id: item.id,
    label: item.label,
    base: item.base_price,
    modifiers: item.modifiers || []
  }));

  return {
    workflow: compactWorkflow,
    customer_text: customerText || '',
    business_rules: businessRules || {}
  };
}

/**
 * Estimates the token count for a given text (approximate)
 * @param {string} text - Text to estimate tokens for
 * @returns {number} Estimated token count
 */
function estimateTokenCount(text) {
  if (!text) return 0;
  
  // Rough estimation: 1 token ≈ 4 characters in English
  // This is a simplified estimation for demonstration purposes
  return Math.ceil(text.length / 4);
}

/**
 * Compares payload sizes between full and compact versions
 * @param {Object} fullPayload - Full payload with all details
 * @param {Object} compactPayload - Compact payload
 * @returns {Object} Size comparison information
 */
function comparePayloadSizes(fullPayload, compactPayload) {
  const fullPayloadStr = JSON.stringify(fullPayload);
  const compactPayloadStr = JSON.stringify(compactPayload);
  
  const fullSize = fullPayloadStr.length;
  const compactSize = compactPayloadStr.length;
  const reduction = fullSize - compactSize;
  const reductionPercent = ((reduction / fullSize) * 100).toFixed(2);
  
  return {
    full_size_chars: fullSize,
    compact_size_chars: compactSize,
    reduction_chars: reduction,
    reduction_percent: parseFloat(reductionPercent),
    full_tokens_estimate: estimateTokenCount(fullPayloadStr),
    compact_tokens_estimate: estimateTokenCount(compactPayloadStr),
    token_reduction_estimate: estimateTokenCount(fullPayloadStr) - estimateTokenCount(compactPayloadStr)
  };
}

module.exports = {
  buildCompactPayload,
  estimateTokenCount,
  comparePayloadSizes
};