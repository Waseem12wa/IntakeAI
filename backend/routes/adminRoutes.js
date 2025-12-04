const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const Job = require('../models/Job');


// Basic token authentication middleware
function authMiddleware(req, res, next) {
	const token = req.headers['x-admin-token'] || req.query.token;
	const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'changeme';
	if (token === ADMIN_TOKEN) {
		return next();
	}
	return res.status(401).json({ success: false, error: 'Unauthorized' });
}

// Apply auth middleware to all admin routes
router.use(authMiddleware);

// GET /api/admin/submissions - list all submissions (paginated)
router.get('/submissions', async (req, res) => {
	try {
		const submissions = await Submission.find().sort({ createdAt: -1 }).limit(100);
		res.json({ success: true, submissions });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
});

// GET /api/admin/submissions/:id - get a single submission
router.get('/submissions/:id', async (req, res) => {
	try {
		const submission = await Submission.findById(req.params.id);
		if (!submission) return res.status(404).json({ success: false, error: 'Not found' });
		res.json({ success: true, submission });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
});

// GET /api/admin/submissions/:id/download/:type - download generated document (Markdown/JSON)
router.get('/submissions/:id/download/:type', async (req, res) => {
	try {
		const { id, type } = req.params;
		const submission = await Submission.findById(id);
		if (!submission) return res.status(404).json({ success: false, error: 'Not found' });
		let content, filename, mime;
		if (type === 'markdown') {
			content = submission.documents.markdown;
			filename = `submission_${id}.md`;
			mime = 'text/markdown';
		} else if (type === 'json') {
			content = JSON.stringify(submission.documents.json, null, 2);
			filename = `submission_${id}.json`;
			mime = 'application/json';
		} else {
			return res.status(400).json({ success: false, error: 'Invalid type' });
		}
		res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
		res.setHeader('Content-Type', mime);
		res.send(content);
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
});

// GET /api/admin/jobs - list all jobs/projects
router.get('/jobs', async (req, res) => {
	try {
		const jobs = await Job.find().sort({ postedAt: -1 }).limit(100);
		res.json({ success: true, jobs });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
});

// GET /api/admin/jobs/:id - get a single job
router.get('/jobs/:id', async (req, res) => {
	try {
		const job = await Job.findById(req.params.id);
		if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
		res.json({ success: true, job });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
});
// In your routes file, add this route for admin


module.exports = router;
