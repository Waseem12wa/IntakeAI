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
      message: `Invalid n8n workflow: ${firstError.message}`,
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