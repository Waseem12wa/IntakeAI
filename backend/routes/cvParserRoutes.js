const express = require('express');
const multer = require('multer');
const path = require('path');
const os = require('os');
const cvParserController = require('../controllers/cvParserController');

const router = express.Router();

// Multer setup for temp file storage
const upload = multer({ dest: os.tmpdir() });

// POST /api/profiles/employee/upload-cv
router.post('/employee/upload-cv', upload.single('cv'), cvParserController.parseEmployeeCV);

module.exports = router;
