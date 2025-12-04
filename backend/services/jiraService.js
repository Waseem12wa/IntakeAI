// Service for Jira integration (create issues via REST API)
const axios = require('axios');

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;

// Create a Jira issue from a user story or extracted fields
async function createJiraIssue({ summary, description, issueType = 'Task' }) {
  const url = `${JIRA_BASE_URL}/rest/api/3/issue`;
  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  const data = {
    fields: {
      project: { key: JIRA_PROJECT_KEY },
      summary,
      description,
      issuetype: { name: issueType },
    },
  };
  try {
    const response = await axios.post(url, data, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (err) {
    throw new Error('Jira API error: ' + (err.response?.data?.errorMessages || err.message));
  }
}

module.exports = { createJiraIssue };
