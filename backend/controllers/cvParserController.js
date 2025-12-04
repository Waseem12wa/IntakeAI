const pdfParse = require('pdf-parse');
const path = require('path');
const fs = require('fs');

// Simple PDF text extraction and naive field parsing
exports.parseEmployeeCV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  try {
    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(dataBuffer);
    const text = data.text;
    console.log('PDF Extracted Text:', text);

    // Naive extraction (customize as needed)
    const nameMatch = text.match(/Name[:\s]+([A-Za-z ]+)/i);
    const emailMatch = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
    const phoneMatch = text.match(/(\+?\d{1,3}[\s-]?)?(\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}/);
    const skillsMatch = text.match(/Skills[:\s]+([A-Za-z, \-]+)/i);
    const summaryMatch = text.match(/(Summary|Profile)[:\s]+([\s\S]{0,300})/i);

    const parsed = {
      name: nameMatch ? nameMatch[1].trim() : '',
      email: emailMatch ? emailMatch[0] : '',
      phone: phoneMatch ? phoneMatch[0] : '',
      skills: skillsMatch ? skillsMatch[1].trim() : '',
      summary: summaryMatch ? summaryMatch[2].trim() : '',
      rawText: text
    };

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to parse CV', details: err.message });
  }
};
