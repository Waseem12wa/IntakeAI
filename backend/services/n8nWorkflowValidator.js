const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

// Load the n8n workflow schema
const schemaPath = path.join(__dirname, '../../schemas/n8n-workflow.schema.json');
const n8nSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

// Initialize AJV validator
const ajv = new Ajv({ 
  allErrors: true,
  verbose: true,
  strict: false
});

// Add the schema to AJV
const validate = ajv.compile(n8nSchema);

/**
 * Validates an n8n workflow JSON object against the schema
 * @param {Object} workflowData - The n8n workflow JSON object
 * @returns {Object} Validation result with success or error details
 */
function validateN8nWorkflow(workflowData) {
  // Check if this looks like a translation key file (pricing database) instead of a workflow
  if (workflowData && workflowData.node_types && !workflowData.nodes) {
    return {
      isValid: false,
      error: 'INVALID_FILE_TYPE',
      message: 'This file appears to be a translation key (pricing database) file, not an n8n workflow file. Please upload an n8n workflow JSON file exported from n8n that contains "nodes" and "connections" properties.',
      details: {
        path: 'root',
        reason: 'File structure matches translation key format, not n8n workflow format'
      }
    };
  }
  
  const valid = validate(workflowData);
  
  if (valid) {
    return {
      isValid: true,
      message: 'Workflow validation successful'
    };
  } else {
    // Get the first error for detailed reporting
    const firstError = validate.errors[0];
    let path = '';
    let reason = '';
    
    if (firstError.instancePath) {
      path = firstError.instancePath.substring(1); // Remove leading '/'
    } else if (firstError.params && firstError.params.missingProperty) {
      path = firstError.params.missingProperty;
    }
    
    // Provide more helpful error messages
    let errorMessage = firstError.message;
    if (firstError.keyword === 'required' && firstError.params && firstError.params.missingProperty === 'nodes') {
      errorMessage = 'This file is missing the required "nodes" property. An n8n workflow file must contain a "nodes" array with workflow nodes. This file does not appear to be a valid n8n workflow export.';
    } else if (firstError.keyword === 'required' && firstError.params && firstError.params.missingProperty === 'connections') {
      errorMessage = 'This file is missing the required "connections" property. An n8n workflow file must contain a "connections" object. This file does not appear to be a valid n8n workflow export.';
    }
    
    switch (firstError.keyword) {
      case 'required':
        reason = `missing required field`;
        break;
      case 'type':
        reason = `invalid type, expected ${firstError.params.type}`;
        break;
      case 'enum':
        reason = `invalid value, must be one of: ${firstError.params.allowedValues ? firstError.params.allowedValues.join(', ') : 'enum values'}`;
        break;
      default:
        reason = firstError.message || 'validation failed';
    }
    
    return {
      isValid: false,
      error: 'INVALID_N8N_SCHEMA',
      message: `Invalid n8n workflow: ${errorMessage}`,
      details: {
        path: path || 'root',
        reason: reason
      }
    };
  }
}

/**
 * Validates file size
 * @param {number} fileSize - Size of the file in bytes
 * @param {number} maxSize - Maximum allowed size in bytes (default 5MB)
 * @returns {Object} Validation result
 */
function validateFileSize(fileSize, maxSize = 5 * 1024 * 1024) { // 5MB default
  if (fileSize > maxSize) {
    return {
      isValid: false,
      error: 'FILE_TOO_LARGE',
      message: `File size ${Math.round(fileSize / (1024 * 1024) * 100) / 100}MB exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`,
      details: {
        fileSize: fileSize,
        maxSize: maxSize
      }
    };
  }
  
  return {
    isValid: true,
    message: 'File size is within limits'
  };
}

/**
 * Validates an uploaded n8n workflow file
 * @param {Object} file - Multer file object
 * @returns {Object} Validation result
 */
async function validateN8nWorkflowFile(file) {
  // Check file size first
  const sizeValidation = validateFileSize(file.size);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }
  
  try {
    // Read and parse the JSON file
    const fileContent = fs.readFileSync(file.path, 'utf8');
    const workflowData = JSON.parse(fileContent);
    
    // Validate against schema
    return validateN8nWorkflow(workflowData);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        isValid: false,
        error: 'INVALID_JSON',
        message: 'File is not valid JSON',
        details: {
          reason: error.message
        }
      };
    } else {
      return {
        isValid: false,
        error: 'FILE_READ_ERROR',
        message: 'Error reading or parsing file',
        details: {
          reason: error.message
        }
      };
    }
  }
}

module.exports = {
  validateN8nWorkflow,
  validateFileSize,
  validateN8nWorkflowFile
};