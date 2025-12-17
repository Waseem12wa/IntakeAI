import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Configure global fetch for production
const API_BASE_URL = import.meta.env.PROD
	? 'https://intakeai.onrender.com'
	: '';

// Override global fetch to prepend base URL in production
if (import.meta.env.PROD) {
	const originalFetch = window.fetch;
	window.fetch = function (url, options) {
		// If URL starts with /api, prepend base URL
		if (typeof url === 'string' && url.startsWith('/api')) {
			url = API_BASE_URL + url;
		}
		return originalFetch(url, options);
	};
	console.log('Production mode: API calls will use', API_BASE_URL);
}


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
