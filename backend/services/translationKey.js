const fs = require('fs');
const path = require('path');

// Module-level variable to store the loaded translation key
let translationKey = null;

/**
 * Loads the translation key JSON file into memory
 * @returns {Object} The loaded translation key
 */
function loadTranslationKey() {
  if (translationKey) {
    return translationKey;
  }
  
  try {
    const translationKeyPath = path.join(__dirname, '../../data/translation_key.json');
    const translationKeyData = fs.readFileSync(translationKeyPath, 'utf8');
    translationKey = JSON.parse(translationKeyData);
    return translationKey;
  } catch (error) {
    console.error('Failed to load translation key:', error);
    translationKey = { node_types: {}, global_modifiers: {} };
    return translationKey;
  }
}

/**
 * Looks up pricing information by node type
 * @param {string} nodeType - The node type to look up
 * @returns {Object|null} Pricing object for the node type or null if not found
 */
function lookupByNodeType(nodeType) {
  // Load translation key if not already loaded
  if (!translationKey) {
    loadTranslationKey();
  }
  
  if (!translationKey || !translationKey.node_types) {
    return null;
  }
  
  return translationKey.node_types[nodeType] || null;
}

/**
 * Applies a modifier to calculate additional cost
 * @param {Object} item - The pricing item from lookupByNodeType
 * @param {string} modifierName - The name of the modifier to apply
 * @param {number|boolean} value - The value to apply for the modifier
 * @returns {Object} Modifier calculation result with cost and description
 */
function applyModifier(item, modifierName, value) {
  if (!item || !item.modifiers) {
    return {
      cost: 0,
      description: 'Invalid item or no modifiers'
    };
  }
  
  const modifier = item.modifiers.find(m => m.name === modifierName);
  
  if (!modifier) {
    return {
      cost: 0,
      description: `Modifier '${modifierName}' not found`
    };
  }
  
  let cost = 0;
  let description = '';
  
  switch (modifier.type) {
    case 'per_unit':
      cost = value * modifier.price_per_unit;
      description = `${modifierName}: ${value} × $${modifier.price_per_unit.toFixed(2)}`;
      break;
      
    case 'per_mb':
      cost = value * modifier.price_per_unit;
      description = `${modifierName}: ${value} MB × $${modifier.price_per_unit.toFixed(2)}/MB`;
      break;
      
    case 'per_kb':
      cost = value * modifier.price_per_unit;
      description = `${modifierName}: ${value} KB × $${modifier.price_per_unit.toFixed(2)}/KB`;
      break;
      
    case 'boolean':
      cost = value ? modifier.price_per_unit : 0;
      description = value ? `${modifierName}: Yes (+$${modifier.price_per_unit.toFixed(2)})` : `${modifierName}: No (+$0.00)`;
      break;
      
    case 'multiplier':
      // For multiplier, we need a base value to multiply
      cost = value * modifier.price_per_unit;
      description = `${modifierName}: ${value} × ${modifier.price_per_unit.toFixed(2)}`;
      break;
      
    default:
      cost = 0;
      description = `${modifierName}: Unknown modifier type`;
  }
  
  return {
    cost: parseFloat(cost.toFixed(2)),
    description: description
  };
}

/**
 * Computes the final price for an item with given modifiers
 * @param {Object} item - The pricing item from lookupByNodeType
 * @param {Object} modifiersDict - Dictionary of modifiers to apply
 * @returns {Object} Price calculation result with final price and breakdown
 */
function computePrice(item, modifiersDict = {}) {
  if (!item) {
    return {
      final_price: 0,
      breakdown: [{ description: 'Invalid item', amount: 0 }]
    };
  }
  
  // Start with base price
  let calculatedPrice = item.base_price;
  const breakdown = [{
    description: `${item.label} (base)`,
    amount: item.base_price
  }];
  
  // Apply modifiers
  if (item.modifiers && Array.isArray(item.modifiers)) {
    item.modifiers.forEach(modifier => {
      const modifierValue = modifiersDict[modifier.name];
      
      if (modifierValue !== undefined && modifierValue !== null) {
        const modifierResult = applyModifier(item, modifier.name, modifierValue);
        calculatedPrice += modifierResult.cost;
        breakdown.push({
          description: modifierResult.description,
          amount: modifierResult.cost
        });
      }
    });
  }
  
  // Apply price rules (min/max)
  if (item.price_rules) {
    if (item.price_rules.min && calculatedPrice < item.price_rules.min) {
      const adjustment = item.price_rules.min - calculatedPrice;
      calculatedPrice = item.price_rules.min;
      breakdown.push({
        description: `Minimum price adjustment`,
        amount: parseFloat(adjustment.toFixed(2))
      });
    }
    
    if (item.price_rules.max && calculatedPrice > item.price_rules.max) {
      const adjustment = item.price_rules.max - calculatedPrice;
      calculatedPrice = item.price_rules.max;
      breakdown.push({
        description: `Maximum price adjustment`,
        amount: parseFloat(adjustment.toFixed(2))
      });
    }
  }
  
  // Ensure price is not negative
  calculatedPrice = Math.max(0, calculatedPrice);
  
  return {
    final_price: parseFloat(calculatedPrice.toFixed(2)),
    breakdown: breakdown
  };
}

// Load the translation key when module is imported
loadTranslationKey();

module.exports = {
  loadTranslationKey,
  lookupByNodeType,
  applyModifier,
  computePrice
};