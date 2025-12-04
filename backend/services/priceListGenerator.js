const { lookupByNodeType } = require('./translationKey');

/**
 * Generates a structured price list from a parsed workflow and translation key
 * @param {Object} structuredWorkflow - The parsed workflow structure
 * @returns {Object} Structured price list with items and summary
 */
function generatePriceList(structuredWorkflow) {
  // Handle edge case: null or undefined input
  if (!structuredWorkflow || !structuredWorkflow.nodes) {
    return {
      items: [],
      summary: {
        total_items: 0,
        estimated_base_total: 0.0
      }
    };
  }

  const items = [];
  let estimatedBaseTotal = 0.0;

  // Process each node in the workflow
  structuredWorkflow.nodes.forEach(node => {
    // Look up pricing from translation key
    const pricingInfo = lookupByNodeType(node.node_type);
    
    if (pricingInfo) {
      // Create price list item
      const item = {
        id: node.node_id,
        label: node.short_label,
        node_type: node.node_type,
        base_price: pricingInfo.base_price,
        modifiers: pricingInfo.modifiers ? pricingInfo.modifiers.map(m => m.name) : [],
        notes: `Min $${pricingInfo.price_rules?.min || 0}, Max $${pricingInfo.price_rules?.max || 0}`,
        // Nodes in translation key require manual review if they have zero price
        requires_manual_review: pricingInfo.base_price === 0
      };
      
      items.push(item);
      estimatedBaseTotal += pricingInfo.base_price;
    } else {
      // Handle unmapped node types - mark as requires_manual_review
      const item = {
        id: node.node_id,
        label: node.short_label,
        node_type: node.node_type,
        base_price: 0.0,
        modifiers: [],
        notes: "Requires manual review - node type not in pricing database",
        requires_manual_review: true
      };
      
      items.push(item);
    }
  });

  return {
    items: items,
    summary: {
      total_items: items.length,
      estimated_base_total: parseFloat(estimatedBaseTotal.toFixed(2))
    }
  };
}

module.exports = {
  generatePriceList
};