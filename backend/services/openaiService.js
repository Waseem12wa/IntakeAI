// Service for AI response and price estimation
const axios = require('axios');

// Real AI response using Groq API
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Startup diagnostics
console.log('Groq API Key:', GROQ_API_KEY ? 'present' : 'MISSING');

// Helper function to make Groq API calls
async function callGroqAPI(prompt, maxTokens = 1000, temperature = 0.2) {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key is missing. Please set GROQ_API_KEY in environment variables.');
  }

  const response = await axios.post(
    GROQ_API_URL,
    {
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: temperature,
      max_tokens: maxTokens
    },
    {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );

  return response.data.choices?.[0]?.message?.content?.trim() || '';
}

// Extract questions from AI response - improved for Groq format
function extractQuestions(text) {
  const questions = [];
  
  // Try multiple patterns to extract questions
  // Pattern 1: Standard numbered format (1. Question text)
  const numberedMatches = text.match(/^\d+\..+$/gm) || [];
  numberedMatches.forEach(match => {
    const question = match.replace(/^\d+\.\s*/, '').trim();
    if (question && question.length > 5) {
      questions.push(question);
    }
  });
  
  // Pattern 2: If no numbered questions found, look for lines after "Clarifying Questions"
  if (questions.length < 20) {
    const clarifyingSection = text.split(/\*\*Clarifying Questions\*\*/i)[1];
    if (clarifyingSection) {
      const lines = clarifyingSection.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('**') && trimmed.length > 10) {
          questions.push(trimmed);
        }
      });
    }
  }
  
  // Pattern 3: Look for any line ending with question mark
  if (questions.length < 20) {
    const questionLines = text.match(/[^.!]*\?/g) || [];
    questionLines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.length > 10 && !questions.includes(trimmed)) {
        questions.push(trimmed);
      }
    });
  }
  
  console.log(`📝 Extracted ${questions.length} questions from AI response`);
  return questions.slice(0, 5); // Ensure we don't exceed 5 questions
}

// Generate all 5 questions for frontend use
async function generateAllQuestions(text) {
  try {
    console.log('🤖 Generating all 5 questions...');
    
    const prompt = `You are an AI assistant that analyzes project descriptions or requirements documents.

Generate EXACTLY 5 comprehensive questions about this project. Return ONLY the questions, one per line, numbered 1-5.

Question categories to cover:
1: Project scope, timeline, deliverables
2: Technical requirements, architecture, integrations
3: User experience, interface, performance
4: Security, testing, deployment
5: Business aspects, resources, risks

Project text: ${text}`;

    const response = await callGroqAPI(prompt, 800, 0.3);
    console.log('🤖 All questions response received');
    
    // Extract numbered questions
    const questions = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^\d+\.\s*(.+)$/);
      if (match && match[1].trim().length > 10) {
        questions.push(match[1].trim());
      }
    }
    
    console.log(`📝 Generated ${questions.length} questions`);
    return questions.slice(0, 5); // Ensure we don't exceed 5
  } catch (error) {
    console.error('💥 Error generating all questions:', error);
    // Fallback: return a basic set of questions
    return [
      "What is the expected project timeline and key milestones?",
      "What are the main deliverables and success criteria?",
      "What technical requirements and constraints exist?",
      "What user experience and interface requirements are needed?",
      "What integrations with existing systems are required?"
    ];
  }
}

