# n8n Workflow Schema

This directory contains the JSON Schema for validating n8n workflow exports.

## Files

- `n8n-workflow.schema.json` - The main schema file for validating n8n workflows
- `../examples/valid-n8n-workflow.json` - Example of a valid n8n workflow
- `../examples/invalid-n8n-workflow.json` - Example of an invalid n8n workflow

## Schema Validation Rules

The schema validates the following key components of an n8n workflow:

1. **Nodes Array** (required)
   - Each node must have: `id`, `type`, `name`, `parameters`
   - Validates common node properties like position, credentials, etc.

2. **Connections Object** (required)
   - Validates the structure of node connections
   - Ensures proper connection references between nodes

3. **Workflow Metadata**
   - Validates optional fields like name, settings, meta, etc.

## Usage

The schema can be used with any JSON Schema validator to ensure n8n workflow files conform to the expected structure before processing.