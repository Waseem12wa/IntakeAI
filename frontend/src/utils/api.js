// API utility functions for making authenticated requests

/**
 * Get authentication headers with token
 */
export const getAuthHeaders = (additionalHeaders = {}) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken');
  const headers = {
    'Content-Type': 'application/json',
    ...additionalHeaders
  };

  if (token) {
    headers['x-auth-token'] = token;
  }

  return headers;
};

/**
 * Make an authenticated API request
 */
export const apiRequest = async (url, options = {}) => {
  const headers = getAuthHeaders(options.headers);

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }

  return response.json();
};

