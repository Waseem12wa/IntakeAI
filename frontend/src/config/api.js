// API Configuration
// This file centralizes all API endpoint configuration

// Determine the API base URL based on environment
const getApiBaseUrl = () => {
    // In production (deployed on Render), use the backend URL
    if (import.meta.env.PROD) {
        return 'https://intakeai.onrender.com';
    }

    // In development, use localhost
    return 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to construct full API URLs
export const getApiUrl = (path) => {
    // If path already starts with http, return as is
    if (path.startsWith('http')) {
        return path;
    }

    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    return `${API_BASE_URL}/${cleanPath}`;
};

// Export for debugging
console.log('API Configuration:', {
    mode: import.meta.env.MODE,
    isProd: import.meta.env.PROD,
    apiBaseUrl: API_BASE_URL
});
