/**
 * Parses customer email text for obvious structured directives before sending to LLM
 * @param {string} customerText - Customer email text to parse
 * @returns {Object} Parsed intent with detected patterns and directives
 */
function parseCustomerIntent(customerText) {
  // Handle edge case: null or empty input
  if (!customerText || typeof customerText !== 'string') {
    return {
      detected_patterns: [],
      parsed_directives: [],
      needs_llm: true
    };
  }

  const detectedPatterns = [];
  const parsedDirectives = [];
  const lowerText = customerText.toLowerCase();

  // Common patterns to detect
  const patterns = [
    // Add node patterns
    {
      regex: /\badd\s+(node\s+)?(http|webhook|function|code|schedule|email|database)\b/i,
      pattern: "add_node",
      action: "add",
      target: "workflow",
      change: "new_node"
    },
    
    // Timeout patterns
    {
      regex: /\b(increase|decrease|extend|reduce)\s+(timeout|time\s+limit)\s+to\s+(\d+)/i,
      pattern: "modify_timeout",
      action: "modify",
      target: "all_nodes",
      change: "timeout"
    },
    
    // Async patterns
    {
      regex: /\bmake\s+it\s+async\b|\basync\b/i,
      pattern: "make_async",
      action: "modify",
      target: "workflow",
      change: "async"
    },
    
    // Retry patterns
    {
      regex: /\b(add|enable)\s+(retry|retries)\b|\bretry\b/i,
      pattern: "add_retry",
      action: "modify",
      target: "all_http",
      change: "add_retry"
    },
    
    // Parameter modification patterns
    {
      regex: /\b(increase|decrease|boost|reduce)\s+(\w+)/i,
      pattern: "modify_parameter",
      action: "modify",
      target: "matched_nodes",
      change: "parameter"
    },
    
    // Urgent patterns
    {
      regex: /\b(urgent|rush|rush\s+order|asap|emergency)\b/i,
      pattern: "urgent",
      action: "flag",
      target: "order",
      change: "urgent"
    },
    
    // Reliability patterns
    {
      regex: /\b(increase|improve|boost)\s+(reliability|reliableness|stability)\b/i,
      pattern: "increase_reliability",
      action: "modify",
      target: "workflow",
      change: "reliability"
    },
    
    // Attachment patterns
    {
      regex: /\b(add|support)\s+(file\s+)?(attachment|attachments)\b/i,
      pattern: "add_attachment_support",
      action: "modify",
      target: "http_nodes",
      change: "attachment_support"
    },
    
    // Cost patterns
    {
      regex: /\b(keep\s+)?(cost|price|pricing)\s+(low|down|cheap)\b/i,
      pattern: "cost_optimization",
      action: "flag",
      target: "order",
      change: "cost_optimization"
    },
    
    // Performance patterns
    {
      regex: /\b(improve|boost|increase)\s+(performance|speed|efficiency)\b/i,
      pattern: "improve_performance",
      action: "modify",
      target: "workflow",
      change: "performance"
    }
  ];

  // Check each pattern
  patterns.forEach(pattern => {
    const match = lowerText.match(pattern.regex);
    if (match) {
      // Calculate confidence based on match quality
      const confidence = Math.min(1.0, 0.7 + (match[0].length / customerText.length) * 0.3);
      
      detectedPatterns.push({
        pattern: pattern.pattern,
        confidence: parseFloat(confidence.toFixed(2)),
        matched_text: match[0]
      });
      
      parsedDirectives.push({
        action: pattern.action,
        target: pattern.target,
        change: pattern.change,
        details: match.slice(1) // Capture groups from regex
      });
    }
  });

  // Determine if we still need to send to LLM
  // For this simple parser, we'll always send to LLM for final formatting
  // but we might adjust the prompt based on detected patterns
  const needsLlm = true;

  return {
    detected_patterns: detectedPatterns,
    parsed_directives: parsedDirectives,
    needs_llm: needsLlm
  };
}

module.exports = {
  parseCustomerIntent
};