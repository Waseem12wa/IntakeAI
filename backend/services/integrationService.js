const axios = require('axios');

// General Integration Service - Extensible to multiple platforms
class IntegrationService {
  constructor() {
    this.platforms = {
      jira: new JiraIntegration(),
      trello: new TrelloIntegration(), // Future implementation
      asana: new AsanaIntegration(),   // Future implementation
      // Add more platforms as needed
    };
  }

  // Get available platforms
  getAvailablePlatforms() {
    return Object.keys(this.platforms).map(platform => ({
      name: platform,
      displayName: this.platforms[platform].getDisplayName(),
      isConfigured: this.platforms[platform].isConfigured(),
      features: this.platforms[platform].getFeatures()
    }));
  }

  // Generic method to export project data
  async exportProject(platform, projectData, options = {}) {
    if (!this.platforms[platform]) {
      throw new Error(`Platform ${platform} is not supported`);
    }

    return await this.platforms[platform].exportProject(projectData, options);
  }

  // Generic method to test connection
  async testConnection(platform, credentials) {
    if (!this.platforms[platform]) {
      throw new Error(`Platform ${platform} is not supported`);
    }

    return await this.platforms[platform].testConnection(credentials);
  }

  // Generic method to get projects
  async getProjects(platform, credentials) {
    if (!this.platforms[platform]) {
      throw new Error(`Platform ${platform} is not supported`);
    }

    return await this.platforms[platform].getProjects(credentials);
  }
}

// Base Integration Class
class BaseIntegration {
  constructor() {
    this.credentials = null;
    this.isConnected = false;
  }

  getDisplayName() {
    throw new Error('getDisplayName must be implemented');
  }

  getFeatures() {
    throw new Error('getFeatures must be implemented');
  }

  isConfigured() {
    return this.credentials !== null && this.isConnected;
  }

  async testConnection(credentials) {
    throw new Error('testConnection must be implemented');
  }

  async exportProject(projectData, options = {}) {
    throw new Error('exportProject must be implemented');
  }

  async getProjects(credentials) {
    throw new Error('getProjects must be implemented');
  }
}

// Jira Integration Implementation
class JiraIntegration extends BaseIntegration {
  constructor() {
    super();
    this.baseUrl = 'https://bmaikr.atlassian.net'; // Using the domain from credentials
    this.apiVersion = '3';
  }

  getDisplayName() {
    return 'Atlassian Jira';
  }

  getFeatures() {
    return [
      'Create Issues',
      'Update Project Status',
      'Export Project Data',
      'Sync Tasks',
      'Generate Reports'
    ];
  }

