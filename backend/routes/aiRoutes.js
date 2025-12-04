const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { getAIResponse, getInitialAnalysis, getFinalEstimate, getEstimate, extractQuestions } = require('../services/openaiService');
const PendingEstimate = require('../models/PendingEstimate');
const { authenticateUser, optionalAuth } = require('../middleware/auth');

// Multer setup for file uploads
const upload = multer({ dest: path.join(__dirname, '../tmp') });

// Store session state in-memory (per user/session ideally)
let sessionState = {};

// -------------------- NEW: MULTIPLE FILE UPLOAD WITH ANALYSIS --------------------
router.post('/upload-analyze', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded.' });
    }

    let combinedText = '';
    const processedFiles = [];
    
    // Process each file
    for (const file of files) {
      let fileText = '';
      
      try {
        if (file.mimetype === 'application/pdf') {
          const dataBuffer = fs.readFileSync(file.path);
          const pdfData = await pdfParse(dataBuffer);
          fileText = pdfData.text;
        } else if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
          fileText = fs.readFileSync(file.path, 'utf8');
        } else if (file.mimetype.startsWith('text/')) {
          fileText = fs.readFileSync(file.path, 'utf8');
        } else {
          // For unsupported types, just note the filename
          fileText = `[File: ${file.originalname}]`;
        }
        
        combinedText += `\n\n--- Content from ${file.originalname} ---\n${fileText}`;
        processedFiles.push({
          name: file.originalname,
          size: file.size,
          type: file.mimetype,
          processed: true
        });
        
        // Clean up temporary file
        fs.unlinkSync(file.path);
        
      } catch (fileError) {
        console.error(`Error processing file ${file.originalname}:`, fileError);
        // Still clean up the file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        processedFiles.push({
          name: file.originalname,
          size: file.size,
          type: file.mimetype,
          processed: false,
          error: fileError.message
        });
      }
    }

    if (!combinedText.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'No readable content found in uploaded files.' 
      });
    }

    // Create analysis prompt for multiple files
    const analysisPrompt = `
Analyze the following uploaded files for project requirements and provide an estimate:

Files processed: ${processedFiles.filter(f => f.processed).map(f => f.name).join(', ')}

File content:
${combinedText}

Please:
1. Summarize what type of project this appears to be
2. Identify key requirements and scope
3. Suggest important clarifying questions
4. Provide a preliminary estimate
`;

    // Use initial analysis to get summary + questions
    const result = await getInitialAnalysis(analysisPrompt);
    const estimate = getEstimate(analysisPrompt);

    // Extract estimate from AI response if available
    let finalEstimate = estimate;
    const estimateMatch = result.message && typeof result.message === 'string' ? result.message.match(/(?:Estimated?|Estimate):?\s*([^\n]+)/i) : null;
    if (estimateMatch) {
      finalEstimate = estimateMatch[1].trim();
    }

    // Extract potential project title from files or content
    let projectTitle = 'File Upload Project';
    const titleMatch = combinedText.match(/(?:project|title|name):\s*([^\n]+)/i);
    if (titleMatch) {
      projectTitle = titleMatch[1].trim().substring(0, 100);
    } else if (processedFiles.length === 1) {
      projectTitle = `Analysis of ${processedFiles[0].name}`;
    } else {
      projectTitle = `Analysis of ${processedFiles.length} Files`;
    }

    // Extract potential skills/technologies
    const techKeywords = ['react', 'node', 'python', 'java', 'javascript', 'php', 'mongodb', 'mysql', 'aws', 'docker'];
    const extractedSkills = [];
    const lowerText = combinedText.toLowerCase();
    techKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        extractedSkills.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    });

    // Save context for follow-ups
    sessionState = { 
      context: analysisPrompt, 
      lastMessage: result.message, 
      estimate: finalEstimate,
      questions: result.questions || [],
      currentQuestionIndex: 0,
      answers: [],
      initialAnalysis: result.message,
      finalAnalysis: '',
      job: null,
      uploadedFiles: processedFiles
    };

    res.json({ 
      success: true, 
      message: result.message, 
      estimate: finalEstimate,
      questions: result.questions || [],
      projectTitle: projectTitle,
      description: `Project analysis based on ${processedFiles.length} uploaded file(s)`,
      extractedSkills: extractedSkills,
      processedFiles: processedFiles
    });
    
  } catch (err) {
    console.error('Error in upload-analyze:', err);
    // Clean up any remaining temp files
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------- FILE UPLOAD --------------------
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, error: 'No file uploaded.' });

    let text = '';
    if (file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(file.path);
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text;
    } else if (file.mimetype === 'text/plain') {
      text = fs.readFileSync(file.path, 'utf8');
    } else {
      return res.status(400).json({ success: false, error: 'Unsupported file type.' });
    }

    fs.unlinkSync(file.path); // clean temp

    // Use initial analysis to get summary + first question only
    const result = await getInitialAnalysis(text);
    const estimate = getEstimate(text);

    // Extract estimate from AI response if available
    let finalEstimate = estimate;
    const estimateMatch = result.message && typeof result.message === 'string' ? result.message.match(/(?:Estimated?|Estimate):?\s*([^\n]+)/i) : null;
    if (estimateMatch) {
      finalEstimate = estimateMatch[1].trim();
    }

    sessionState = { 
      context: text, 
      lastMessage: result.message, 
      estimate: finalEstimate,
      questions: result.questions || [],
      currentQuestionIndex: 0,
      answers: [],
      initialAnalysis: result.message,
      finalAnalysis: '',
      job: null
    };

    res.json({ 
      success: true, 
      message: result.message, 
      estimate: finalEstimate,
      questions: result.questions || []
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------- JOB ANALYSIS --------------------
router.post('/analyzeJob', async (req, res) => {
  try {
    const { job, initial } = req.body;
    console.log('Received analyzeJob request - initial parameter:', initial, 'type:', typeof initial);
    
    if (!job || !job.title) {
      return res.status(400).json({ success: false, error: 'Job details required.' });
    }

    // Build context string from job
    const jobText = `
      Job Title: ${job.title}
      Company: ${job.company || 'N/A'}
      Description: ${job.description}
      Skills: ${(job.skills || []).join(', ')}
      Location: ${job.location || 'N/A'}
      Type: ${job.type || 'N/A'}
      Salary: ${job.salary || 'N/A'}
    `;

    let aiMessage, questions = [];

    // 🔹 DEFAULT TO INITIAL=TRUE if not explicitly set to false
    // This prevents the reload issue where initial might be undefined
    const useInitial = initial !== false; // true by default, false only if explicitly set to false
    console.log('Using initial analysis?', useInitial);

    if (useInitial) {
      // Get initial analysis with summary, estimate, and first question only
      console.log('Getting initial analysis (showing first question only)');
      const result = await getInitialAnalysis(jobText);
      aiMessage = result.message;
      questions = result.questions || [];
    } else {
      // Get full analysis (original behavior)
      console.log('Getting full analysis (showing all questions)');
      aiMessage = await getAIResponse(jobText);
      questions = extractQuestions(aiMessage);
    }

    const numericEstimate = getEstimate(jobText);

    // Extract estimate from AI response
    let finalEstimate = numericEstimate || "Not available";
    const estimateMatch = aiMessage && typeof aiMessage === 'string' ? aiMessage.match(/(?:Estimated?|Estimate):?\s*([^\n]+)/i) : null;
    if (estimateMatch) {
      finalEstimate = estimateMatch[1].trim();
    }

    // Save context for follow-ups
    sessionState = { 
      context: jobText, 
      lastMessage: aiMessage, 
      estimate: finalEstimate,
      questions: questions,
      currentQuestionIndex: 0,
      answers: [],
      initialAnalysis: aiMessage,
      finalAnalysis: '',
      job: job
    };

    console.log('Backend sending to frontend:', { 
      success: true, 
      message: aiMessage.substring(0, 100) + '...', // truncated for logging
      estimate: finalEstimate,
      questionsCount: questions.length,
      initial: useInitial
    });

    res.json({ 
      success: true, 
      message: aiMessage, 
      estimate: finalEstimate,
      questions: questions
    });
  } catch (err) {
    console.error('Error in analyzeJob:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------- NEW: FINALIZE ESTIMATE --------------------
router.post('/finalizeEstimate', authenticateUser, async (req, res) => {
  try {
    console.log('🚀 finalizeEstimate called with:', { 
      jobId: req.body.job?._id || req.body.job?.id,
      answersCount: req.body.answers?.length,
      originalEstimate: req.body.originalEstimate 
    });

    const { job, answers, originalEstimate } = req.body;
    
    if (!job || !answers || !Array.isArray(answers)) {
      console.log('❌ Invalid request data:', { job: !!job, answers: !!answers, isArray: Array.isArray(answers) });
      return res.status(400).json({ success: false, error: 'Invalid request data' });
    }

    const finalResponse = await getFinalEstimate(job, answers, originalEstimate);
    console.log('🏁 Final estimate response received:', typeof finalResponse === 'object' ? 'Object response' : finalResponse.substring(0, 100) + '...');
    
    // Handle error response first
    if (typeof finalResponse === 'object' && finalResponse.status === 'error') {
      return res.status(500).json({
        success: false,
        error: finalResponse.analysis || 'Error generating estimate',
        message: 'Sorry, I encountered an error. Please try again.'
      });
    }
    
    // Handle pending_admin_approval - create PendingEstimate with userId
    if (typeof finalResponse === 'object' && finalResponse.status === 'pending_admin_approval') {
      // Get userId from authenticated request
      if (!req.user || !req.user.id) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      // Get jobId from job object
      const jobId = job._id || job.id;
      if (!jobId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Job ID is missing' 
        });
      }

      // Ensure jobId is a valid ObjectId
      let validJobId;
      try {
        if (mongoose.Types.ObjectId.isValid(jobId)) {
          validJobId = jobId;
        } else {
          validJobId = new mongoose.Types.ObjectId(jobId);
        }
      } catch (idError) {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid job ID format: ${jobId}` 
        });
      }

      // Check if there's already a pending estimate for this job and user
      const existingEstimate = await PendingEstimate.findOne({ 
        jobId: validJobId,
        userId: req.user.id 
      });
      
      let savedEstimate;
      if (existingEstimate && (existingEstimate.status === 'pending' || existingEstimate.status === 'edited')) {
        // Update existing estimate
        existingEstimate.originalEstimate = finalResponse.estimate;
        existingEstimate.aiAnalysis = {
          initialAnalysis: sessionState.initialAnalysis || '',
          finalAnalysis: finalResponse.analysis,
          questionsAndAnswers: answers
        };
        existingEstimate.status = 'pending';
        savedEstimate = await existingEstimate.save();
        console.log('✅ Updated existing PendingEstimate:', savedEstimate._id);
      } else {
        // Create new PendingEstimate with userId
        const pendingEstimate = new PendingEstimate({
          userId: req.user.id,
          jobId: validJobId,
          originalEstimate: finalResponse.estimate,
          aiAnalysis: {
            initialAnalysis: sessionState.initialAnalysis || '',
            finalAnalysis: finalResponse.analysis,
            questionsAndAnswers: answers
          },
          status: 'pending'
        });
        savedEstimate = await pendingEstimate.save();
        console.log('✅ Created new PendingEstimate with userId:', savedEstimate._id);
      }

      return res.json({
        success: true,
        message: finalResponse.analysis || 'Analysis completed successfully.',
        estimate: 'Estimate submitted for admin approval. You will be notified once approved.',
        pendingEstimateId: savedEstimate._id,
        status: 'pending_admin_approval',
        adminApprovalRequired: true
      });
    }
    
    // Fallback for old string response format (only if not already handled above)
    const finalEstimate = typeof finalResponse === 'string' ? finalResponse : (finalResponse.estimate || 'Contact for pricing');
    
    // Try multiple regex patterns to extract estimate (for backward compatibility - only for string responses)
    if (typeof finalResponse === 'string') {
      const estimatePatterns = [
        /(?:Final\s+Estimated?|Final\s+Estimate):?\s*([^\n]+)/i,
        /(?:Estimated?\s+Cost|Estimate\s+Cost):?\s*([^\n]+)/i,
        /(?:Total\s+Cost|Total\s+Estimate):?\s*([^\n]+)/i,
        /(?:Price|Cost):?\s*\$?([0-9,]+(?:\.[0-9]{2})?)/i,
        /\$([0-9,]+(?:\.[0-9]{2})?)/i
      ];
      
      for (const pattern of estimatePatterns) {
        const match = finalResponse.match(pattern);
        if (match) {
          finalEstimate = match[1].trim();
          console.log('✅ Estimate extracted using pattern:', pattern, '→', finalEstimate);
          break;
        }
      }
    }
    
    // If original estimate was provided and no new estimate found, use original
    if (originalEstimate && (!finalEstimate || finalEstimate === 'Contact for pricing')) {
      finalEstimate = originalEstimate;
      console.log('📋 Using original estimate:', finalEstimate);
    }
    
    // Final safety check
    if (!finalEstimate || finalEstimate === 'undefined') {
      finalEstimate = 'Contact for detailed pricing';
      console.log('⚠️ No estimate found, using default:', finalEstimate);
    }

    console.log('📊 Final estimate to save:', finalEstimate);

    // Update session state
    sessionState.lastMessage = finalResponse;
    sessionState.estimate = finalEstimate;
    sessionState.answers = answers;
    sessionState.finalAnalysis = finalResponse;

    // Get jobId from job object
    const jobId = job._id || job.id;
    console.log('💾 Attempting to save to database...');
    console.log('📝 Job ID for database:', jobId);
    
    if (!jobId) {
      throw new Error('Job ID is missing');
    }

    // Ensure jobId is a valid ObjectId or custom ID for file uploads
    let validJobId;
    try {
      console.log('🔍 Checking job ID format:', jobId);
      // Check if this is a file upload ID (custom format)
      if (typeof jobId === 'string' && jobId.startsWith('file-upload-')) {
        // For file uploads, use the custom ID directly
        console.log('📁 Using custom file upload ID');
        validJobId = jobId;
      } else {
        // For regular jobs, validate as ObjectId
        console.log('🆔 Validating as ObjectId');
        if (mongoose.Types.ObjectId.isValid(jobId)) {
          validJobId = jobId;
        } else {
          try {
            validJobId = new mongoose.Types.ObjectId(jobId);
          } catch (objectIdError) {
            console.error('💥 ObjectId validation failed:', objectIdError);
            throw new Error(`Invalid job ID format: ${jobId}`);
          }
        }
      }
      console.log('✅ Valid job ID:', validJobId);
    } catch (idError) {
      console.error('💥 Job ID validation error:', idError);
      throw new Error(`Invalid job ID format: ${jobId}`);
    }

    // Get userId from authenticated request (needed for checking existing estimates)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    // Check if there's already a pending estimate for this job and user
    const existingEstimate = await PendingEstimate.findOne({ 
      jobId: validJobId,
      userId: req.user.id 
    });
    if (existingEstimate) {
      console.log('⚠️ Existing estimate found:', {
        id: existingEstimate._id,
        status: existingEstimate.status,
        createdAt: existingEstimate.createdAt
      });
      
      // If there's already a pending or edited estimate, update it
      if (existingEstimate.status === 'pending' || existingEstimate.status === 'edited') {
        console.log('📝 Updating existing estimate instead of creating new one');
        
        // Use data from finalResponse if available, otherwise from sessionState
        const analysisData = typeof finalResponse === 'object' && finalResponse.analysis 
          ? finalResponse.analysis 
          : (sessionState.finalAnalysis || finalResponse);
        
        existingEstimate.originalEstimate = typeof finalResponse === 'object' && finalResponse.estimate 
          ? finalResponse.estimate 
          : finalEstimate;
        existingEstimate.aiAnalysis = {
          initialAnalysis: sessionState.initialAnalysis || '',
          finalAnalysis: analysisData,
          questionsAndAnswers: answers || sessionState.answers || []
        };
        existingEstimate.status = 'pending'; // Reset status to pending for admin approval
        
        const updatedEstimate = await existingEstimate.save();
        console.log('✅ Estimate updated successfully:', {
          id: updatedEstimate._id,
          status: updatedEstimate.status
        });
        
        return res.json({ 
          success: true, 
          message: typeof finalResponse === 'object' ? finalResponse.analysis : finalResponse, 
          finalEstimate: typeof finalResponse === 'object' && finalResponse.estimate ? finalResponse.estimate : finalEstimate,
          estimateId: updatedEstimate._id,
          adminApprovalRequired: true,
          status: 'pending_admin_approval'
        });
      }
    }

    // Save conversation to PendingEstimate for admin approval
    // Use data from finalResponse if available, otherwise from sessionState
    const analysisData = typeof finalResponse === 'object' && finalResponse.analysis 
      ? finalResponse.analysis 
      : (sessionState.finalAnalysis || finalResponse);
    
    const pendingEstimate = new PendingEstimate({
      userId: req.user.id,
      jobId: validJobId,
      originalEstimate: typeof finalResponse === 'object' && finalResponse.estimate 
        ? finalResponse.estimate 
        : finalEstimate,
      aiAnalysis: {
        initialAnalysis: sessionState.initialAnalysis || '',
        finalAnalysis: analysisData,
        questionsAndAnswers: answers || sessionState.answers || []
      },
      status: 'pending' // Explicitly set to pending
    });

    console.log('📋 PendingEstimate object created, attempting save...');
    const savedEstimate = await pendingEstimate.save();
    console.log('✅ AI chat conversation saved to PendingEstimate:', {
      id: savedEstimate._id,
      status: savedEstimate.status,
      jobId: savedEstimate.jobId
    });
      
    console.log('📤 Sending response to frontend...');

    res.json({ 
      success: true, 
      message: typeof finalResponse === 'object' ? (finalResponse.analysis || 'Analysis completed successfully.') : finalResponse, 
      finalEstimate: typeof finalResponse === 'object' && finalResponse.estimate ? finalResponse.estimate : finalEstimate,
      adminApprovalRequired: true,
      status: 'pending_admin_approval'
    });

  } catch (error) {
    console.error('💥 Error in finalizeEstimate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// -------------------- CHAT --------------------
router.post('/chat', async (req, res) => {
  try {
    const { message, job } = req.body;

    // if job is passed, rebuild context
    if (job) {
      const jobText = `
        Job Title: ${job.title}
        Description: ${job.description}
        Skills: ${(job.skills || []).join(', ')}
      `;
      sessionState.context = jobText;
    }

    if (!sessionState.context) {
      return res.status(400).json({ success: false, error: 'No context available. Upload a doc or analyze a job first.' });
    }

    // Build context with conversation history
    let contextWithHistory = sessionState.context;
    if (sessionState.answers && sessionState.answers.length > 0) {
      contextWithHistory += '\n\nPrevious Q&A:\n';
      sessionState.answers.forEach((item, index) => {
        contextWithHistory += `Q${index + 1}: ${item.question}\nA${index + 1}: ${item.answer}\n`;
      });
    }
    contextWithHistory += '\nUser: ' + message;

    const aiMessage = await getAIResponse(contextWithHistory);
    
    // Extract estimate if present
    let estimate = sessionState.estimate;
    const estimateMatch = aiMessage && typeof aiMessage === 'string' ? aiMessage.match(/(?:Estimated?|Estimate):?\s*([^\n]+)/i) : null;
    if (estimateMatch) {
      estimate = estimateMatch[1].trim();
    }

    sessionState.lastMessage = aiMessage;
    sessionState.estimate = estimate;

    res.json({ success: true, message: aiMessage, estimate });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------- NEW: GET EXISTING CONVERSATION --------------------
router.get('/conversation/:jobId', authenticateUser, async (req, res) => {
  try {
    const { jobId } = req.params;
    console.log('🔍 Fetching existing conversation for jobId:', jobId);

    // Build query with userId filter if authenticated
    const query = { jobId };
    if (req.user && req.user.id) {
      query.userId = req.user.id;
    } else {
      // If not authenticated, return no conversation
      return res.json({
        success: true,
        hasExisting: false,
        message: 'Authentication required'
      });
    }

    // Find the most recent estimate for this job and user
    const existingEstimate = await PendingEstimate.findOne(query).sort({ createdAt: -1 });
    
    if (!existingEstimate) {
      console.log('❌ No existing conversation found for this job');
      return res.json({
        success: true,
        hasExisting: false,
        message: 'No existing conversation found'
      });
    }

    console.log('📋 Found existing conversation:', {
      id: existingEstimate._id,
      status: existingEstimate.status,
      questionsCount: existingEstimate.aiAnalysis?.questionsAndAnswers?.length || 0
    });

    // Extract conversation data
    const aiAnalysis = existingEstimate.aiAnalysis || {};
    const questionsAndAnswers = aiAnalysis.questionsAndAnswers || [];
    
    // Build the conversation messages array
    let messages = [];
    
    // Use conversationHistory if available (newer format), otherwise build from aiAnalysis (older format)
    if (existingEstimate.conversationHistory && existingEstimate.conversationHistory.length > 0) {
      messages = existingEstimate.conversationHistory;
    } else {
      // Fallback to building from aiAnalysis for backward compatibility
      // Add initial analysis if available
      if (aiAnalysis.initialAnalysis) {
        messages.push({ role: 'ai', text: aiAnalysis.initialAnalysis });
      }
      
      // Add question-answer pairs as conversation
      questionsAndAnswers.forEach((qa, index) => {
        messages.push({ role: 'ai', text: `**Question ${index + 1}:**\n\n${qa.question}` });
        messages.push({ role: 'user', text: qa.answer });
      });
      
      // Add final analysis if available and questions are completed
      if (aiAnalysis.finalAnalysis && questionsAndAnswers.length > 0) {
        let finalMessage = aiAnalysis.finalAnalysis;
        
        // Add status-specific message based on approval status
        if (existingEstimate.status === 'pending') {
          finalMessage += '\n\n**📋 Estimate submitted to admin for approval. Please wait for approval before generating the final report.**';
        } else if (existingEstimate.status === 'approved') {
          finalMessage = '🎉 **Estimate Approved by Admin!**';
        } else if (existingEstimate.status === 'edited') {
          finalMessage = '✏️ **Estimate Edited by Admin!**';
        }
        
        messages.push({ role: 'ai', text: finalMessage });
      }
    }
    
    // Determine current estimate
    let currentEstimate = existingEstimate.originalEstimate;
    if (existingEstimate.status === 'edited' && existingEstimate.editedEstimate) {
      currentEstimate = existingEstimate.editedEstimate;
    }

    res.json({
      success: true,
      hasExisting: true,
      conversation: {
        messages: messages,
        answers: questionsAndAnswers,
        estimate: currentEstimate,
        estimateSubmitted: questionsAndAnswers.length > 0, // If there are answers, estimate was submitted
        adminApprovalStatus: existingEstimate.status,
        adminNotes: existingEstimate.adminNotes || '',
        finalEstimateGiven: existingEstimate.status === 'approved' || existingEstimate.status === 'edited',
        initialAnalysis: aiAnalysis.initialAnalysis || '',
        finalAnalysis: aiAnalysis.finalAnalysis || ''
      }
    });
    
  } catch (error) {
    console.error('💥 Error fetching existing conversation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// -------------------- NEW: SAVE CONVERSATION PROGRESS --------------------
router.post('/saveProgress', authenticateUser, async (req, res) => {
  try {
    const { jobId, initialAnalysis, questions, answers, currentQuestionIndex, messages } = req.body;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    if (!jobId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Job ID is required' 
      });
    }

    // Ensure jobId is a valid ObjectId
    let validJobId;
    try {
      if (mongoose.Types.ObjectId.isValid(jobId)) {
        validJobId = jobId;
      } else {
        validJobId = new mongoose.Types.ObjectId(jobId);
      }
    } catch (idError) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid job ID format: ${jobId}` 
      });
    }

    // Find existing estimate for this job and user
    let existingEstimate = await PendingEstimate.findOne({ 
      jobId: validJobId,
      userId: req.user.id 
    });

    if (existingEstimate) {
      // Update existing estimate with progress
      existingEstimate.aiAnalysis = existingEstimate.aiAnalysis || {};
      
      if (initialAnalysis) {
        existingEstimate.aiAnalysis.initialAnalysis = initialAnalysis;
      }
      
      if (answers && Array.isArray(answers)) {
        existingEstimate.aiAnalysis.questionsAndAnswers = answers;
      }
      
      // Store all messages for complete conversation history
      if (messages && Array.isArray(messages)) {
        // We'll store the full conversation in a new field for better tracking
        existingEstimate.conversationHistory = messages;
      }
      
      // Keep status as 'pending' if it's still in progress
      if (existingEstimate.status === 'pending' || !existingEstimate.status) {
        existingEstimate.status = 'pending';
      }
      
      // Update timestamp
      existingEstimate.updatedAt = new Date();
      
      await existingEstimate.save();
      console.log('✅ Updated conversation progress:', existingEstimate._id);
    } else {
      // Create new estimate with progress (but no final estimate yet)
      const pendingEstimate = new PendingEstimate({
        userId: req.user.id,
        jobId: validJobId,
        originalEstimate: typeof finalResponse === 'object' && finalResponse.estimate ? finalResponse.estimate : 'Estimate pending...', // Use AI estimate if available
        aiAnalysis: {
          initialAnalysis: initialAnalysis || '',
          finalAnalysis: '',
          questionsAndAnswers: answers || []
        },
        conversationHistory: messages || [], // Store complete conversation history
        status: 'pending'
      });
      await pendingEstimate.save();
      console.log('✅ Created new conversation progress:', pendingEstimate._id);
    }

    res.json({ 
      success: true, 
      message: 'Progress saved successfully' 
    });
  } catch (error) {
    console.error('💥 Error saving conversation progress:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// -------------------- RENAMED: GET REPORT DATA --------------------
router.get('/reportData', async (req, res) => {
  try {
    if (!sessionState.context) {
      return res.status(400).json({ success: false, error: 'No session data available' });
    }

    res.json({
      success: true,
      data: {
        job: sessionState.job,
        initialAnalysis: sessionState.initialAnalysis,
        finalAnalysis: sessionState.finalAnalysis,
        answers: sessionState.answers || [],
        estimate: sessionState.estimate,
        questions: sessionState.questions || []
      }
    });
  } catch (error) {
    console.error('Error getting report data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;