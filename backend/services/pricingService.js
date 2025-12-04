const fs = require('fs');
const path = require('path');

// Load the translation key (pricing database)
const translationKeyPath = path.join(__dirname, '../../data/translation_key.json');
let translationKey = null;

try {
  const translationKeyData = fs.readFileSync(translationKeyPath, 'utf8');
  translationKey = JSON.parse(translationKeyData);
} catch (error) {
  console.error('Failed to load translation key:', error);
  translationKey = { node_types: {}, global_modifiers: {} };
}

/**
 * Gets the pricing information for a node type
 * @param {string} nodeType - The type of node
 * @returns {Object|null} Pricing information for the node type or null if not found
 */
function getPricingForNodeType(nodeType) {
  if (!translationKey || !translationKey.node_types) {
    return null;
  }
  
  return translationKey.node_types[nodeType] || null;
}

/**
 * Calculates the price for a node based on its type and modifiers
 * @param {string} nodeType - The type of node
 * @param {Object} modifiers - The modifiers to apply (e.g., { concurrency: 3, attachment_mb: 10 })
 * @returns {Object} Price calculation result with breakdown
 */
function calculatePriceForNode(nodeType, modifiers = {}) {
  const pricingInfo = getPricingForNodeType(nodeType);
  
  if (!pricingInfo) {
    return {
      success: false,
      error: 'NODE_TYPE_NOT_FOUND',
      message: `Pricing information not found for node type: ${nodeType}`,
      price: 0
    };
  }
  
  // Start with base price
  let calculatedPrice = pricingInfo.base_price;
  const breakdown = [{
    description: `${pricingInfo.label} (base)`,
    amount: pricingInfo.base_price
  }];
  
  // Apply modifiers
  if (pricingInfo.modifiers && Array.isArray(pricingInfo.modifiers)) {
    pricingInfo.modifiers.forEach(modifier => {
      const modifierValue = modifiers[modifier.name];
      
      if (modifierValue !== undefined && modifierValue !== null) {
        let modifierCost = 0;
        let description = '';
        
        switch (modifier.type) {
          case 'per_unit':
            modifierCost = modifierValue * modifier.price_per_unit;
            description = `${modifier.name}: ${modifierValue} × $${modifier.price_per_unit.toFixed(2)}`;
            break;
            
          case 'per_mb':
            modifierCost = modifierValue * modifier.price_per_unit;
            description = `${modifier.name}: ${modifierValue} MB × $${modifier.price_per_unit.toFixed(2)}/MB`;
            break;
            
          case 'per_kb':
            modifierCost = modifierValue * modifier.price_per_unit;
            description = `${modifier.name}: ${modifierValue} KB × $${modifier.price_per_unit.toFixed(2)}/KB`;
            break;
            
          case 'boolean':
            modifierCost = modifierValue ? modifier.price_per_unit : 0;
            description = modifierValue ? `${modifier.name}: Yes (+$${modifier.price_per_unit.toFixed(2)})` : `${modifier.name}: No (+$0.00)`;
            break;
            
          case 'multiplier':
            modifierCost = calculatedPrice * (modifier.price_per_unit - 1);
            description = `${modifier.name}: ${modifierValue} × ${modifier.price_per_unit.toFixed(2)}x`;
            break;
            
          default:
            modifierCost = 0;
            description = `${modifier.name}: Unknown modifier type`;
        }
        
        calculatedPrice += modifierCost;
        breakdown.push({
          description: description,
          amount: modifierCost
        });
      }
    });
  }
  
  // Apply price rules (min/max)
  if (pricingInfo.price_rules) {
    if (pricingInfo.price_rules.min && calculatedPrice < pricingInfo.price_rules.min) {
      const adjustment = pricingInfo.price_rules.min - calculatedPrice;
      calculatedPrice = pricingInfo.price_rules.min;
      breakdown.push({
        description: `Minimum price adjustment`,
        amount: adjustment
      });
    }
    
    if (pricingInfo.price_rules.max && calculatedPrice > pricingInfo.price_rules.max) {
      const adjustment = pricingInfo.price_rules.max - calculatedPrice;
      calculatedPrice = pricingInfo.price_rules.max;
      breakdown.push({
        description: `Maximum price adjustment`,
        amount: adjustment
      });
    }
  }
  
  // Ensure price is not negative
  calculatedPrice = Math.max(0, calculatedPrice);
  
  return {
    success: true,
    node_type: nodeType,
    base_price: pricingInfo.base_price,
    final_price: parseFloat(calculatedPrice.toFixed(2)),
    breakdown: breakdown,
    currency: pricingInfo.price_rules?.currency || 'USD'
  };
}

/**
 * Gets all available node types from the translation key
 * @returns {Array} Array of available node type IDs
 */
function getAvailableNodeTypes() {
  if (!translationKey || !translationKey.node_types) {
    return [];
  }
  
  return Object.keys(translationKey.node_types);
}

/**
 * Gets global modifiers
 * @returns {Object} Global modifiers
 */
function getGlobalModifiers() {
  if (!translationKey || !translationKey.global_modifiers) {
    return {};
  }
  
  return translationKey.global_modifiers;
}

module.exports = {
  getPricingForNodeType,
  calculatePriceForNode,
  getAvailableNodeTypes,
  getGlobalModifiers
};