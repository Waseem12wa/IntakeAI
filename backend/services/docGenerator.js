// Service for document generation (Markdown, PDF, JSON)
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { v4: uuidv4 } = require('uuid');
const puppeteer = require('puppeteer');

// Generate Markdown from extracted fields
function generateMarkdown(fields) {
	return `# Project Intake Summary\n\n` +
		`**Project Type:** ${fields.project_type || ''}\n\n` +
		`**Objective:** ${fields.objective || ''}\n\n` +
		`**Current Process:** ${fields.current_process || ''}\n\n` +
		`**Target Users:** ${fields.target_users || ''}\n\n` +
		`**Integrations:** ${fields.integrations || ''}\n\n` +
		`**Budget:** ${fields.budget || ''}\n\n` +
		`**Deadline:** ${fields.deadline || ''}\n\n` +
		`**Constraints:** ${fields.constraints || ''}\n\n` +
		`**Additional Notes:** ${fields.additional_notes || ''}\n`;
}

// Generate JSON (just return the fields as JSON)
function generateJSON(fields) {
	return fields;
}

// Generate PDF from Markdown (using Puppeteer)
async function generatePDF(fields) {
	const markdown = generateMarkdown(fields);
	const html = `<html><body>${marked.parse(markdown)}</body></html>`;
	const pdfPath = path.join(__dirname, '../tmp', `intake_${uuidv4()}.pdf`);
	// Ensure tmp directory exists
	fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.setContent(html);
	await page.pdf({ path: pdfPath, format: 'A4' });
	await browser.close();
	return pdfPath;
}

module.exports = { generateMarkdown, generateJSON, generatePDF };
