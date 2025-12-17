import axios from 'axios';

// Configure axios base URL based on environment
const API_BASE_URL = import.meta.env.PROD
	? 'https://intakeai.onrender.com'  // Production: your deployed backend
	: '';  // Development: use proxy from vite.config.js

axios.defaults.baseURL = API_BASE_URL;

// Add request interceptor for debugging
axios.interceptors.request.use(
	(config) => {
		console.log('API Request:', config.method?.toUpperCase(), config.url);
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);


// Chat submission
export async function submitConversation(conversation) {
	const res = await axios.post('/api/chat/submit', { conversation });
	return res.data;
}

// Register user
export async function registerUser(data) {
	const res = await axios.post('/api/auth/register', data);
	return res.data;
}

// Login user
export async function loginUser(data) {
	const res = await axios.post('/api/auth/login', data);
	return res.data;
}

// Admin: list submissions
export async function listSubmissions(token) {
	const res = await axios.get('/api/admin/submissions', {
		headers: { 'x-admin-token': token },
	});
	return res.data;
}

// Admin: get single submission
export async function getSubmission(id, token) {
	const res = await axios.get(`/api/admin/submissions/${id}`, {
		headers: { 'x-admin-token': token },
	});
	return res.data;
}

// Admin: download document (markdown/json)
export function downloadDocument(id, type, token) {
	const url = `/api/admin/submissions/${id}/download/${type}?token=${token}`;
	window.open(url, '_blank');
}

// Admin: list jobs
export async function listJobs(token) {
	const res = await axios.get('/api/admin/jobs', {
		headers: { 'x-admin-token': token },
	});
	return res.data;
}

// Admin: get single job
export async function getJob(id, token) {
	const res = await axios.get(`/api/admin/jobs/${id}`, {
		headers: { 'x-admin-token': token },
	});
	return res.data;
}
// ====== ESTIMATES API ======

export const listPendingEstimates = async (token) => {
	const res = await fetch('/api/estimates/pending', {
		headers: { Authorization: `Bearer ${token}` }
	});
	if (!res.ok) throw new Error('Failed to fetch estimates');
	return res.json();
};

export const approveEstimate = async (id, token) => {
	const res = await fetch(`/api/estimates/approve/${id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		}
	});
	if (!res.ok) throw new Error('Failed to approve estimate');
	return res.json();
};