// Get initial analysis with summary and first question only
async function getInitialAnalysis(text) {
  try {
    console.log('🤖 Starting getInitialAnalysis with Groq...');
    
    const prompt = `You are an AI assistant that analyzes project descriptions or requirements documents.

You must respond in exactly this format:

**Summary**
[Short summary of the project focusing on technical aspects]

**Question 1:**
[First question about the project - ask about the most important aspect first]

IMPORTANT: Only show ONE question in your response. Do NOT show multiple questions or a list of questions.

STRICT REQUIREMENTS:
- Generate EXACTLY 5 comprehensive questions internally, but only show Question 1 in the response
- Do NOT include any pricing, cost estimates, budget ranges, or financial information
- Do NOT mention USD, dollars, costs, fees, or any monetary values
- Do NOT provide estimate ranges or total project costs
- Focus only on technical and implementation aspects
- Make the question specific and actionable
- Cover all aspects: technical, functional, non-functional, and business requirements

Project text to analyze: ${text}`;

    const fullResponse = await callGroqAPI(prompt, 800, 0.3);
    console.log('🤖 AI Full Response received:', fullResponse);
    
    // Extract questions using improved regex
    let allQuestions = [];
    
    // Clean up the response if it has numbered formatting
    let cleanedResponse = fullResponse;
    
    // Extract the single question from the response
    const questionMatch = cleanedResponse.match(/\*\*Question 1:\*\*\s*\n\s*(.+?)(?=\n|$)/s);
    
    if (questionMatch && questionMatch[1]) {
      const question = questionMatch[1].trim();
      if (question && question.length > 10) {
        allQuestions = [question];
      }
    }
    
    console.log('🔍 Single question extracted:', allQuestions.length > 0 ? allQuestions[0] : 'None');

    // Extract summary section only (no estimate)
    let summaryAndEstimate = '';
    
    // Extract Summary section
    const summaryMatch = cleanedResponse.match(/\*\*Summary\*\*([\s\S]*?)\*\*Question 1:\*\*/);
    if (summaryMatch) {
      summaryAndEstimate += `**Summary**\n${summaryMatch[1].trim()}`;
    }
    
    // Add the single question if available
    if (allQuestions.length > 0) {
      summaryAndEstimate += `

**Question 1:**

${allQuestions[0]}`;
      
      summaryAndEstimate += `

*Note: There are 5 total questions available. Click "Next Question" to continue or "Show All Questions" to see the complete list.*`;
      
      console.log('✂️ Added single question to response');
    } else {
      console.log('⚠️ No valid question found after filtering');
    }

    console.log('📝 Final formatted message:', summaryAndEstimate);

    const result = {
      message: summaryAndEstimate, // Summary + first question only
      questions: await generateAllQuestions(text), // All 5 questions for frontend
      fullResponse: fullResponse // Keep full response for debugging
    };

    console.log('📤 Returning result with message length:', result.message.length);
    console.log('📤 Returning questions count:', result.questions.length);

    return result;

  } catch (err) {
    console.error('💥 Error in getInitialAnalysis:', err);
    return handleAIError(err, text);
  }
}

// Finalize estimate based on all answers
async function getFinalEstimate(project, answers, originalEstimate) {
  try {
    console.log('🏁 Starting getFinalEstimate with Groq...');

    const answersText = answers.map((item, i) =>
      `Q${i + 1}: ${item.question}\nA${i + 1}: ${item.answer}`
    ).join('\n\n');

    const projectText = `Project: ${project.title}\nDescription: ${project.description}`;

    // Generate technical analysis
    const analysisPrompt = `You are an AI assistant that provides concise final project analysis.

Based on the project details and the user's answers to clarifying questions, provide ONLY a CONCISE technical analysis in this exact format:

**Final Analysis**
[Provide a brief, focused technical analysis (2-3 short paragraphs max) covering only the most critical points:]
- Key technical requirements
- Main implementation approach
- Critical considerations or constraints

STRICT REQUIREMENTS:
- Keep response under 200 words total
- Focus only on essential technical aspects
- Do NOT include any pricing, cost estimates, budget ranges, or financial information
- Do NOT mention USD, dollars, costs, fees, or any monetary values
- Do NOT provide estimate ranges or total project costs
- Be direct and to the point
- Do not use asterisks (*) in your response text

${projectText}

Answers:
${answersText}`;

    const finalAnalysis = await callGroqAPI(analysisPrompt, 200, 0.2);
    console.log('🏁 Final analysis response received:', finalAnalysis.substring(0, 100) + '...');
    
    // Generate price estimate
    const pricePrompt = `You are an AI assistant that provides project cost estimates.

Based on the project details and answers, provide a detailed cost estimate in this exact format:

**Project Cost Estimate**

**Estimated Work Hours:** [Number] hours
**Hourly Rate:** $[Number] per hour
**Complexity Factor:** [Number]x (1.0-3.0)
**Base Cost:** $[Number]
**Admin Fee (10%):** $[Number]
**Commission (5%):** $[Number]
**Surcharges:** $[Number]
**Discounts:** $[Number]
**Total Estimated Cost:** $[Number]

**Breakdown:**
- Development: [Number] hours × $[Number] = $[Number]
- Testing: [Number] hours × $[Number] = $[Number]
- Deployment: [Number] hours × $[Number] = $[Number]
- Documentation: [Number] hours × $[Number] = $[Number]

**Timeline:** [Number] weeks
**Team Size:** [Number] developers

${projectText}

Answers:
${answersText}`;

    const priceEstimate = await callGroqAPI(pricePrompt, 300, 0.3);
    console.log('💰 Price estimate response received:', priceEstimate.substring(0, 100) + '...');
    
    // Return data without creating PendingEstimate (route handler will create it with userId)
    return {
      analysis: finalAnalysis,
      estimate: priceEstimate,
      status: 'pending_admin_approval'
    };

  } catch (err) {
    console.error('💥 Error getting final estimate:', err.response?.data || err.message);
    return {
      analysis: 'Error generating final analysis. Please try again.',
      estimate: 'Error generating price estimate. Please try again.',
      status: 'error'
    };
  }
}