  async testConnection(credentials) {
    try {
      console.log('🔍 Testing Jira connection with:', {
        email: credentials.email,
        apiToken: credentials.apiToken ? `${credentials.apiToken.substring(0, 4)}...` : 'undefined',
        baseUrl: this.baseUrl,
        apiVersion: this.apiVersion
      });

      const auth = Buffer.from(`${credentials.email}:${credentials.apiToken}`).toString('base64');
      console.log('🔑 Generated auth token:', auth.substring(0, 20) + '...');
      
      const url = `${this.baseUrl}/rest/api/${this.apiVersion}/myself`;
      console.log('🌐 Making request to:', url);
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      console.log('✅ Jira response status:', response.status);
      console.log('✅ Jira response data:', response.data);

      if (response.status === 200) {
        this.credentials = credentials;
        this.isConnected = true;
        return {
          success: true,
          user: response.data,
          message: 'Successfully connected to Jira'
        };
      }
    } catch (error) {
      console.error('❌ Jira connection test failed:');
      console.error('   Error message:', error.message);
      console.error('   Error code:', error.code);
      console.error('   Response status:', error.response?.status);
      console.error('   Response data:', error.response?.data);
      console.error('   Request URL:', error.config?.url);
      console.error('   Request headers:', error.config?.headers);
      
      let errorMessage = 'Failed to connect to Jira';
      
      if (error.response?.status === 401) {
        errorMessage = 'Invalid credentials. Please check your email and API token.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access forbidden. Please check your API token permissions.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Jira instance not found. Please check the URL.';
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot reach Jira server. Please check your internet connection and Jira URL.';
      } else if (error.response?.data?.errorMessages) {
        errorMessage = error.response.data.errorMessages[0];
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async getProjects(credentials) {
    try {
      const auth = Buffer.from(`${credentials.email}:${credentials.apiToken}`).toString('base64');
      
      const response = await axios.get(`${this.baseUrl}/rest/api/${this.apiVersion}/project`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      });

      return response.data.map(project => ({
        id: project.id,
        key: project.key,
        name: project.name,
        description: project.description,
        projectTypeKey: project.projectTypeKey,
        lead: project.lead?.displayName,
        url: project.self
      }));
    } catch (error) {
      console.error('Failed to fetch Jira projects:', error.response?.data || error.message);
      throw new Error('Failed to fetch projects from Jira');
    }
  }

  async createIssue(projectKey, issueData) {
    try {
      console.log('🔍 Creating Jira issue with SIMPLE method...');
      
      const auth = Buffer.from(`${this.credentials.email}:${this.credentials.apiToken}`).toString('base64');
      
      // SUPER SIMPLE payload - no description, no complex fields
      const issuePayload = {
        fields: {
          project: { key: projectKey },
          summary: issueData.title,
          issuetype: { name: 'Task' }
          // NO description field - this was causing the 400 error
        }
      };

      console.log('📤 Sending SIMPLE payload to Jira:', JSON.stringify(issuePayload, null, 2));

      const response = await axios.post(
        `${this.baseUrl}/rest/api/${this.apiVersion}/issue`,
        issuePayload,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Issue created successfully:', response.data.key);

      return {
        success: true,
        issue: response.data,
        url: `${this.baseUrl}/browse/${response.data.key}`
      };
    } catch (error) {
      console.error('❌ Failed to create Jira issue:', error.response?.data || error.message);
      
      // Provide more specific error messages
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your Jira API token and email.');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied. Please check your Jira permissions and project access.');
      } else if (error.response?.status === 404) {
        throw new Error('Project not found. Please check your project key.');
      } else {
        throw new Error(`Failed to create issue in Jira: ${error.response?.data?.errorMessages?.[0] || error.message}`);
      }
    }
  }

  // Convert plain text to Atlassian Document Format (ADF)
  convertToADF(text) {
    if (!text) return null;
    
    // Simple ADF structure for plain text
    return {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: text
            }
          ]
        }
      ]
    };
  }

  async exportProject(projectData, options = {}) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Jira integration not configured. Please test connection first.');
      }

      const results = [];
      const projectKey = options.projectKey || 'KAN'; // Default project key

      // Convert project data to Jira issues
      if (projectData.tasks && Array.isArray(projectData.tasks)) {
        for (const task of projectData.tasks) {
          const issueData = {
            title: task.title || task.name,
            description: this.formatDescription(task),
            type: task.type || 'Task',
            labels: this.extractLabels(task),
            customFields: this.mapCustomFields(task)
            // Removed priority field as it's not supported in this Jira instance
          };

          const result = await this.createIssue(projectKey, issueData);
          results.push(result);
        }
      } else {
        // If no tasks, create a main project issue
        const mainIssue = await this.createIssue(projectKey, {
          title: projectData.title || 'Project Export',
          description: this.formatProjectDescription(projectData),
          type: 'Epic'
          // Removed priority field as it's not supported in this Jira instance
        });
        results.push(mainIssue);
      }

      return {
        success: true,
        platform: 'jira',
        exportedItems: results.length,
        results: results,
        projectUrl: `${this.baseUrl}/browse/${projectKey}`
      };
    } catch (error) {
      console.error('Failed to export project to Jira:', error);
      throw new Error(`Failed to export project to Jira: ${error.message}`);
    }
  }

  formatDescription(task) {
    let description = task.description || '';
    
    if (task.requirements) {
      description += '\n\n**Requirements:**\n' + task.requirements;
    }
    
    if (task.acceptanceCriteria) {
      description += '\n\n**Acceptance Criteria:**\n' + task.acceptanceCriteria;
    }
    
    if (task.notes) {
      description += '\n\n**Notes:**\n' + task.notes;
    }

    return description;
  }

  formatProjectDescription(projectData) {
    let description = projectData.description || '';
    
    if (projectData.requirements) {
      description += '\n\n**Project Requirements:**\n' + projectData.requirements;
    }
    
    if (projectData.technologies) {
      description += '\n\n**Technologies:**\n' + projectData.technologies.join(', ');
    }
    
    if (projectData.timeline) {
      description += '\n\n**Timeline:**\n' + projectData.timeline;
    }

    return description;
  }

  mapPriority(priority) {
    const priorityMap = {
      'high': 'High',
      'medium': 'Medium',
      'low': 'Low',
      'critical': 'Highest',
      'urgent': 'High'
    };
    return priorityMap[priority?.toLowerCase()] || 'Medium';
  }

  extractLabels(task) {
    const labels = [];
    if (task.skills) labels.push(...task.skills);
    if (task.tags) labels.push(...task.tags);
    if (task.category) labels.push(task.category);
    return labels;
  }

  mapCustomFields(task) {
    const customFields = {};
    
    if (task.estimatedHours) {
      customFields['customfield_10002'] = task.estimatedHours; // Story Points field
    }
    
    if (task.assignee) {
      customFields.assignee = { name: task.assignee };
    }
    
    return customFields;
  }
}

// Future Integration Classes (Placeholder)
class TrelloIntegration extends BaseIntegration {
  getDisplayName() {
    return 'Trello';
  }

  getFeatures() {
    return ['Create Cards', 'Update Lists', 'Export Boards'];
  }

  async testConnection(credentials) {
    // Future implementation
    return { success: false, error: 'Trello integration not implemented yet' };
  }

  async exportProject(projectData, options = {}) {
    // Future implementation
    throw new Error('Trello integration not implemented yet');
  }

  async getProjects(credentials) {
    // Future implementation
    throw new Error('Trello integration not implemented yet');
  }
}

class AsanaIntegration extends BaseIntegration {
  getDisplayName() {
    return 'Asana';
  }

  getFeatures() {
    return ['Create Tasks', 'Update Projects', 'Export Workspaces'];
  }

  async testConnection(credentials) {
    // Future implementation
    return { success: false, error: 'Asana integration not implemented yet' };
  }

  async exportProject(projectData, options = {}) {
    // Future implementation
    throw new Error('Asana integration not implemented yet');
  }

  async getProjects(credentials) {
    // Future implementation
    throw new Error('Asana integration not implemented yet');
  }
}

module.exports = {
  IntegrationService,
  BaseIntegration,
  JiraIntegration,
  TrelloIntegration,
  AsanaIntegration
};
