const express = require('express');
const router = express.Router();

const Submission = require('../models/Submission');
const { extractFieldsFromConversation } = require('../services/openaiService');
const { generateMarkdown, generateJSON, generatePDF } = require('../services/docGenerator');

// POST /api/chat/submit - receive and store a new intake conversation, extract fields with Gemini API, generate docs
router.post('/submit', async (req, res) => {
	try {
		   const { conversation } = req.body;
		   // Extract structured fields using Gemini API
		   const extractedFields = await extractFieldsFromConversation(conversation);
		   // Debug log: print extracted fields
		   console.log('Extracted fields:', extractedFields);

		   // Check for default or invalid answers (all fields 'Business' or all null/empty)
		   const allBusiness = Object.values(extractedFields).every(
			   v => v === 'Business' || (Array.isArray(v) && v.every(i => i === 'Business'))
		   );
		   const allNullOrEmpty = Object.values(extractedFields).every(
			   v => v == null || v === '' || (Array.isArray(v) && v.length === 0)
		   );
		   if (allBusiness || allNullOrEmpty) {
			   return res.status(400).json({ success: false, error: 'Invalid or default answers received from AI. Please try again with more specific input.' });
		   }

		   // Generate documents
		   const markdown = generateMarkdown(extractedFields);
		   const jsonDoc = generateJSON(extractedFields);
		   let pdfUrl = null;
		   try {
			   const pdfPath = await generatePDF(extractedFields);
			   pdfUrl = pdfPath;
		   } catch (pdfErr) {
			   pdfUrl = null;
		   }
		   const documents = { markdown, json: jsonDoc, pdfUrl };
		   const submission = new Submission({ conversation, extractedFields, documents });
		   await submission.save();
		   res.status(201).json({ success: true, id: submission._id, extractedFields, documents });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
});

// GET /api/chat/:id - get a single submission by ID
router.get('/:id', async (req, res) => {
	try {
		const submission = await Submission.findById(req.params.id);
		if (!submission) return res.status(404).json({ success: false, error: 'Not found' });
		res.json({ success: true, submission });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
});

module.exports = router;