// General AI response (not trimmed) - used for full question display
async function getAIResponse(text) {
  try {
    console.log('🤖 Starting getAIResponse (full response) with Groq...');
    
    const prompt = `You are an AI assistant that analyzes project descriptions or requirements documents.

You must respond in exactly this format:

**Summary**
[Short summary of the project focusing on technical aspects]

**Clarifying Questions**
1. [Question about project timeline and deliverables]
2. [Question about technical requirements and architecture]
3. [Question about user experience and interface requirements]
4. [Question about security, testing, and deployment]
5. [Question about business aspects, resources, and risks]

STRICT REQUIREMENTS:
- Generate EXACTLY 5 comprehensive questions
- Do NOT include any pricing, cost estimates, budget ranges, or financial information
- Do NOT mention USD, dollars, costs, fees, or any monetary values
- Do NOT provide estimate ranges or total project costs
- Focus only on technical and implementation aspects
- Make each question specific and actionable
- Cover all aspects: technical, functional, non-functional, and business requirements

Project text: ${text}`;

    const fullResponse = await callGroqAPI(prompt, 800, 0.3);
    console.log('🤖 Full AI response received:', fullResponse.substring(0, 100) + '...');
    
    return fullResponse;
  } catch (err) {
    console.error('💥 Error in getAIResponse:', err);
    return handleAIError(err, text);
  }
}

// Error handler
async function handleAIError(err, text) {
  console.error('Groq API error:', err.response?.data || err.message);
  return 'Sorry, there was an error contacting the AI service.';
}

// Dummy price estimate
function getEstimate(text) {
  const wordCount = text.split(/\s+/).length;
  if (wordCount < 100) return null;
  return `$${(wordCount * 10).toLocaleString()}`;
}

// Extract structured fields from conversation using Groq API
async function extractFieldsFromConversation(conversation) {
  try {
    console.log('🤖 Starting extractFieldsFromConversation using Groq...');
    
    // Convert conversation array to text
    const conversationText = conversation.map(item => 
      `Q: ${item.question}\nA: ${item.answer}`
    ).join('\n\n');

    const prompt = `You are an AI assistant that extracts structured information from project intake conversations.

Based on the conversation, extract and return a JSON object with these exact fields:
- project_type: string (type of project: Web App, Mobile App, AI/NLP, Integration, etc.)
- objective: string (main objective or goal)
- current_process: string (description of current process)
- target_users: string (who will use this)
- integrations: string (required integrations)
- budget: string (always set to "Not specified" - do not extract actual budget values)
- deadline: string (timeline/deadline without cost implications)
- constraints: string (technical constraints only, no financial)
- additional_notes: string (technical information only, no pricing)

STRICT REQUIREMENTS:
- Do NOT include any pricing, cost estimates, or financial information
- For budget field, always use "Not specified" regardless of conversation content
- Focus only on technical and functional requirements
- Return only valid JSON without markdown formatting
- Do not use asterisks (*) in your response text

Extract structured fields from this conversation:

${conversationText}`;

    const aiResponse = await callGroqAPI(prompt, 500, 0.1);
    console.log('🤖 Raw AI response:', aiResponse);
    
    // Clean and parse the response
    const cleanedResponse = aiResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const extractedFields = JSON.parse(cleanedResponse);
    console.log('✅ Extracted fields:', extractedFields);
    
    return extractedFields;

  } catch (err) {
    console.error('💥 Error in extractFieldsFromConversation:', err);
    // Return default structure if extraction fails
    return {
      project_type: 'Unknown',
      objective: 'Not specified',
      current_process: 'Not specified',
      target_users: 'Not specified',
      integrations: 'None',
      budget: 'Not specified',
      deadline: 'Not specified',
      constraints: 'None',
      additional_notes: 'Extraction failed'
    };
  }
}

module.exports = {
  getAIResponse,
  getInitialAnalysis,
  getFinalEstimate,
  getEstimate,
  extractQuestions,
  extractFieldsFromConversation
};