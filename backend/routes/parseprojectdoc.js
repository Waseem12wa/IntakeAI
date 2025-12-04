const express = require('express');
const multer = require('multer');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('File received:', file.originalname, file.mimetype);
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Text extraction functions
async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

async function extractTextFromDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer: buffer });
    return result.value;
  } catch (error) {
    console.error('DOCX extraction error:', error);
    throw new Error('Failed to extract text from DOCX');
  }
}

// AI-powered text parsing using Gemini API
async function parseProjectDetailsWithAI(text) {
  const prompt = `Extract project posting information from the following text and return a JSON object with these exact fields:
- projectTitle: string (project title/name)
- description: string (project description/summary)
- techStack: array of strings (required skills/technologies)
- duration: string (project duration/timeline)
- budget: string (budget or cost)
- location: string (project location, city or country)


Text to analyze:
${text.substring(0, 3000)}

Return only valid JSON without any markdown formatting or explanation. If any field cannot be determined from the text, use an empty string for strings or empty array for techStack.`;

  try {
    console.log('Making request to Gemini API...');
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    console.log('GEMINI_API_KEY exists:', !!GEMINI_API_KEY);

    // Check if Gemini API key is available
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is missing. Please add GEMINI_API_KEY or GOOGLE_API_KEY to your environment variables.');
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1000,
          topP: 0.8
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const result = response.data;
    const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    console.log('AI Response:', aiResponse);

    const cleanedResponse = aiResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    const parsedData = JSON.parse(cleanedResponse);

    return parsedData;
  } catch (error) {
    console.error('AI parsing error:', error);
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.data);
    }
    throw error;
  }
}

// Rule-based parsing fallback
function parseProjectDetailsRuleBased(text) {
  console.log('Using rule-based parsing...');

  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const result = {
    projectTitle: '',
    description: '',
    techStack: [],
    duration: '',
    budget: '',
    location: ''
  };

  if (lines.length > 0) {
    result.projectTitle = lines[0].trim().substring(0, 100);
  }

  const lowerText = text.toLowerCase();

  const techSkills = [
    'javascript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'docker',
    'html', 'css', 'mongodb', 'postgresql', 'git', 'kubernetes', 'angular',
    'vue', 'typescript', 'php', 'ruby', 'c++', 'c#', '.net', 'spring'
  ];

  techSkills.forEach(skill => {
    if (lowerText.includes(skill)) {
      result.techStack.push(skill);
    }
  });

  // Detect location by keywords
  const locationMatch = text.match(/location[:\-]?\s*([A-Za-z\s,]+)/i);
  if (locationMatch) {
    result.location = locationMatch[1].trim();
  }

  const paragraphs = text.split('\n\n');
  if (paragraphs.length > 1) {
    result.description = paragraphs[1].substring(0, 300);
  } else if (lines.length > 3) {
    result.description = lines.slice(1, 4).join(' ').substring(0, 300);
  }

  const budgetMatch = text.match(/\$[\d,]+(?:-\$?[\d,]+)?|\d+k?(?:-\d+k?)?\s*(?:budget|cost|price|usd)/i);
  if (budgetMatch) {
    result.budget = budgetMatch[0];
  }

  return result;
}

// Test route
router.get('/', (req, res) => {
  res.json({
    message: 'Parse project doc endpoint is working. Use POST to upload a document.',
    status: 'ready'
  });
});

// Main API endpoint
router.post('/', upload.single('document'), async (req, res) => {
  console.log('=== File Upload Request Started ===');

  try {
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log('File details:', {
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size
    });

    let extractedText = '';

    switch (req.file.mimetype) {
      case 'application/pdf':
        console.log('Extracting from PDF...');
        extractedText = await extractTextFromPDF(req.file.buffer);
        break;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        console.log('Extracting from Word...');
        extractedText = await extractTextFromDOCX(req.file.buffer);
        break;
      case 'text/plain':
        console.log('Extracting from TXT...');
        extractedText = req.file.buffer.toString('utf-8');
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Unsupported file type'
        });
    }

    console.log('Extracted text length:', extractedText.length);
    console.log('First 200 chars:', extractedText.substring(0, 200));

    if (!extractedText || extractedText.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Document appears to be empty or invalid'
      });
    }

    let parsedData;

    try {
      parsedData = await parseProjectDetailsWithAI(extractedText);
      console.log('AI parsing successful');
    } catch (aiError) {
      console.log('AI parsing failed, using rule-based parsing:', aiError.message);
      parsedData = parseProjectDetailsRuleBased(extractedText);
    }

    console.log('Parsed data:', parsedData);

    if (!parsedData.projectTitle && !parsedData.description) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document - could not extract project information'
      });
    }

    const responseData = {
      projectTitle: parsedData.projectTitle,
      description: parsedData.description,
      techStack: parsedData.techStack.map(skill => ({ name: skill })),
      duration: parsedData.duration,
      budget: parsedData.budget,
      location: parsedData.location || ''
    };

    console.log('Response data:', responseData);
    console.log('=== File Upload Request Completed Successfully ===');

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Document parsing error:', error);
    console.log('=== File Upload Request Failed ===');

    res.status(400).json({
      success: false,
      message: 'Invalid document or failed to parse content: ' + error.message
    });
  }
});

module.exports = router;