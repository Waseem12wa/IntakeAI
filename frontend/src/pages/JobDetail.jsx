import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuthHeaders } from '../utils/api';

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

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // AI bot states
  const [aiMessages, setAiMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isBotLoading, setIsBotLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [isQuestionsMode, setIsQuestionsMode] = useState(false);
  const [finalEstimateGiven, setFinalEstimateGiven] = useState(false);
  const [estimateApproved, setEstimateApproved] = useState(false); // New state for approval status
  const [approvedEstimateData, setApprovedEstimateData] = useState(null); // New state for approved estimate data

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/jobs/${id}`, {
          headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch job');
        const jobData = await res.json();
        setJob(jobData.data);

        // Initialize bot with job details
        await initializeBot(jobData.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchJob();
    }
  }, [id]);

  const initializeBot = async (jobData) => {
    try {
      // Check for existing conversation first
      const existingRes = await fetch(`/api/ai/conversation/${jobData._id || jobData.id}`, {
        headers: getAuthHeaders()
      });
      const existingData = await existingRes.json();

      if (existingData.success && existingData.hasExisting) {
        // Restore existing conversation state
        const conversation = existingData.conversation;
        setAiMessages(conversation.messages || []);
        setAnswers(conversation.answers || []);
        setFinalEstimateGiven(conversation.finalEstimateGiven || false);

        // If all questions were answered, don't show questions mode
        if (conversation.answers && conversation.answers.length > 0) {
          setIsQuestionsMode(false);
          setCurrentQuestionIndex(conversation.answers.length);
        }
        return;
      }

      // No existing conversation, get fresh analysis
      const aiRes = await fetch('/api/ai/analyzeJob', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          job: jobData,
          initial: true
        })
      });
      const aiData = await aiRes.json();

      if (aiData.success) {
        // Set up new conversation - extract summary and add first question separately
        // Extract just the summary part (remove Question 1 from the message if present)
        let summaryMessage = aiData.message;
        const questionMatch = summaryMessage.indexOf('**Question 1:**');
        if (questionMatch !== -1) {
          // Extract only the summary part before Question 1
          summaryMessage = summaryMessage.substring(0, questionMatch).trim();
        }

        const initialMessages = [{ role: 'ai', text: summaryMessage }];
        if (aiData.questions && aiData.questions.length > 0) {
          initialMessages.push({
            role: 'ai',
            text: `**Question 1:**\n\n${aiData.questions[0]}`
          });
        }
        setAiMessages(initialMessages);
        setQuestions(aiData.questions || []);
        setCurrentQuestionIndex(0);
        setIsQuestionsMode(aiData.questions && aiData.questions.length > 0);

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
                messages: initialMessages // Send initial conversation history
              })
            });
          } catch (err) {
            console.error('Error saving initial progress:', err);
          }
        }
      }
    } catch (err) {
      console.error('Error initializing bot:', err);
      const errorMessage = { role: 'ai', text: 'Sorry, I encountered an error initializing the assistant. Please try again.' };
      setAiMessages([errorMessage]);
    }
  };

  const handleSendMessage = async () => {
    if ((!userInput.trim() && !isQuestionsMode) || isBotLoading) return;

    let messageToSend = userInput;
    if (isQuestionsMode && currentQuestionIndex < questions.length) {
      messageToSend = userInput || 'No specific answer'; // Use user input or default
    }

    // Add user message to chat
    const userMessage = { role: 'user', text: messageToSend };
    setAiMessages(prev => [...prev, userMessage]);

    // If in questions mode, store the answer
    let newAnswers = answers;
    if (isQuestionsMode && currentQuestionIndex < questions.length) {
      const newAnswer = {
        question: questions[currentQuestionIndex],
        answer: messageToSend
      };
      newAnswers = [...answers, newAnswer];
      setAnswers(newAnswers);

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
              messages: aiMessages // Send complete conversation history
            })
          });
        } catch (err) {
          console.error('Error saving progress:', err);
        }
      }
    }

    setUserInput('');
    setIsBotLoading(true);

    try {
      if (isQuestionsMode && currentQuestionIndex < questions.length) {
        // Move to next question or finalize
        if (currentQuestionIndex < questions.length - 1) {
          // Move to next question and display it as a message
          const nextIndex = currentQuestionIndex + 1;
          setCurrentQuestionIndex(nextIndex);
          setAiMessages(prev => [...prev, {
            role: 'ai',
            text: `**Question ${nextIndex + 1}:**\n\n${questions[nextIndex]}`
          }]);
        } else {
          // All questions answered, finalize estimate
          await finalizeEstimate();
        }
      } else {
        // Send message to AI service for general chat
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            message: messageToSend,
            job: job
          }),
        });

        if (!res.ok) throw new Error('Failed to get response from AI');

        const data = await res.json();
        const aiMessage = { role: 'ai', text: data.message };
        const updatedMessages = [...prev, aiMessage];
        setAiMessages(updatedMessages);

        // Save conversation progress for general chat
        if (job && (job._id || job.id)) {
          try {
            await fetch('/api/ai/saveProgress', {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify({
                jobId: job._id || job.id,
                messages: updatedMessages // Send complete conversation history
              })
            });
          } catch (err) {
            console.error('Error saving chat progress:', err);
          }
        }
      }
    } catch (err) {
      const errorMessage = { role: 'ai', text: 'Sorry, I encountered an error. Please try again.' };
      setAiMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsBotLoading(false);
    }
  };

  // Add polling for estimate approval status
  useEffect(() => {
    let pollInterval;

    if (finalEstimateGiven && !estimateApproved) {
      // Start polling for estimate approval status
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/estimates/status/${id}`, {
            headers: getAuthHeaders()
          });
          if (res.ok) {
            const data = await res.json();
            if (data.approved) {
              setEstimateApproved(true);
              setApprovedEstimateData(data.estimate);
              // Add a simple message to the chat showing only the approved estimate cost
              const finalCost = data.estimate.calculatedPrice || data.estimate.finalEstimate || 'N/A';
              const approvalMessage = {
                role: 'ai',
                text: `🎉 Estimate Approved by Admin!

✅ Your project estimate has been approved by the admin!

Final Project Cost: $${finalCost}`
              };
              setAiMessages(prev => [...prev, approvalMessage]);
            }
          }
        } catch (err) {
          console.error('Error polling estimate status:', err);
        }
      }, 5000); // Poll every 5 seconds
    }

    // Clean up interval on unmount or when conditions change
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [id, finalEstimateGiven, estimateApproved]);

  const finalizeEstimate = async () => {
    try {
      const res = await fetch('/api/ai/finalizeEstimate', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          job: job,
          answers: answers,
          originalEstimate: null
        }),
      });

      if (!res.ok) throw new Error('Failed to finalize estimate');

      const data = await res.json();

      // Add final analysis to messages
      const finalMessage = { role: 'ai', text: data.message || data.finalAnalysis || 'Estimate finalized successfully. Sending to admin for approval...' };
      const updatedMessages = [...aiMessages, finalMessage];
      setAiMessages(updatedMessages);
      setFinalEstimateGiven(true);
      setIsQuestionsMode(false);

      // Save conversation progress after finalizing estimate
      if (job && (job._id || job.id)) {
        try {
          await fetch('/api/ai/saveProgress', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              jobId: job._id || job.id,
              messages: updatedMessages, // Send complete conversation history
              answers: answers
            })
          });
        } catch (err) {
          console.error('Error saving final estimate progress:', err);
        }
      }
    } catch (err) {
      const errorMessage = { role: 'ai', text: 'Sorry, I encountered an error finalizing the estimate. Please try again.' };
      setAiMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getCurrentQuestion = () => {
    if (isQuestionsMode && questions.length > 0 && currentQuestionIndex < questions.length) {
      return questions[currentQuestionIndex];
    }
    return null;
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f9fafb',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
      }}>
        <div style={{ textAlign: 'center', color: '#888', fontSize: 18 }}>Loading project details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f9fafb',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
      }}>
        <div style={{ textAlign: 'center', color: '#e53e3e', fontSize: 18 }}>
          Error: {error}
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f9fafb',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
      }}>
        <div style={{ textAlign: 'center', color: '#888', fontSize: 18 }}>Project not found.</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f9fafb',
      fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
    }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontWeight: 800, fontSize: '2rem', color: '#1976d2' }}>
            Project Details
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            {/* Edit Button */}
            <button
              onClick={() => {
                if (isEditing) {
                  // Save logic
                  const handleUpdate = async () => {
                    try {
                      const res = await fetch(`/api/projects/${job._id || job.id}`, {
                        method: 'PUT',
                        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                      });
                      if (res.ok) {
                        const updated = await res.json();
                        setJob(updated);
                        setIsEditing(false);
                        alert('Project updated!');
                      } else {
                        alert('Update failed');
                      }
                    } catch (err) { console.error(err); alert('Update failed'); }
                  };
                  handleUpdate();
                } else {
                  setFormData(job);
                  setIsEditing(true);
                }
              }}
              style={{
                background: isEditing ? '#10b981' : '#3b82f6',
                color: '#fff',
                padding: '10px 20px',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              {isEditing ? 'Save Changes' : 'Edit Project'}
            </button>
            {isEditing && (
              <button
                onClick={() => setIsEditing(false)}
                style={{ background: '#6c757d', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer' }}
              >
                Cancel
              </button>
            )}
            <button
              onClick={() => navigate('/jobs')}
              style={{
                background: '#6c757d',
                color: '#fff',
                padding: '10px 20px',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#5a6268'}
              onMouseLeave={(e) => e.target.style.background = '#6c757d'}
            >
              Back to Projects
            </button>
          </div>
        </div>

        {/* Job Details */}
        <div style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 2px 8px #0001',
          padding: 32,
          marginBottom: 24
        }}>
          {isEditing ? (
            <input
              value={formData.title || ''}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              style={{ fontSize: '1.5rem', fontWeight: 700, width: '100%', marginBottom: 16, padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
            />
          ) : (
            <h3 style={{ fontWeight: 700, fontSize: '1.5rem', color: '#222', marginBottom: 16 }}>
              {job.title}
            </h3>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ color: '#6c757d', fontSize: 14, marginBottom: 4 }}>Company</div>
              {isEditing ? (
                <input value={formData.company || ''} onChange={e => setFormData({ ...formData, company: e.target.value })} style={{ width: '100%', padding: 4 }} />
              ) : (
                <div style={{ fontWeight: 600, fontSize: 16, color: '#1976d2' }}>
                  {job.company}
                </div>
              )}
            </div>

            <div>
              <div style={{ color: '#6c757d', fontSize: 14, marginBottom: 4 }}>Location</div>
              {isEditing ? (
                <input value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} style={{ width: '100%', padding: 4 }} />
              ) : (
                <div style={{ fontWeight: 600, fontSize: 16, color: '#222' }}>
                  {job.location}
                </div>
              )}
            </div>

            <div>
              <div style={{ color: '#6c757d', fontSize: 14, marginBottom: 4 }}>Type</div>
              {isEditing ? (
                <input value={formData.type || ''} onChange={e => setFormData({ ...formData, type: e.target.value })} style={{ width: '100%', padding: 4 }} />
              ) : (
                <div style={{ fontWeight: 600, fontSize: 16, color: '#222' }}>
                  {job.type}
                </div>
              )}
            </div>

            <div>
              <div style={{ color: '#6c757d', fontSize: 14, marginBottom: 4 }}>Salary</div>
              {isEditing ? (
                <input value={formData.salary || ''} onChange={e => setFormData({ ...formData, salary: e.target.value })} style={{ width: '100%', padding: 4 }} />
              ) : (
                <div style={{ fontWeight: 600, fontSize: 16, color: '#059669' }}>
                  {job.salary || 'Not specified'}
                </div>
              )}
            </div>

            {isEditing && (
              <div>
                <div style={{ color: '#6c757d', fontSize: 14, marginBottom: 4 }}>Approved Quote ID (Manual)</div>
                <input value={formData.approvedQuoteId || ''} onChange={e => setFormData({ ...formData, approvedQuoteId: e.target.value })} style={{ width: '100%', padding: 4 }} placeholder="Enter Quote ID" />
              </div>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#6c757d', fontSize: 14, marginBottom: 4, fontWeight: 600 }}>Description</div>
            <div style={{
              padding: 16,
              background: '#f8f9fa',
              borderRadius: 8,
              border: '1px solid #e9ecef',
              fontSize: 15,
              lineHeight: 1.6
            }}>
              {job.description || job.requirements}
            </div>
          </div>

          {Array.isArray(job.skills) && job.skills.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: '#6c757d', fontSize: 14, marginBottom: 8, fontWeight: 600 }}>Skills Required</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {job.skills.map((skill, idx) => (
                  <span key={idx} style={{
                    background: '#1976d2',
                    color: '#fff',
                    borderRadius: 16,
                    padding: '6px 14px',
                    fontWeight: 500,
                    fontSize: 14
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {job.benefits && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: '#6c757d', fontSize: 14, marginBottom: 4, fontWeight: 600 }}>Benefits</div>
              <div style={{
                padding: 16,
                background: '#f8f9fa',
                borderRadius: 8,
                border: '1px solid #e9ecef',
                fontSize: 15
              }}>
                {job.benefits}
              </div>
            </div>
          )}
        </div>

        {/* Project Assistant Chat Bot - Updated to match main page style */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.3rem', color: '#222', marginBottom: 16 }}>
            Project Assistant
          </h3>

          {/* Chat messages without box styling */}
          <div style={{ marginBottom: 16 }}>
            {aiMessages.map((message, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: 16
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: '18px',
                    background: message.role === 'user' ? '#1976d2' : '#e5e7eb',
                    color: message.role === 'user' ? '#fff' : '#222',
                    fontSize: 15,
                    lineHeight: 1.5
                  }}
                >
                  {message.role === 'ai' ? (
                    <FormattedMessage text={message.text} />
                  ) : (
                    message.text
                  )}
                </div>
              </div>
            ))}
            {isBotLoading && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                marginBottom: 16
              }}>
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: '18px',
                    background: '#e5e7eb',
                    color: '#222',
                    fontSize: 15
                  }}
                >
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input area - hide when final estimate is given or when waiting for admin approval */}
          {!finalEstimateGiven && (
            <div style={{ display: 'flex', gap: 12 }}>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isQuestionsMode ? "Answer the question above..." : "Ask about this project..."}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid #b6c2d1',
                  fontSize: 15,
                  resize: 'none',
                  minHeight: 50
                }}
                disabled={isBotLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isBotLoading || (!userInput.trim() && !isQuestionsMode)}
                style={{
                  background: '#1976d2',
                  color: '#fff',
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: isBotLoading || (!userInput.trim() && !isQuestionsMode) ? 'not-allowed' : 'pointer',
                  opacity: isBotLoading || (!userInput.trim() && !isQuestionsMode) ? 0.7 : 1
                }}
              >
                {isQuestionsMode ? 'Answer' : 'Send'}
              </button>
            </div>
          )}

          {/* Show message when estimate is sent for approval */}
          {finalEstimateGiven && !estimateApproved && (
            <div style={{
              padding: '16px',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              textAlign: 'center',
              color: '#92400e'
            }}>
              ⏳ Your project estimate has been sent to admin for approval.
            </div>
          )}

          {/* Show approved message when estimate is approved */}
          {estimateApproved && (
            <div style={{
              padding: '16px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              textAlign: 'center',
              color: '#166534'
            }}>
              ✅ Approved by Admin. Final Project Cost: ${approvedEstimateData?.calculatedPrice || approvedEstimateData?.finalEstimate || 'N/A'}
            </div>
          )}

          {isQuestionsMode && (
            <div style={{
              marginTop: 12,
              color: '#6c757d',
              fontSize: 14,
              textAlign: 'center'
            }}>
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}