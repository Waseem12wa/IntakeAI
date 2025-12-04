import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import jsPDF from 'jspdf';
import { getAuthHeaders } from '../utils/api';

// Add CSS animation for spinner and hide scrollbars
const spinnerStyle = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* Hide scrollbar for webkit browsers */
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  
  /* Hide scrollbar for Firefox */
  .hide-scrollbar {
    scrollbar-width: none;
  }
  
  /* Hide scrollbar for IE */
  .hide-scrollbar {
    -ms-overflow-style: none;
  }
`;

// Inject the CSS
if (typeof document !== 'undefined' && !document.getElementById('spinner-style')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'spinner-style';
  styleSheet.innerText = spinnerStyle;
  document.head.appendChild(styleSheet);
}

// Component to render formatted AI responses
function FormattedMessage({ text }) {
  const formatText = (text) => {
    // First, clean up markdown-style headers
    let cleanText = text
      .replace(/## Step \d+:\s*/g, '') // Remove ## Step 1: etc
      .replace(/##\s+/g, '') // Remove remaining ##
      .replace(/# /g, ''); // Remove # headers
    
    // Split by double asterisks for sections like **Summary**
    const parts = cleanText.split(/(\*\*[^*]+\*\*)/);
    
    return parts.map((part, index) => {
      if (part.match(/\*\*[^*]+\*\*/)) {
        // This is a header like **Summary**
        const headerText = part.replace(/\*\*/g, '');
        return (
          <div key={index} style={{ 
            fontSize: '1.1rem', 
            fontWeight: 'bold', 
            color: '#1976d2', 
            marginTop: index > 0 ? '20px' : '0',
            marginBottom: '12px'
          }}>
            {headerText}
          </div>
        );
      } else {
        // Regular text - split by lines and handle numbered questions
        const lines = part.split('\n').filter(line => line.trim());
        return lines.map((line, lineIndex) => {
          const trimmed = line.trim();
          if (!trimmed) return null;
          
          // Check if it's a numbered question
          if (trimmed.match(/^\d+\./)) {
            return (
              <div key={`${index}-${lineIndex}`} style={{
                marginBottom: '10px',
                padding: '10px',
                backgroundColor: '#f0f8f0',
                borderRadius: '6px',
                borderLeft: '3px solid #059669'
              }}>
                <strong style={{ color: '#059669' }}>{trimmed}</strong>
              </div>
            );
          }
          
          // Regular paragraph
          return (
            <div key={`${index}-${lineIndex}`} style={{
              marginBottom: '8px',
              lineHeight: '1.6',
              color: '#374151'
            }}>
              {trimmed}
            </div>
          );
        });
      }
    });
  };

  return <div>{formatText(text)}</div>;
}

export default function AIBot() {
  const { id } = useParams(); // Get job ID from route
  const { showApprovalNotification } = useNotification(); // Use global notification context
  const [job, setJob] = useState(null);
  const [aiMessages, setAiMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [estimate, setEstimate] = useState(null);
  
  // New state for question management
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [isQuestionsMode, setIsQuestionsMode] = useState(false);
  const [finalEstimateGiven, setFinalEstimateGiven] = useState(false);
  const [initialAnalysis, setInitialAnalysis] = useState('');
  const [finalAnalysis, setFinalAnalysis] = useState('');

  // New state for admin approval
  const [estimateSubmitted, setEstimateSubmitted] = useState(false);
  const [adminApprovalStatus, setAdminApprovalStatus] = useState(null); // null, 'pending', 'approved', 'edited'
  const [approvedEstimate, setApprovedEstimate] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [checkingApproval, setCheckingApproval] = useState(false);

  // Fetch job info if opened with /ai-bot/:id
  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      try {
        const res = await fetch(`/api/jobs/${id}`, {
          headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch job');
        const data = await res.json();
        
        const jobData = data.job || data.data || data;
        setJob(jobData); // ✅ Set the job state
        
        // 🔍 Check for existing conversation first
        console.log('🔍 Checking for existing conversation for job:', jobData._id || jobData.id);
        const existingRes = await fetch(`/api/ai/conversation/${jobData._id || jobData.id}`, {
          headers: getAuthHeaders()
        });
        const existingData = await existingRes.json();
        
        console.log('📋 Existing conversation response:', existingData);

        if (existingData.success && existingData.hasExisting) {
          // 🔄 Restore existing conversation state
          console.log('🔄 Restoring existing conversation state');
          const conversation = existingData.conversation;
          
          setAiMessages(conversation.messages || []);
          setAnswers(conversation.answers || []);
          // Remove AI estimate from being shown to users
          setEstimateSubmitted(conversation.estimateSubmitted || false);
          setAdminApprovalStatus(conversation.adminApprovalStatus || null);
          setAdminNotes(conversation.adminNotes || '');
          setFinalEstimateGiven(conversation.finalEstimateGiven || false);
          setInitialAnalysis(conversation.initialAnalysis || '');
          setFinalAnalysis(conversation.finalAnalysis || '');
          
          // If all questions were answered, don't show questions mode
          if (conversation.answers && conversation.answers.length > 0) {
            setIsQuestionsMode(false);
            setCurrentQuestionIndex(conversation.answers.length); // Set to completed
            
            console.log('✅ Successfully restored conversation state:', {
              messagesCount: conversation.messages?.length || 0,
              answersCount: conversation.answers?.length || 0,
              estimate: conversation.estimate,
              status: conversation.adminApprovalStatus
            });
          }
          
          return; // Don't fetch new analysis if existing conversation found
        }
        
        // 🆕 No existing conversation, proceed with fresh analysis
        console.log('🆕 No existing conversation found, getting fresh analysis');
        
        // 🔹 ALWAYS pass initial=true for the first load to ensure consistent behavior
        const aiRes = await fetch('/api/ai/analyzeJob', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ 
            job: jobData, 
            initial: true  // ← Always true on first load to prevent reload issues
          })
        });
        const aiData = await aiRes.json();

        console.log('Frontend received from analyzeJob:', aiData);
        
        if (aiData.success) {
          // Set up new conversation
          setAiMessages([{ role: 'ai', text: aiData.message }]);
          setQuestions(aiData.questions || []);
          setCurrentQuestionIndex(0);
          setIsQuestionsMode(aiData.questions && aiData.questions.length > 0);
          
          // Reset estimate state
          setEstimate(aiData.estimate);
          setEstimateSubmitted(false);
          setAdminApprovalStatus(null);
          setApprovedEstimate(null);
          setAdminNotes('');
          
          // Save initial progress
          if (jobData._id || jobData.id) {
            try {
              await fetch('/api/ai/saveProgress', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                  jobId: jobData._id || jobData.id,
                  initialAnalysis: aiData.message,
                  questions: aiData.questions || [],
                  answers: [],
                  messages: [{ role: 'ai', text: aiData.message }] // Send initial conversation history
                })
              });
            } catch (err) {
              console.error('Error saving initial progress:', err);
            }
          }
          
          console.log('Intialized new conversation with:', {
            questionsCount: aiData.questions?.length || 0,
            estimate: aiData.estimate
          });
        } else {
          setAiMessages([{ role: 'ai', text: 'Error: ' + (aiData.error || 'Failed to get response.') }]);
        }
      } catch (err) {
        setAiMessages([{ role: 'ai', text: 'Error: ' + err.message }]);
      }
    };
    
    fetchJob();
  }, [id]); // Only depend on id to prevent unnecessary re-renders

  // Check approval status periodically
  useEffect(() => {
    let interval;
    if (estimateSubmitted && job && adminApprovalStatus === 'pending') {
      setCheckingApproval(true);
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/estimates/status/${job._id || job.id}`, {
            headers: getAuthHeaders()
          });
          const data = await res.json();
          
          console.log('Approval status check response:', data);
          
          if (data.success && data.estimate) {
            // Only update if status has changed
            if (data.estimate.status !== adminApprovalStatus) {
              setAdminApprovalStatus(data.estimate.status);
              setApprovedEstimate(data.estimate.finalEstimate);
              setAdminNotes(data.estimate.adminNotes || '');
              
              // Show approval notification using global context
              showApprovalNotification(
                data.estimate.status,
                job?.title || 'Your Project',
                job?._id || job?.id
              );
              
              // Show final approved message
              let statusMessage = '';
              if (data.estimate.status === 'approved') {
                statusMessage = '🎉 **Estimate Approved by Admin!**';
              } else if (data.estimate.status === 'edited') {
                statusMessage = '✏️ **Estimate Edited by Admin!**';
              }
              
              if (statusMessage) {
                setAiMessages((prev) => [...prev, { 
                  role: 'ai', 
                  text: statusMessage
                }]);
                
                setFinalEstimateGiven(true);
              }
            }
          } else {
            // Still pending - do nothing, keep checking
            console.log('Estimate still pending approval');
          }
        } catch (err) {
          console.error('Error checking approval status:', err);
        }
      }, 5000); // Check every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
      setCheckingApproval(false);
    };
  }, [estimateSubmitted, job, adminApprovalStatus]);



  // Handle answering questions one by one
  const handleQuestionAnswer = async () => {
    if (!userInput.trim() || !isQuestionsMode) return;
    
    // Add user's answer to the conversation
    setAiMessages((prev) => [...prev, { role: 'user', text: userInput }]);
    
    // Store the answer
    const newAnswers = [...answers, { question: questions[currentQuestionIndex], answer: userInput }];
    setAnswers(newAnswers);
    
    const currentAnswer = userInput;
    setUserInput('');

    // Save progress after each answer
    if (job && (job._id || job.id)) {
      try {
        await fetch('/api/ai/saveProgress', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            jobId: job._id || job.id,
            answers: newAnswers,
            currentQuestionIndex: currentQuestionIndex + 1,
            messages: [...aiMessages, { role: 'user', text: currentAnswer }] // Send complete conversation history
          })
        });
      } catch (err) {
        console.error('Error saving progress:', err);
      }
    }

    // Check if there are more questions
    if (currentQuestionIndex < questions.length - 1) {
      // Show next question
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      
      setAiMessages((prev) => [...prev, { 
        role: 'ai', 
        text: `**Question ${nextIndex + 1}:**\n\n${questions[nextIndex]}` 
      }]);
    } else {
      // All questions answered, get final response
      try {
        console.log('🚀 About to call finalizeEstimate with:', {
          jobId: job?._id || job?.id,
          jobTitle: job?.title,
          answersCount: newAnswers.length
        });
        
        const res = await fetch('/api/ai/finalizeEstimate', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ 
            job: job || {}, // Ensure job is not null/undefined
            answers: newAnswers
            // Remove originalEstimate - don't send AI estimate to backend
          })
        });
        const data = await res.json();
        
        if (data.success) {
          if (data.adminApprovalRequired) {
            setAiMessages((prev) => [...prev, { 
              role: 'ai', 
              text: `${data.message}\n\n**📋 Estimate submitted for admin approval. You will be notified once approved.**` 
            }]);
            setFinalAnalysis(data.message);
            setEstimateSubmitted(true);
            setAdminApprovalStatus('pending');
          } else {
            setAiMessages((prev) => [...prev, { 
              role: 'ai', 
              text: `${data.message}\n\n**💰 Final Estimate:** ${data.estimate}` 
            }]);
            setFinalAnalysis(data.message);
            setFinalEstimateGiven(true);
          }
        } else {
          setAiMessages((prev) => [...prev, { role: 'ai', text: 'Error: ' + (data.error || 'Failed to finalize estimate.') }]);
        }
      } catch (err) {
        setAiMessages((prev) => [...prev, { role: 'ai', text: 'Error: ' + err.message }]);
      }
      
      setIsQuestionsMode(false); // Exit questions mode
    }
  };

  // Regular chat (when not in questions mode)
  const handleRegularChat = async () => {
    if (!userInput.trim()) return;
    setAiMessages((prev) => [...prev, { role: 'user', text: userInput }]);
    setUserInput('');
    
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message: userInput, job })
      });
      const data = await res.json();
      console.log('Frontend received from chat:', data);
      
      if (data.success) {
        setAiMessages((prev) => [...prev, { role: 'ai', text: data.message }]);
        // Remove AI estimate from being stored/shown to users
      } else {
        setAiMessages((prev) => [...prev, { role: 'ai', text: 'Error: ' + (data.error || 'Failed to get response.') }]);
      }
    } catch (err) {
      setAiMessages([{ role: 'ai', text: 'Error: ' + err.message }]);
    }
  };

  // Decide which handler to use
  const handleSend = () => {
    if (isQuestionsMode) {
      handleQuestionAnswer();
    } else {
      handleRegularChat();
    }
  };

  // Helper to structure report data for downloads
  const createReportData = () => {
    return {
      reportTitle: 'AI Project Estimate Report',
      generatedDate: new Date().toISOString(),
      projectInfo: job,
      initialAnalysis: initialAnalysis,
      questionsAndAnswers: answers,
      finalAnalysis: finalAnalysis,
    };
  };

  // Generate and download PDF
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Helper function to add text with word wrapping
    const addText = (text, fontSize = 12, isBold = false, color = '#000000') => {
      doc.setFontSize(fontSize);
      if (isBold) {
        doc.setFont(undefined, 'bold');
      } else {
        doc.setFont(undefined, 'normal');
      }
      doc.setTextColor(color);
      
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line) => {
        if (yPosition > 280) { // Near bottom of page
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += fontSize * 0.5;
      });
      yPosition += 5; // Add some spacing after text
    };

    // Helper function to clean text for PDF
    const cleanText = (text) => {
      return text
        .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove markdown bold
        .replace(/## Step \d+:\s*/g, '') // Remove step headers
        .replace(/##\s+/g, '') // Remove remaining ##
        .replace(/# /g, '') // Remove # headers
        .trim();
    };

    // Title
    addText('AI Project Estimate Report', 20, true, '#1976d2');
    yPosition += 10;

    // Date
    addText(`Generated on: ${new Date().toLocaleDateString()}`, 10);
    yPosition += 10;

    // Job/Project Information
    if (job) {
      addText('Project Information:', 16, true, '#1976d2');
      addText(`Title: ${job.title}`);
      if (job.company) addText(`Company: ${job.company}`);
      addText(`Description: ${job.description}`);
      if (job.skills && job.skills.length > 0) {
        addText(`Skills Required: ${job.skills.join(', ')}`);
      }
      if (job.location) addText(`Location: ${job.location}`);
      if (job.type) addText(`Type: ${job.type}`);
      if (job.salary) addText(`Salary: ${job.salary}`);
      yPosition += 10;
    }

    // Initial Analysis
    if (initialAnalysis) {
      addText('Initial Analysis:', 16, true, '#1976d2');
      addText(cleanText(initialAnalysis));
      yPosition += 10;
    }

    // Questions and Answers
    if (answers.length > 0) {
      addText('Questions & Answers:', 16, true, '#1976d2');
      answers.forEach((item, index) => {
        addText(`Q${index + 1}: ${item.question}`, 12, true, '#059669');
        addText(`A${index + 1}: ${item.answer}`);
        yPosition += 5;
      });
      yPosition += 10;
    }

    // Final Analysis
    if (finalAnalysis) {
      addText('Final Analysis:', 16, true, '#1976d2');
      addText(cleanText(finalAnalysis));
      yPosition += 10;
    }

    // Save the PDF
    const fileName = job ? `${job.title.replace(/[^a-z0-9]/gi, '_')}_estimate.pdf` : 'project_estimate.pdf';
    doc.save(fileName);
  };

  // NEW: Generate and download JSON
  const downloadJSON = () => {
    const data = createReportData();
    const jsonString = JSON.stringify(data, null, 2); // Pretty print
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = job ? `${job.title.replace(/[^a-z0-9]/gi, '_')}_estimate.json` : 'project_estimate.json';
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // NEW: Generate and download Markdown
  const downloadMarkdown = () => {
    const data = createReportData();
    
    // Helper to clean text for Markdown (removes markdown within markdown)
    const cleanMdText = (text) => text.replace(/\*\*/g, '').replace(/## Step \d+:/g, '').trim();

    let mdContent = `# ${data.reportTitle}\n\n`;
    mdContent += `**Generated on:** ${new Date(data.generatedDate).toLocaleDateString()}\n\n`;

    if (data.projectInfo) {
      mdContent += `## Project Information\n`;
      mdContent += `**Title:** ${data.projectInfo.title}\n`;
      if (data.projectInfo.company) mdContent += `**Company:** ${data.projectInfo.company}\n`;
      mdContent += `**Description:**\n${data.projectInfo.description}\n\n`;
    }

    if (data.initialAnalysis) {
      mdContent += `## Initial Analysis\n`;
      mdContent += `${cleanMdText(data.initialAnalysis)}\n\n`;
    }

    if (data.questionsAndAnswers && data.questionsAndAnswers.length > 0) {
      mdContent += `## Questions & Answers\n`;
      data.questionsAndAnswers.forEach((item, index) => {
        mdContent += `**Q${index + 1}: ${item.question}**\n`;
        mdContent += `A${index + 1}: ${item.answer}\n\n`;
      });
    }

    if (data.finalAnalysis) {
      mdContent += `## Final Analysis\n`;
      mdContent += `${cleanMdText(data.finalAnalysis)}\n\n`;
    }

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = job ? `${job.title.replace(/[^a-z0-9]/gi, '_')}_estimate.md` : 'project_estimate.md';
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      
      {/* ChatGPT-style Interface */}
      <div style={{ 
        background: '#ffffff',
        minHeight: '100vh', 
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Segoe UI', 'San Francisco', -apple-system, BlinkMacSystemFont, sans-serif" 
      }}>
        
        {/* Top Header */}
        <div style={{
          borderBottom: '1px solid #e5e5e5',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: '#10a37f',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              AI
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '16px', color: '#343541' }}>
                IntakeAI Project Estimator
              </div>
              <div style={{ fontSize: '12px', color: '#8e8ea0' }}>
                {job ? `Analyzing: ${job.title}` : 'AI-powered project analysis'}
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Container */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '800px',
          margin: '0 auto',
          width: '100%'
        }}>

          {/* Chat Messages Area */}
          <div style={{
            flex: 1,
            padding: '20px 16px',
            overflow: 'auto'
          }}>
            {aiMessages.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '80px 20px',
                color: '#8e8ea0'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>💬</div>
                <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
                  How can I help you today?
                </div>
                <div style={{ fontSize: '14px' }}>
                  Ask me about your project requirements for an instant estimate
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {aiMessages.map((msg, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                  }}>
                    {/* Avatar - only show for AI messages on the left */}
                    {msg.role === 'ai' && (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        flexShrink: 0,
                        background: '#10a37f',
                        color: 'white',
                        fontWeight: '600'
                      }}>
                        AI
                      </div>
                    )}
                    
                    {/* Message Content */}
                    <div style={{
                      maxWidth: '70%',
                      color: '#343541',
                      fontSize: '16px',
                      lineHeight: '1.6',
                      paddingTop: '6px'
                    }}>
                      {/* Message bubble with rounded edges */}
                      <div style={{
                        background: '#f8f9fa',
                        color: '#343541',
                        padding: '12px 16px',
                        borderRadius: '18px',
                        border: '1px solid #e5e5e5',
                        wordWrap: 'break-word'
                      }}>
                        {msg.role === 'ai' ? <FormattedMessage text={msg.text} /> : msg.text}
                      </div>
                    </div>
                    
                    {/* Avatar - only show for user messages on the right */}
                    {msg.role === 'user' && (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        flexShrink: 0,
                        background: '#5436da',
                        color: 'white',
                        fontWeight: '600'
                      }}>
                        U
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Input Section */}
          {aiMessages.length > 0 && !finalEstimateGiven && (
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid #e5e5e5',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  placeholder={isQuestionsMode ? "Type your answer here..." : "Ask me anything about your project..."}
                  style={{ 
                    width: '100%',
                    padding: '14px 16px', 
                    borderRadius: '12px', 
                    border: '2px solid #e9ecef', 
                    fontSize: 16,
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    fontFamily: 'inherit'
                  }}
                  onKeyPress={e => e.key === 'Enter' && handleSend()}
                  onFocus={e => e.target.style.borderColor = '#1976d2'}
                  onBlur={e => e.target.style.borderColor = '#e9ecef'}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!userInput.trim()}
                style={{ 
                  background: !userInput.trim() 
                    ? '#e9ecef' 
                    : 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', 
                  color: !userInput.trim() ? '#6c757d' : '#ffffff', 
                  padding: '14px 24px', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontWeight: '700', 
                  fontSize: '14px', 
                  cursor: !userInput.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: !userInput.trim() ? 'none' : '0 4px 15px rgba(25, 118, 210, 0.3)',
                  minWidth: '100px'
                }}
              >
                {isQuestionsMode ? '🚀 Next' : '📎 Send'}
              </button>
            </div>
          )}

          {/* Pending Approval Status - ChatGPT Style */}
          {estimateSubmitted && adminApprovalStatus === 'pending' && (
            <div style={{ 
              margin: '20px 16px',
              padding: '16px',
              background: '#fff3cd',
              borderRadius: '12px',
              border: '1px solid #ffeaa7'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: '#f59e0b',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>
                  ⏳
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#b45309' }}>
                    Estimate Under Review
                  </div>
                  <div style={{ fontSize: '14px', color: '#92400e' }}>
                    {checkingApproval ? 'Checking approval status...' : 'Waiting for admin approval'}
                  </div>
                </div>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '12px',
                color: '#78350f'
              }}>
                🔔 You'll be notified once the review is complete
              </div>
            </div>
          )}

          {/* Admin Notes Section - ChatGPT Style */}
          {(adminApprovalStatus === 'approved' || adminApprovalStatus === 'edited') && adminNotes && (
            <div style={{ 
              margin: '20px 16px',
              padding: '16px',
              background: '#d1f2eb',
              borderRadius: '12px',
              border: '1px solid #a7f3d0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: '#10a37f',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  color: 'white'
                }}>
                  📝
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: '#047857'
                }}>
                  Admin Review Notes
                </div>
              </div>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px', 
                color: '#065f46',
                lineHeight: '1.5'
              }}>
                {adminNotes}
              </div>
            </div>
          )}

          {/* Download Buttons Section - ChatGPT Style */}
          {finalEstimateGiven && (adminApprovalStatus === 'approved' || adminApprovalStatus === 'edited') && (
            <div style={{ 
              margin: '20px 16px',
              padding: '20px',
              background: '#f0f9ff',
              borderRadius: '12px',
              border: '1px solid #bae6fd',
              textAlign: 'center'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#0ea5e9',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '24px',
                color: '#ffffff'
              }}>
                🎉
              </div>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#0c4a6e', 
                margin: '0 0 8px 0' 
              }}>
                Estimate Approved!
              </h3>
              <p style={{ 
                fontSize: '14px', 
                color: '#075985', 
                margin: '0 0 20px 0'
              }}>
                Your project estimate has been approved. Download your report below:
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={generatePDF}
                  style={{ 
                    background: '#0ea5e9',
                    color: 'white',
                    padding: '10px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#0284c7'}
                  onMouseLeave={(e) => e.target.style.background = '#0ea5e9'}
                >
                  📄 PDF Report
                </button>
                <button
                  onClick={downloadMarkdown}
                  style={{ 
                    background: '#10a37f',
                    color: 'white',
                    padding: '10px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#0d8d6b'}
                  onMouseLeave={(e) => e.target.style.background = '#10a37f'}
                >
                  📑 Markdown
                </button>
              </div>
              <div style={{
                fontSize: '11px',
                color: '#64748b',
                marginTop: '12px'
              }}>
                All reports contain the complete project analysis and final estimate
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}