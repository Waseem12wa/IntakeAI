const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticateUser } = require('../middleware/auth');

// Job posting routes - all require authentication
router.post('/', authenticateUser, jobController.createJob);
router.get('/', authenticateUser, jobController.getAllJobs);
router.get('/:id', authenticateUser, jobController.getJobById);

// Application routes - all require authentication
router.post('/:id/apply', authenticateUser, jobController.applyForJob);
router.get('/employer/jobs', authenticateUser, jobController.getEmployerJobs);
router.put('/application/status', authenticateUser, jobController.updateApplicationStatus);
router.get('/employee/applications', authenticateUser, jobController.getEmployeeApplications);

module.exports = router;


