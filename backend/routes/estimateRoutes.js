const express = require('express');
const router = express.Router();
const {
  getPendingEstimates,
  getApprovedEstimates,
  getPendingEstimateById,
  approveEstimate,
  editEstimate,
  createPendingEstimate,
  checkEstimateStatus,
  getApprovedEstimate
} = require('../controllers/estimateController');

// Basic token authentication middleware for admin routes
function authMiddleware(req, res, next) {
	const token = req.headers['x-admin-token'] || req.query.token;
	const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'changeme';
	if (token === ADMIN_TOKEN) {
		return next();
	}
	return res.status(401).json({ success: false, error: 'Unauthorized' });
}

// Admin routes (with authentication)
router.get('/admin/pending', authMiddleware, getPendingEstimates); // Get all pending estimates for admin
router.get('/admin/approved', authMiddleware, getApprovedEstimates); // Get all approved estimates for admin
router.get('/admin/:id', authMiddleware, getPendingEstimateById); // Get single estimate details
router.post('/admin/:id/approve', authMiddleware, approveEstimate); // Admin approves estimate
router.post('/admin/:id/edit', authMiddleware, editEstimate); // Admin edits estimate

// User/AI bot routes - require authentication
const { authenticateUser } = require('../middleware/auth');
router.post('/create', authenticateUser, createPendingEstimate); // Create new pending estimate
router.get('/status/:jobId', authenticateUser, checkEstimateStatus); // Check if estimate is approved
router.get('/approved/:jobId', authenticateUser, getApprovedEstimate); // Get approved estimate for a job
router.get('/debug/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const estimates = await require('../models/PendingEstimate').find({ jobId });
    res.json({
      success: true,
      jobId: jobId,
      estimatesCount: estimates.length,
      estimates: estimates.map(est => ({
        id: est._id,
        status: est.status,
        originalEstimate: est.originalEstimate,
        editedEstimate: est.editedEstimate,
        adminNotes: est.adminNotes,
        createdAt: est.createdAt,
        reviewedAt: est.reviewedAt
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}); // Debug endpoint to see all estimates for a job

module.exports = router;