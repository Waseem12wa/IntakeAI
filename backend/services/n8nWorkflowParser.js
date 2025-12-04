const crypto = require('crypto');

/**
 * Parses an n8n workflow JSON into a normalized internal structure
 * @param {Object} workflowJson - The raw n8n workflow JSON object
 * @returns {Object} Structured workflow object
 */
function parseN8nToStructured(workflowJson) {
  // Handle edge case: null or undefined input
  if (!workflowJson) {
    return {
      nodes: [],
      metadata: {
        total_nodes: 0,
        workflow_name: 'Unnamed Workflow'
      }
    };
  }

  // Extract workflow name or use default
  const workflowName = workflowJson.name || 'Unnamed Workflow';
  
  // Handle edge case: missing nodes array
  const nodes = workflowJson.nodes || [];
  
  // Parse nodes into structured format
  const structuredNodes = nodes.map(node => {
    // Handle edge case: missing required fields
    const nodeId = node.id || generateNodeId();
    const nodeType = getNodeBaseType(node.type) || 'unknown';
    const shortLabel = node.name || `Unnamed ${nodeType} Node`;
    
    // Create a hash of the parameters for comparison
    const paramsHash = createParamsHash(node.parameters || {});
    
    // Default estimated units to 1
    const estimatedUnits = 1;
    
    return {
      node_id: nodeId,
      node_type: nodeType,
      short_label: shortLabel,
      params_hash: paramsHash,
      estimated_units: estimatedUnits
    };
  });
  
  return {
    nodes: structuredNodes,
    metadata: {
      total_nodes: structuredNodes.length,
      workflow_name: workflowName
    }
  };
}

/**
 * Extracts the base node type from the full node type string
 * @param {string} fullType - Full node type (e.g., "n8n-nodes-base.httpRequest")
 * @returns {string} Base node type (e.g., "httpRequest")
 */
function getNodeBaseType(fullType) {
  if (!fullType) return 'unknown';
  
  // Split by '.' and take the last part
  const parts = fullType.split('.');
  return parts[parts.length - 1] || fullType;
}

/**
 * Generates a unique node ID when one is missing
 * @returns {string} Generated node ID
 */
function generateNodeId() {
  return 'generated_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Creates an MD5 hash of the parameters object
 * @param {Object} params - Parameters object
 * @returns {string} MD5 hash of the parameters
 */
function createParamsHash(params) {
  try {
    // Sort keys to ensure consistent hashing
    const sortedParams = sortObjectKeys(params);
    const paramsString = JSON.stringify(sortedParams);
    return crypto.createHash('md5').update(paramsString).digest('hex');
  } catch (error) {
    // If hashing fails, return a default hash
    return '00000000000000000000000000000000';
  }
}

/**
 * Recursively sorts object keys for consistent serialization
 * @param {Object} obj - Object to sort
 * @returns {Object} Object with sorted keys
 */
function sortObjectKeys(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return obj;
  }
  
  const sortedObj = {};
  Object.keys(obj).sort().forEach(key => {
    sortedObj[key] = sortObjectKeys(obj[key]);
  });
  
  return sortedObj;
}

module.exports = {
  parseN8nToStructured
};