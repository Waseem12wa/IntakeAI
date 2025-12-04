const express = require('express');
const router = express.Router();
const { IntegrationService } = require('../services/integrationService');

// Initialize integration service
const integrationService = new IntegrationService();

// Store integration configurations (in production, use a database)
const integrationConfigs = new Map();

// GET /api/integrations/platforms - Get available platforms
router.get('/platforms', async (req, res) => {
  try {
    const platforms = integrationService.getAvailablePlatforms();
    res.json({ success: true, platforms });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/integrations/:platform/test - Test connection to platform
router.post('/:platform/test', async (req, res) => {
  try {
    const { platform } = req.params;
    const credentials = req.body;

    // Validate required credentials based on platform
    if (platform === 'jira') {
      if (!credentials.email || !credentials.apiToken) {
        return res.status(400).json({
          success: false,
          error: 'Email and API token are required for Jira integration'
        });
      }
    }

    const result = await integrationService.testConnection(platform, credentials);
    
    if (result.success) {
      // Store credentials for future use (in production, encrypt and store in database)
      integrationConfigs.set(platform, {
        credentials,
        connectedAt: new Date(),
        user: result.user
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/integrations/:platform/projects - Get projects from platform
router.get('/:platform/projects', async (req, res) => {
  try {
    const { platform } = req.params;
    const config = integrationConfigs.get(platform);

    if (!config) {
      return res.status(400).json({
        success: false,
        error: `${platform} integration not configured. Please test connection first.`
      });
    }

    const projects = await integrationService.getProjects(platform, config.credentials);
    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/integrations/:platform/export - Export project data to platform
router.post('/:platform/export', async (req, res) => {
  try {
    const { platform } = req.params;
    const { projectData, options = {} } = req.body;

    if (!projectData) {
      return res.status(400).json({
        success: false,
        error: 'Project data is required for export'
      });
    }

    const config = integrationConfigs.get(platform);
    if (!config) {
      return res.status(400).json({
        success: false,
        error: `${platform} integration not configured. Please test connection first.`
      });
    }

    const result = await integrationService.exportProject(platform, projectData, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/integrations/:platform/status - Get integration status
router.get('/:platform/status', async (req, res) => {
  try {
    const { platform } = req.params;
    const config = integrationConfigs.get(platform);

    if (!config) {
      return res.json({
        success: false,
        connected: false,
        message: `${platform} integration not configured`
      });
    }

    res.json({
      success: true,
      connected: true,
      connectedAt: config.connectedAt,
      user: config.user,
      platform: platform
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/integrations/:platform - Disconnect from platform
router.delete('/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    integrationConfigs.delete(platform);
    
    res.json({
      success: true,
      message: `Disconnected from ${platform}`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/integrations - Get all integration statuses
router.get('/', async (req, res) => {
  try {
    const statuses = {};
    const platforms = integrationService.getAvailablePlatforms();

    platforms.forEach(platform => {
      const config = integrationConfigs.get(platform.name);
      statuses[platform.name] = {
        displayName: platform.displayName,
        features: platform.features,
        connected: !!config,
        connectedAt: config?.connectedAt,
        user: config?.user
      };
    });

    res.json({ success: true, integrations: statuses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
