const { lookupByNodeType } = require('./translationKey');

/**
 * Parses and validates the LLM response JSON
 * @param {Object} llmJson - The JSON response from the LLM
 * @param {Object} originalWorkflow - The original workflow structure
 * @returns {Object} Validated quote with errors and review flags
 */
function parseAndValidateLlmResponse(llmJson, originalWorkflow) {
  // Handle edge case: null or undefined inputs
  if (!llmJson || !originalWorkflow) {
    return {
      validated_quote: null,
      validation_errors: ['Invalid input: LLM JSON or original workflow is missing'],
      requires_review: true,
      review_reasons: ['Missing required input data']
    };
  }

  // Initialize result structure
  const result = {
    validated_quote: null,
    validation_errors: [],
    requires_review: false,
    review_reasons: []
  };

  // Check if llmJson has the expected structure
  if (!llmJson.quote) {
    result.validation_errors.push('Missing quote object in LLM response');
    result.requires_review = true;
    result.review_reasons.push('Invalid LLM response structure');
    return result;
  }

  const quote = llmJson.quote;
  
  // Validate required fields in quote
  const requiredQuoteFields = ['items', 'total_price', 'total_delta', 'flags', 'remarks'];
  for (const field of requiredQuoteFields) {
    if (quote[field] === undefined) {
      result.validation_errors.push(`Missing required field in quote: ${field}`);
    }
  }

  if (result.validation_errors.length > 0) {
    result.requires_review = true;
    result.review_reasons.push('Missing required fields in quote');
    return result;
  }

  // Create a map of original workflow items by ID for quick lookup
  const workflowItemsMap = {};
  if (originalWorkflow.workflow && Array.isArray(originalWorkflow.workflow)) {
    originalWorkflow.workflow.forEach(item => {
      workflowItemsMap[item.id] = item;
    });
  }

  // Validate each item in the quote
  const validatedItems = [];
  let totalNewPrice = 0;
  let totalDelta = 0;

  if (Array.isArray(quote.items)) {
    for (const item of quote.items) {
      const validatedItem = { ...item };
      
      // Validate required fields in item
      const requiredItemFields = ['item_id', 'action', 'requested_change', 'new_price', 'price_delta', 'reason', 'mapping_confidence', 'requires_manual_review'];
      for (const field of requiredItemFields) {
        if (item[field] === undefined) {
          result.validation_errors.push(`Missing required field in item ${item.item_id || 'unknown'}: ${field}`);
        }
      }

      // Validate item_id exists in original workflow
      if (item.item_id && !workflowItemsMap[item.item_id]) {
        result.validation_errors.push(`Item ID ${item.item_id} not found in original workflow`);
        validatedItem.requires_manual_review = true;
        if (!result.review_reasons.includes('Item ID not found in original workflow')) {
          result.review_reasons.push('Item ID not found in original workflow');
        }
      }

      // Validate mapping_confidence is between 0 and 1
      if (typeof item.mapping_confidence === 'number' && (item.mapping_confidence < 0 || item.mapping_confidence > 1)) {
        result.validation_errors.push(`Mapping confidence for item ${item.item_id || 'unknown'} must be between 0 and 1`);
      } else if (typeof item.mapping_confidence === 'number' && item.mapping_confidence < 0.6) {
        validatedItem.requires_manual_review = true;
        if (!result.review_reasons.includes('Low mapping confidence')) {
          result.review_reasons.push('Low mapping confidence');
        }
      }

      // Validate price bounds using translation key
      if (item.item_id && workflowItemsMap[item.item_id]) {
        const originalItem = workflowItemsMap[item.item_id];
        const pricingInfo = lookupByNodeType(originalItem.node_type || originalItem.type);
        
        if (pricingInfo && pricingInfo.price_rules) {
          const minPrice = pricingInfo.price_rules.min || 0;
          const maxPrice = pricingInfo.price_rules.max || Infinity;
          
          if (typeof item.new_price === 'number' && (item.new_price < minPrice || item.new_price > maxPrice)) {
            result.validation_errors.push(`Price for item ${item.item_id} (${item.new_price}) is out of bounds (${minPrice}-${maxPrice})`);
            if (!result.review_reasons.includes('Price out of bounds')) {
              result.review_reasons.push('Price out of bounds');
            }
          }
        }
      }

      // Check if new items are allowed (this would require business rules)
      if (item.action === 'add' && originalWorkflow.business_rules && !originalWorkflow.business_rules.allow_new_item) {
        result.validation_errors.push(`New item ${item.item_id || 'unknown'} not allowed by business rules`);
        validatedItem.requires_manual_review = true;
        if (!result.review_reasons.includes('New item not allowed')) {
          result.review_reasons.push('New item not allowed');
        }
      }

      validatedItems.push(validatedItem);
      if (typeof item.new_price === 'number') totalNewPrice += item.new_price;
      if (typeof item.price_delta === 'number') totalDelta += item.price_delta;
    }
  }

  // Validate totals match
  const calculatedTotalPrice = parseFloat(totalNewPrice.toFixed(2));
  const calculatedTotalDelta = parseFloat(totalDelta.toFixed(2));
  
  if (Math.abs(quote.total_price - calculatedTotalPrice) > 0.01) {
    result.validation_errors.push(`Total price mismatch: reported ${quote.total_price}, calculated ${calculatedTotalPrice}`);
  }
  
  if (Math.abs(quote.total_delta - calculatedTotalDelta) > 0.01) {
    result.validation_errors.push(`Total delta mismatch: reported ${quote.total_delta}, calculated ${calculatedTotalDelta}`);
  }

  // Check for out of bounds flag
  if (quote.flags && quote.flags.includes('out_of_bounds')) {
    if (!result.review_reasons.includes('Price out of bounds')) {
      result.review_reasons.push('Price out of bounds');
    }
  }

  // Check for manual review flag
  if (quote.flags && quote.flags.includes('requires_manual_review')) {
    result.requires_review = true;
    if (!result.review_reasons.includes('LLM requested manual review')) {
      result.review_reasons.push('LLM requested manual review');
    }
  }

  // Set requires_review flag if there are validation errors
  if (result.validation_errors.length > 0) {
    result.requires_review = true;
  }

  // Build validated quote
  result.validated_quote = {
    ...quote,
    items: validatedItems,
    total_price: calculatedTotalPrice,
    total_delta: calculatedTotalDelta
  };

  return result;
}

/**
 * Validates if a JSON string is valid
 * @param {string} jsonString - The JSON string to validate
 * @returns {Object} Parse result with isValid flag and parsed data or error
 */
function validateJsonString(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    return {
      isValid: true,
      data: parsed
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message
    };
  }
}

module.exports = {
  parseAndValidateLlmResponse,
  validateJsonString
};