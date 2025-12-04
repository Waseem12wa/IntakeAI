const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

// Employee Profile Routes
router.post('/employee', profileController.createEmployeeProfile);
router.get('/employee', profileController.getEmployeeProfile);
router.put('/employee', profileController.updateEmployeeProfile);

// Employer Profile Routes
router.post('/employer', profileController.createEmployerProfile);
router.get('/employer', profileController.getEmployerProfile);
router.put('/employer', profileController.updateEmployerProfile);

// Browse Profiles Routes
router.get('/employees', profileController.getAllEmployeeProfiles);
router.get('/employers', profileController.getAllEmployerProfiles);

module.exports = router;
