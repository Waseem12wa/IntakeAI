import React, { useState, useEffect } from 'react';
import { listSubmissions, getSubmission, downloadDocument, listJobs, getJob } from '../api/api';
import { useNotification } from '../context/NotificationContext';
import IntegrationManager from './IntegrationManager';
import jsPDF from 'jspdf';
import { generateN8nQuotePDF } from '../utils/n8nQuotePdfGenerator';

export default function AdminDashboard() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(''); // Keep token for API calls after authentication
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [approvedEstimate, setApprovedEstimate] = useState(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false); // New state for authentication status

  // Estimate approval states
  const [pendingEstimate, setPendingEstimate] = useState(null);
  const [loadingPendingEstimate, setLoadingPendingEstimate] = useState(false);
  const [showPriceCalculator, setShowPriceCalculator] = useState(false);
  const [priceInputs, setPriceInputs] = useState({
    estimatedWorkHours: '',
    hourlyRate: '',
    complexityFactor: '1',
    adminFee: '',
    commission: '',
    surcharges: '',
    discounts: ''
  });
  const [calculatedPrice, setCalculatedPrice] = useState('');
  const [finalApprovalReady, setFinalApprovalReady] = useState(false);
  const [processing, setProcessing] = useState(false);

  const { showGeneralNotification, showN8nApprovalNotification } = useNotification();

  const [pendingN8nReviews, setPendingN8nReviews] = useState([]);
  const [showN8nPriceModal, setShowN8nPriceModal] = useState(false);
  const [selectedN8nReview, setSelectedN8nReview] = useState(null);
  const [n8nPrice, setN8nPrice] = useState('');

  // Fetch pending n8n quote reviews
  const fetchPendingN8nReviews = async () => {
    try {
      const res = await fetch('/api/n8n-quote/pending-reviews');
      if (res.ok) {
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          setPendingN8nReviews(data.reviews || []);
        } else {
          setPendingN8nReviews([]);
        }
      }
    } catch (err) {
      console.error('Error fetching pending n8n reviews:', err);
    }
  };

  // Handle n8n quote approval
  const handleN8nQuoteApproval = async (queueId, price, nodePrices = null) => {
    try {
      const requestBody = {
        queue_id: queueId,
        reviewer_email: 'admin@intakeai.com',
        price: price,
        notes: `Price set by admin: $${price}`
      };

      // Add node prices if provided
      if (nodePrices) {
        requestBody.nodePrices = nodePrices;
      }

      const response = await fetch('/api/n8n-quote/approve-with-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();

        // Store project name BEFORE any async operations that might fail
        const projectName = selectedN8nReview?.original_request?.workflow ||
          selectedN8nReview?.original_request?.fileName ||
          selectedN8nReview?.original_request?.filename ||
          selectedN8nReview?.original_request?.file_name ||
          'n8n Workflow';

        // Show success notification FIRST - this is the critical user feedback
        showGeneralNotification(
          'n8n quote approved successfully! Price has been set.',
          'success'
        );

        // Show notification to user with project name
        showN8nApprovalNotification(projectName, queueId);

        // Update the approved estimate with the complete data if available
        if (result.approvedEstimate) {
          setApprovedEstimate(result.approvedEstimate);
        }

        // Wrap post-success operations in try-catch to prevent errors from affecting success flow
        try {
          // Refresh the pending reviews
          await fetchPendingN8nReviews();
        } catch (postApprovalError) {
          console.error('Error refreshing pending reviews:', postApprovalError);
          // Don't show error to user - the approval was successful
        }

        // Close the modal
        setShowN8nPriceModal(false);
        setSelectedN8nReview(null);
        setN8nPrice('');

        // Don't throw any errors - approval was successful
        return;
      } else {
        const text = await response.text();
        let errorMessage = 'Failed to approve n8n quote';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If parsing fails, use the raw text or default message
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('Error approving n8n quote:', err);
      showGeneralNotification(
        'Failed to approve n8n quote: ' + err.message,
        'error'
      );
    }
  };

  // Load projects and pending reviews when token is set
  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchPendingN8nReviews();
    }
  }, [isAdminAuthenticated]);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    // Hardcoded admin credentials
    const ADMIN_EMAIL = 'admin@intake.ai';
    const ADMIN_PASSWORD = 'admin1234';
    const ADMIN_TOKEN = 'changeme'; // Use the existing token for API calls

    try {
      // Validate credentials
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // Set the token for API calls
        setToken(ADMIN_TOKEN);

        // Load projects using the token
        const res = await listJobs(ADMIN_TOKEN);
        setProjects(res.jobs || []);
        setIsAdminAuthenticated(true);
      } else {
        setError('Invalid email or password.');
        setIsAdminAuthenticated(false);
      }
    } catch (err) {
      setError('Invalid credentials or server error.');
      setIsAdminAuthenticated(false);
    }
    setLoading(false);
  };

  const handleSelect = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getJob(id, token);
      setSelected(res.job);
      // Fetch approved estimate for this job
      await fetchApprovedEstimate(id);
      // Fetch pending estimate for this job
      await fetchPendingEstimate(id);
    } catch (err) {
      setError('Failed to load job.');
    }
    setLoading(false);
  };



  // Fetch pending estimate for selected job
  const fetchPendingEstimate = async (jobId) => {
    setLoadingPendingEstimate(true);
    try {
      // First check for job-specific pending estimates
      const res = await fetch('/api/estimates/admin/pending', {
        headers: {
          'x-admin-token': token
        }
      });

      if (res.ok) {
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          if (data.success) {
            // Find pending estimate for this specific job
            const jobEstimate = data.estimates.find(est =>
              est.jobId && (est.jobId._id === jobId || est.jobId === jobId)
            );
            setPendingEstimate(jobEstimate || null);
          }
        } else {
          setPendingEstimate(null);
        }
      } else {
        setPendingEstimate(null);
      }

      // Also check for n8n quote pending reviews
      const n8nRes = await fetch('/api/n8n-quote/pending-reviews');
      if (n8nRes.ok) {
        const n8nText = await n8nRes.text();
        if (n8nText) {
          const n8nData = JSON.parse(n8nText);
          // For now, we'll just log this - in a real implementation you might want to 
          // integrate this with the UI to show pending n8n quote reviews
          console.log('Pending n8n reviews:', n8nData);
        }
      }
    } catch (err) {
      console.error('Error fetching pending estimate:', err);
      setPendingEstimate(null);
    } finally {
      setLoadingPendingEstimate(false);
    }
  };

  // Calculate price using the formula
  const calculatePrice = () => {
    const {
      estimatedWorkHours,
      hourlyRate,
      complexityFactor,
      adminFee,
      commission,
      surcharges,
      discounts
    } = priceInputs;

    // Validate required fields
    if (!estimatedWorkHours || !hourlyRate) {
      setError('Please enter both Estimated Work Hours and Hourly Rate');
      return;
    }

    // Calculate: (Hours × Rate × Complexity) + Admin Fee + Commission + Surcharges - Discounts
    const basePrice = parseFloat(estimatedWorkHours) * parseFloat(hourlyRate) * parseFloat(complexityFactor);
    const additionalFees = (parseFloat(adminFee) || 0) + (parseFloat(commission) || 0) + (parseFloat(surcharges) || 0);
    const totalDiscounts = parseFloat(discounts) || 0;
    const finalPrice = basePrice + additionalFees - totalDiscounts;

    setCalculatedPrice(finalPrice.toFixed(2));
    setError(null); // Clear any previous errors
  };

  // Handle final approval with calculated price
  const handleFinalApproval = async (estimate) => {
    if (!calculatedPrice) {
      setError('Please calculate the price first before approving');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const requestBody = {
        adminNotes: `Price calculated using admin formula: $${calculatedPrice}`,
        calculatedPrice: calculatedPrice,
        priceBreakdown: {
          estimatedWorkHours: priceInputs.estimatedWorkHours,
          hourlyRate: priceInputs.hourlyRate,
          complexityFactor: priceInputs.complexityFactor,
          adminFee: priceInputs.adminFee || '0',
          commission: priceInputs.commission || '0',
          surcharges: priceInputs.surcharges || '0',
          discounts: priceInputs.discounts || '0'
        }
      };

      const response = await fetch(`/api/estimates/admin/${estimate._id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to approve estimate: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Update the approved estimate
        setApprovedEstimate(data.estimate);
        // Clear pending estimate
        setPendingEstimate(null);

        // Show success notification
        const estimateInfo = estimate.jobId?.title || 'Unknown Project';
        showGeneralNotification(
          `Request for "${estimateInfo}" has been approved with calculated price $${calculatedPrice}!`,
          'success',
          estimate.jobId?._id || estimate.jobId
        );

        // Reset calculator state
        setShowPriceCalculator(false);
        setCalculatedPrice('');
        setFinalApprovalReady(false);
        setPriceInputs({
          estimatedWorkHours: '',
          hourlyRate: '',
          complexityFactor: '1',
          adminFee: '',
          commission: '',
          surcharges: '',
          discounts: ''
        });
      } else {
        setError(data.error || 'Failed to approve estimate');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString() + ' ' +
      new Date(dateString).toLocaleTimeString();
  };

  // Fetch approved estimate for selected job
  const fetchApprovedEstimate = async (jobId) => {
    setLoadingEstimate(true);
    try {
      console.log('Fetching approved estimate for jobId:', jobId);
      const res = await fetch(`/api/estimates/approved/${jobId}`);
      console.log('API response status:', res.status);

      if (res.ok) {
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          console.log('Approved estimate data:', data);
          setApprovedEstimate(data.estimate);
        } else {
          setApprovedEstimate(null);
        }
      } else {
        const errorText = await res.text();
        console.log('API error response:', errorText);
        setApprovedEstimate(null);
      }
    } catch (err) {
      console.error('Error fetching approved estimate:', err);
      setApprovedEstimate(null);
    } finally {
      setLoadingEstimate(false);
    }
  };

  // Generate PDF with client info, project scope, and pricing breakdown
  const generateProjectPDF = () => {
    console.log('PDF Generation - Selected job:', selected);
    console.log('PDF Generation - Approved estimate:', approvedEstimate);

    if (!selected || !approvedEstimate) {
      console.error('PDF Generation failed - Missing data:', {
        selected: !!selected,
        approvedEstimate: !!approvedEstimate
      });
      return;
    }

    try {
      console.log('Starting PDF generation...');
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

      // Header
      addText('PROJECT DOCUMENT', 20, true, '#1976d2');
      yPosition += 10;
      addText(`Generated on: ${new Date().toLocaleDateString()}`, 10);
      yPosition += 15;

      // Client Information
      addText('CLIENT INFORMATION', 16, true, '#1976d2');
      yPosition += 5;
      addText(`Project Title: ${selected.title}`);
      if (selected.company) addText(`Company: ${selected.company}`);
      if (selected.location) addText(`Location: ${selected.location}`);
      if (selected.salary) addText(`Budget: ${selected.salary}`);
      yPosition += 10;

      // Project Scope & Features
      addText('PROJECT SCOPE & FEATURES', 16, true, '#1976d2');
      yPosition += 5;
      addText('Project Description:');
      addText(selected.description);

      if (selected.skills && selected.skills.length > 0) {
        yPosition += 5;
        addText('Required Skills:');
        addText(selected.skills.join(', '));
      }

      // Add AI Analysis if available - only show the AI estimate
      if (approvedEstimate.aiAnalysis && approvedEstimate.originalEstimate) {
        yPosition += 10;
        addText('AI ANALYSIS SUMMARY', 14, true, '#1976d2');
        addText(`AI Estimate: ${approvedEstimate.originalEstimate}`);
      }

      yPosition += 15;

      // Pricing Breakdown
      addText('PRICING BREAKDOWN', 16, true, '#1976d2');
      yPosition += 5;

      if (approvedEstimate.calculatedPrice) {
        addText(`Final Approved Price: $${approvedEstimate.calculatedPrice}`, 14, true, '#059669');
        yPosition += 5;

        if (approvedEstimate.priceBreakdown) {
          addText('Price Calculation Details:', 12, true);
          const breakdown = approvedEstimate.priceBreakdown;

          if (breakdown.estimatedWorkHours) {
            addText(`• Estimated Work Hours: ${breakdown.estimatedWorkHours}`);
          }
          if (breakdown.hourlyRate) {
            addText(`• Hourly Rate: $${breakdown.hourlyRate}`);
          }
          if (breakdown.complexityFactor) {
            addText(`• Complexity Factor: ${breakdown.complexityFactor}x`);
          }

          const basePrice = parseFloat(breakdown.estimatedWorkHours || 0) *
            parseFloat(breakdown.hourlyRate || 0) *
            parseFloat(breakdown.complexityFactor || 1);
          if (basePrice > 0) {
            addText(`• Base Price: $${basePrice.toFixed(2)}`);
          }

          if (breakdown.adminFee && parseFloat(breakdown.adminFee) > 0) {
            addText(`• Admin Fee: $${breakdown.adminFee}`);
          }
          if (breakdown.commission && parseFloat(breakdown.commission) > 0) {
            addText(`• Commission: $${breakdown.commission}`);
          }
          if (breakdown.surcharges && parseFloat(breakdown.surcharges) > 0) {
            addText(`• Surcharges: $${breakdown.surcharges}`);
          }
          if (breakdown.discounts && parseFloat(breakdown.discounts) > 0) {
            addText(`• Discounts: -$${breakdown.discounts}`);
          }

          yPosition += 5;
          addText('Formula: (Hours × Rate × Complexity) + Fees + Commission + Surcharges - Discounts', 10, false, '#666666');
        }
      } else {
        addText(`Original AI Estimate: ${approvedEstimate.originalEstimate}`, 14, true, '#059669');
      }

      // Add workflow data if available (for n8n quotes)
      if (approvedEstimate.workflowData) {
        yPosition += 15;
        addText('WORKFLOW DETAILS', 16, true, '#1976d2');
        yPosition += 5;

        if (approvedEstimate.workflowData.modifications) {
          addText('Custom Modifications Requested:');
          addText(approvedEstimate.workflowData.modifications);
          yPosition += 10;
        }

        if (approvedEstimate.workflowData.workflow) {
          addText('Workflow File:');
          addText(approvedEstimate.workflowData.workflow);
          yPosition += 10;
        }
      }

      if (approvedEstimate.adminNotes) {
        yPosition += 10;
        addText('Admin Notes:', 12, true);
        addText(approvedEstimate.adminNotes);
      }

      yPosition += 15;
      addText('This document serves as the official project specification and pricing agreement.', 10, false, '#666666');

      // Save the PDF
      const fileName = `${selected.title.replace(/[^a-z0-9]/gi, '_')}_project_document.pdf`;
      console.log('Saving PDF with filename:', fileName);
      doc.save(fileName);
      console.log('PDF generation completed successfully!');
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please check console for details.');
    }
  };

  return (
    <div style={{
      background: '#ffffff',
      minHeight: '100vh',
      padding: '40px 20px',
      fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
    }}>
      {/* Main Content Container */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto'
      }}>

        {/* Header Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
          padding: '30px 0'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: '#f0f9ff',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            border: '1px solid #bae6fd'
          }}>
            <span style={{ fontSize: '28px' }}>⚙️</span>
          </div>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#343541',
            margin: '0 0 12px 0'
          }}>
            Admin Dashboard
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#6b7280',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Manage and review all project postings with secure access control.
          </p>
        </div>

        {/* Main Dashboard Container */}
        <div style={{
          width: '100%',
          borderRadius: '12px',
          background: '#ffffff',
          border: '1px solid #e5e5e5',
          padding: '24px'
        }}>

          {/* Authentication Section */}
          <div style={{
            background: '#f8f9fa',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            border: '1px solid #e5e5e5'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#343541',
              margin: '0 0 16px 0'
            }}>
              🔐 Admin Login
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '2px solid #bfdbfe',
                  padding: '12px 16px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#bfdbfe';
                }}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && email && password && !loading) {
                    handleLogin();
                  }
                }}
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '2px solid #bfdbfe',
                  padding: '12px 16px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#bfdbfe';
                }}
              />
              <button
                onClick={handleLogin}
                disabled={!email || !password || loading}
                style={{
                  background: email && password && !loading ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : '#e5e7eb',
                  color: email && password && !loading ? '#ffffff' : '#9ca3af',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontWeight: 600,
                  fontSize: '16px',
                  cursor: email && password && !loading ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif'",
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  if (email && password && !loading) {
                    e.target.style.background = 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (email && password && !loading) {
                    e.target.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
                  }
                }}
              >
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #ffffff',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Logging in...
                  </div>
                ) : 'Login'}
              </button>
            </div>
            {error && (
              <div style={{
                color: '#dc2626',
                marginTop: '16px',
                padding: '12px 16px',
                background: '#fee2e2',
                borderRadius: '8px',
                border: '1px solid #fecaca',
                fontWeight: 500
              }}>
                {error}
              </div>
            )}
          </div>

          {/* Integration Manager Section */}
          {isAdminAuthenticated && (
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              border: '1px solid #e5e5e5'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#343541',
                margin: '0 0 16px 0'
              }}>
                🔗 Integration Manager
              </h3>
              <IntegrationManager />
            </div>
          )}

          {/* n8n Quote Reviews Section */}
          {isAdminAuthenticated && (
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              border: '1px solid #e5e5e5',
              maxWidth: '1200px',
              margin: '0 auto 24px auto'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#343541',
                margin: '0 0 16px 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>🔄 n8n Quote Reviews</span>
                <button
                  onClick={fetchPendingN8nReviews}
                  style={{
                    background: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontWeight: 500,
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                  onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
                >
                  🔄 Refresh
                </button>
              </h3>

              {pendingN8nReviews.length > 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {pendingN8nReviews.map(review => (
                    <div key={review.queue_id} style={{
                      background: '#ffffff',
                      borderRadius: '8px',
                      padding: '16px',
                      border: '1px solid #e5e5e5'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px'
                      }}>
                        <div>
                          <div style={{
                            fontWeight: 600,
                            color: '#343541',
                            marginBottom: '4px'
                          }}>
                            Custom Modification Request
                          </div>
                          <div style={{
                            fontSize: '14px',
                            color: '#6b7280'
                          }}>
                            Queue ID: {review.queue_id}
                          </div>
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#9ca3af',
                          background: '#f3f4f6',
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }}>
                          {formatDate(review.created_at)}
                        </div>
                      </div>

                      <div style={{
                        marginBottom: '16px',
                        fontSize: '14px',
                        color: '#343541'
                      }}>
                        <div style={{
                          fontWeight: 500,
                          marginBottom: '4px'
                        }}>
                          Modifications:
                        </div>
                        <div>
                          {review.original_request?.modifications || 'No details provided'}
                        </div>

                        {/* Display nodes requiring pricing if available */}
                        {review.generated_quote?.items && review.generated_quote.items.length > 0 && (
                          <div style={{ marginTop: '12px' }}>
                            <div style={{
                              fontWeight: 500,
                              marginBottom: '4px'
                            }}>
                              Nodes Requiring Pricing:
                            </div>
                            <div style={{
                              maxHeight: '150px',
                              overflowY: 'auto',
                              border: '1px solid #e5e5e5',
                              borderRadius: '4px',
                              padding: '8px'
                            }}>
                              {review.generated_quote.items.map((item, index) => (
                                <div key={index} style={{
                                  padding: '4px 0',
                                  borderBottom: index < review.generated_quote.items.length - 1 ? '1px solid #f0f0f0' : 'none'
                                }}>
                                  <span style={{ fontWeight: 500 }}>{item.node_label || item.node_type}</span>
                                  {' - '}
                                  <span style={{ color: item.base_price === 0 ? '#dc2626' : '#059669' }}>
                                    {item.base_price === 0 ? 'Price not set (requires manual pricing)' : `$${item.base_price.toFixed(2)}`}
                                  </span>
                                  {item.requires_manual_review && (
                                    <span style={{
                                      background: '#fef3c7',
                                      color: '#92400e',
                                      fontSize: '10px',
                                      padding: '2px 4px',
                                      borderRadius: '2px',
                                      marginLeft: '6px'
                                    }}>
                                      Manual Review
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end'
                      }}>
                        <button
                          onClick={() => {
                            setSelectedN8nReview(review);
                            setShowN8nPriceModal(true);
                          }}
                          style={{
                            background: '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 16px',
                            fontWeight: 500,
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'background 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#059669';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = '#10b981';
                          }}
                        >
                          Set Price & Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  color: '#9ca3af',
                  textAlign: 'center',
                  padding: '20px',
                  fontStyle: 'italic'
                }}>
                  No pending n8n quote reviews
                </div>
              )}
            </div>
          )}

          {/* Dashboard Content */}
          <div style={{ display: 'flex', gap: '24px', minHeight: '400px' }}>

            {/* Projects List */}
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e5e5e5'
              }}>
                <h3 style={{
                  color: '#343541',
                  fontWeight: 600,
                  marginBottom: '16px',
                  fontSize: '1.1rem'
                }}>
                  💼 Projects ({projects.length})
                </h3>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {projects.length === 0 && (
                    <div style={{
                      color: '#9ca3af',
                      textAlign: 'center',
                      padding: '40px 20px',
                      fontStyle: 'italic'
                    }}>
                      No projects found. Enter your admin token and click "Load Projects" to get started.
                    </div>
                  )}
                  {projects.map(j => (
                    <div
                      key={j._id}
                      onClick={() => handleSelect(j._id)}
                      style={{
                        width: '100%',
                        background: selected && selected._id === j._id ? '#e1f5fe' : '#ffffff',
                        color: selected && selected._id === j._id ? '#0288d1' : '#343541',
                        borderRadius: '8px',
                        padding: '12px',
                        border: selected && selected._id === j._id ? '1px solid #b3e5fc' : '1px solid #e5e5e5',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        if (!(selected && selected._id === j._id)) {
                          e.target.style.background = '#f8f9fa';
                          e.target.style.borderColor = '#10a37f';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!(selected && selected._id === j._id)) {
                          e.target.style.background = '#ffffff';
                          e.target.style.borderColor = '#e5e5e5';
                        }
                      }}
                    >
                      <div style={{
                        fontWeight: 600,
                        marginBottom: '4px',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word'
                      }}>
                        {j.title} - {j.company}
                      </div>
                      <div style={{
                        color: selected && selected._id === j._id ? '#0288d1' : '#6b7280',
                        fontSize: '12px'
                      }}>
                        {new Date(j.postedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div style={{ flex: 2, minWidth: '400px' }}>
              {selected ? (
                <div style={{
                  background: '#f8f9fa',
                  borderRadius: '12px',
                  padding: '24px',
                  border: '1px solid #e5e5e5'
                }}>
                  <h3 style={{
                    color: '#343541',
                    fontWeight: 600,
                    marginBottom: '20px',
                    fontSize: '1.25rem'
                  }}>
                    💼 Project Details
                  </h3>

                  {/* Project Data */}
                  <div style={{
                    background: '#ffffff',
                    color: '#343541',
                    padding: '20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    marginBottom: '24px',
                    border: '1px solid #e5e5e5',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6'
                  }}>
                    <div><strong>Title:</strong> {selected.title}</div>
                    <div><strong>Company:</strong> {selected.company}</div>
                    <div><strong>Location:</strong> {selected.location}</div>
                    <div><strong>Type:</strong> {selected.type}</div>
                    <div><strong>Salary:</strong> {selected.salary || 'Not specified'}</div>
                    <div><strong>Description:</strong> {selected.description}</div>
                    <div><strong>Requirements:</strong> {selected.requirements || 'Not specified'}</div>
                    <div><strong>Skills:</strong> {selected.skills?.join(', ') || 'Not specified'}</div>
                    <div><strong>Remote:</strong> {selected.remote || 'Not specified'}</div>
                    <div><strong>Experience:</strong> {selected.experience || 'Not specified'}</div>
                  </div>

                  {/* Project Document Section */}
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '8px',
                    padding: '20px',
                    border: '1px solid #e5e5e5',
                    marginBottom: '20px'
                  }}>
                    <h4 style={{
                      color: '#343541',
                      fontWeight: 600,
                      marginBottom: '16px',
                      fontSize: '16px'
                    }}>
                      📄 Project Document
                    </h4>

                    {loadingEstimate ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#10a37f',
                        fontWeight: 500
                      }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid #10a37f',
                          borderTop: '2px solid transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                        Loading estimate data...
                      </div>
                    ) : approvedEstimate ? (
                      <div>
                        <div style={{
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          borderRadius: '8px',
                          padding: '12px',
                          marginBottom: '16px'
                        }}>
                          <div style={{ color: '#1e40af', fontWeight: 600, marginBottom: '8px' }}>
                            ✅ Approved Estimate Available
                          </div>
                          <div style={{ color: '#2563eb', fontSize: '14px' }}>
                            Price: <strong>${approvedEstimate.calculatedPrice || approvedEstimate.originalEstimate}</strong>
                          </div>
                          {approvedEstimate.adminNotes && (
                            <div style={{ color: '#2563eb', fontSize: '12px', marginTop: '4px' }}>
                              Notes: {approvedEstimate.adminNotes}
                            </div>
                          )}
                          {/* Display workflow details for n8n quotes */}
                          {approvedEstimate.workflowData && (
                            <div style={{ marginTop: '8px' }}>
                              <div style={{ color: '#1e40af', fontSize: '12px', fontWeight: 500 }}>
                                Workflow Details:
                              </div>
                              {approvedEstimate.workflowData.modifications && (
                                <div style={{ color: '#2563eb', fontSize: '12px', marginTop: '2px' }}>
                                  Modifications: {approvedEstimate.workflowData.modifications}
                                </div>
                              )}
                              {approvedEstimate.workflowData.workflow && (
                                <div style={{ color: '#2563eb', fontSize: '12px', marginTop: '2px' }}>
                                  File: {approvedEstimate.workflowData.workflow}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={generateProjectPDF}
                            style={{
                              background: '#0ea5e9',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '12px 20px',
                              fontWeight: 600,
                              fontSize: '14px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#0284c7';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = '#0ea5e9';
                            }}
                          >
                            📥 Download Project PDF
                          </button>

                          <button
                            onClick={() => {
                              console.log('=== DEBUG DATA ===');
                              console.log('Selected job:', selected);
                              console.log('Approved estimate:', approvedEstimate);
                              alert('Check browser console for debug data');
                            }}
                            style={{
                              background: '#6366f1',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '12px 20px',
                              fontWeight: 600,
                              fontSize: '14px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#4f46e5';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = '#6366f1';
                            }}
                          >
                            🔍 Debug Data
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderRadius: '8px',
                        padding: '12px',
                        color: '#b45309',
                        fontSize: '14px'
                      }}>
                        ⚠️ No approved estimate found for this project. Please approve an estimate first to generate the project document.
                      </div>
                    )}
                  </div>

                  {/* Estimate Approval Section - Inline */}
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '8px',
                    padding: '20px',
                    border: '1px solid #e5e5e5',
                    marginBottom: '20px'
                  }}>
                    <h4 style={{
                      color: '#343541',
                      fontWeight: 600,
                      marginBottom: '16px',
                      fontSize: '16px'
                    }}>
                      ⚙️ Estimate Management
                    </h4>

                    {loadingPendingEstimate ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#10a37f',
                        fontWeight: 500
                      }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid #10a37f',
                          borderTop: '2px solid transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                        Loading estimate data...
                      </div>
                    ) : pendingEstimate ? (
                      <div>
                        {/* Price Calculator Section */}
                        {showPriceCalculator ? (
                          <div style={{
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '8px',
                            padding: '20px',
                            marginBottom: '16px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                background: '#10b981',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '12px'
                              }}>
                                <span style={{ color: 'white', fontSize: '16px' }}>💰</span>
                              </div>
                              <h4 style={{ fontWeight: 'bold', color: '#343541', fontSize: '16px', margin: 0 }}>Admin Price Calculator</h4>
                            </div>

                            {/* Input Grid */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                              gap: '12px',
                              marginBottom: '16px'
                            }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#343541', marginBottom: '4px' }}>Estimated Work Hours</label>
                                <input
                                  type="number"
                                  value={priceInputs.estimatedWorkHours}
                                  onChange={(e) => setPriceInputs(prev => ({ ...prev, estimatedWorkHours: e.target.value }))}
                                  style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #e5e5e5',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                  }}
                                  placeholder="e.g., 40"
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#343541', marginBottom: '4px' }}>Hourly Rate ($)</label>
                                <input
                                  type="number"
                                  value={priceInputs.hourlyRate}
                                  onChange={(e) => setPriceInputs(prev => ({ ...prev, hourlyRate: e.target.value }))}
                                  style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #e5e5e5',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                  }}
                                  placeholder="e.g., 75"
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#343541', marginBottom: '4px' }}>Complexity Factor</label>
                                <select
                                  value={priceInputs.complexityFactor}
                                  onChange={(e) => setPriceInputs(prev => ({ ...prev, complexityFactor: e.target.value }))}
                                  style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #e5e5e5',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                  }}
                                >
                                  <option value="0.8">Simple (0.8x)</option>
                                  <option value="1">Standard (1.0x)</option>
                                  <option value="1.2">Complex (1.2x)</option>
                                  <option value="1.5">Very Complex (1.5x)</option>
                                </select>
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#343541', marginBottom: '4px' }}>Admin Fee ($)</label>
                                <input
                                  type="number"
                                  value={priceInputs.adminFee}
                                  onChange={(e) => setPriceInputs(prev => ({ ...prev, adminFee: e.target.value }))}
                                  style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #e5e5e5',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                  }}
                                  placeholder="e.g., 500"
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#343541', marginBottom: '4px' }}>Commission ($)</label>
                                <input
                                  type="number"
                                  value={priceInputs.commission}
                                  onChange={(e) => setPriceInputs(prev => ({ ...prev, commission: e.target.value }))}
                                  style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #e5e5e5',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                  }}
                                  placeholder="e.g., 200"
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#343541', marginBottom: '4px' }}>Surcharges ($)</label>
                                <input
                                  type="number"
                                  value={priceInputs.surcharges}
                                  onChange={(e) => setPriceInputs(prev => ({ ...prev, surcharges: e.target.value }))}
                                  style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #e5e5e5',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                  }}
                                  placeholder="e.g., 100"
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#343541', marginBottom: '4px' }}>Discounts ($)</label>
                                <input
                                  type="number"
                                  value={priceInputs.discounts}
                                  onChange={(e) => setPriceInputs(prev => ({ ...prev, discounts: e.target.value }))}
                                  style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #e5e5e5',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                  }}
                                  placeholder="e.g., 50"
                                />
                              </div>
                            </div>

                            {/* Calculate Button */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <button
                                onClick={calculatePrice}
                                disabled={!priceInputs.estimatedWorkHours || !priceInputs.hourlyRate}
                                style={{
                                  background: (!priceInputs.estimatedWorkHours || !priceInputs.hourlyRate) ? '#e5e7eb' : '#10b981',
                                  color: (!priceInputs.estimatedWorkHours || !priceInputs.hourlyRate) ? '#9ca3af' : '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '10px 20px',
                                  fontWeight: 600,
                                  fontSize: '14px',
                                  cursor: (!priceInputs.estimatedWorkHours || !priceInputs.hourlyRate) ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  if (priceInputs.estimatedWorkHours && priceInputs.hourlyRate) {
                                    e.target.style.background = '#059669';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (priceInputs.estimatedWorkHours && priceInputs.hourlyRate) {
                                    e.target.style.background = '#10b981';
                                  }
                                }}
                              >
                                Calculate Price
                              </button>

                              {calculatedPrice && (
                                <div style={{
                                  fontSize: '18px',
                                  fontWeight: 'bold',
                                  color: '#059669'
                                }}>
                                  Calculated Price: ${calculatedPrice}
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'flex-end',
                              gap: '12px',
                              marginTop: '20px'
                            }}>
                              <button
                                onClick={() => setShowPriceCalculator(false)}
                                style={{
                                  background: '#f3f4f6',
                                  color: '#374151',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  padding: '10px 20px',
                                  fontWeight: 500,
                                  fontSize: '14px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = '#e5e7eb';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = '#f3f4f6';
                                }}
                              >
                                Cancel
                              </button>

                              <button
                                onClick={() => {
                                  if (calculatedPrice && pendingEstimate) {
                                    handleFinalApproval(pendingEstimate);
                                  }
                                }}
                                disabled={!calculatedPrice || processing}
                                style={{
                                  background: (!calculatedPrice || processing) ? '#e5e7eb' : '#3b82f6',
                                  color: (!calculatedPrice || processing) ? '#9ca3af' : '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '10px 20px',
                                  fontWeight: 600,
                                  fontSize: '14px',
                                  cursor: (!calculatedPrice || processing) ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px'
                                }}
                                onMouseEnter={(e) => {
                                  if (calculatedPrice && !processing) {
                                    e.target.style.background = '#2563eb';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (calculatedPrice && !processing) {
                                    e.target.style.background = '#3b82f6';
                                  }
                                }}
                              >
                                {processing ? (
                                  <>
                                    <div style={{
                                      width: '14px',
                                      height: '14px',
                                      border: '2px solid white',
                                      borderTop: '2px solid transparent',
                                      borderRadius: '50%',
                                      animation: 'spin 1s linear infinite'
                                    }}></div>
                                    Processing...
                                  </>
                                ) : (
                                  'Set Price & Approve'
                                )}
                              </button>
                            </div>
                          </div>
                        ) : finalApprovalReady ? (
                          <div style={{
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '8px',
                            padding: '20px',
                            marginBottom: '16px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                background: '#3b82f6',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '12px'
                              }}>
                                <span style={{ color: 'white', fontSize: '16px' }}>✅</span>
                              </div>
                              <h4 style={{ fontWeight: 'bold', color: '#343541', fontSize: '16px', margin: 0 }}>Confirm Approval</h4>
                            </div>

                            <p style={{ color: '#374151', marginBottom: '16px' }}>
                              You are about to approve this estimate with a final price of <strong>${calculatedPrice}</strong>.
                              This action cannot be undone.
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                              <button
                                onClick={() => setFinalApprovalReady(false)}
                                disabled={processing}
                                style={{
                                  background: '#f3f4f6',
                                  color: '#374151',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  padding: '10px 20px',
                                  fontWeight: 500,
                                  fontSize: '14px',
                                  cursor: processing ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  if (!processing) {
                                    e.target.style.background = '#e5e7eb';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!processing) {
                                    e.target.style.background = '#f3f4f6';
                                  }
                                }}
                              >
                                Cancel
                              </button>

                              <button
                                onClick={() => handleFinalApproval(pendingEstimate)}
                                disabled={processing}
                                style={{
                                  background: processing ? '#93c5fd' : '#3b82f6',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '10px 20px',
                                  fontWeight: 600,
                                  fontSize: '14px',
                                  cursor: processing ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}
                                onMouseEnter={(e) => {
                                  if (!processing) {
                                    e.target.style.background = '#2563eb';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!processing) {
                                    e.target.style.background = '#3b82f6';
                                  }
                                }}
                              >
                                {processing ? (
                                  <>
                                    <div style={{
                                      width: '16px',
                                      height: '16px',
                                      border: '2px solid #ffffff',
                                      borderTop: '2px solid transparent',
                                      borderRadius: '50%',
                                      animation: 'spin 1s linear infinite'
                                    }}></div>
                                    Processing...
                                  </>
                                ) : (
                                  'Confirm Approval'
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '8px',
                            padding: '20px',
                            marginBottom: '16px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                background: '#f59e0b',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '12px'
                              }}>
                                <span style={{ color: 'white', fontSize: '16px' }}>⚠️</span>
                              </div>
                              <h4 style={{ fontWeight: 'bold', color: '#343541', fontSize: '16px', margin: 0 }}>Pending Estimate Approval</h4>
                            </div>

                            <p style={{ color: '#374151', marginBottom: '16px' }}>
                              This project has a pending estimate that requires your approval.
                              You can calculate a custom price using our pricing calculator.
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => setShowPriceCalculator(true)}
                                style={{
                                  background: '#f59e0b',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '10px 20px',
                                  fontWeight: 600,
                                  fontSize: '14px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = '#d97706';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = '#f59e0b';
                                }}
                              >
                                Open Price Calculator
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{
                        background: '#f3f4f6',
                        border: '1px solid #e5e5e5',
                        borderRadius: '8px',
                        padding: '20px',
                        textAlign: 'center',
                        color: '#6b7280'
                      }}>
                        No pending estimates for this project.
                      </div>
                    )}
                  </div>

                  {/* n8n Quote Reviews Section - ADDED HERE */}
                  {isAdminAuthenticated && selected && selected._id && selected._id.startsWith('n8n-') && pendingN8nReviews && pendingN8nReviews.length > 0 && (
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '8px',
                      padding: '20px',
                      border: '1px solid #e5e5e5',
                      marginBottom: '20px'
                    }}>
                      <h4 style={{
                        color: '#343541',
                        fontWeight: 600,
                        marginBottom: '16px',
                        fontSize: '16px'
                      }}>
                        🔄 n8n Custom Modifications
                      </h4>

                      {/* Extract queue ID from project ID (format: n8n-{queue_id}) */}
                      {(() => {
                        const queueId = selected._id.substring(4); // Remove "n8n-" prefix
                        const relevantReview = pendingN8nReviews.find(review => review.queue_id === queueId);

                        return relevantReview ? (
                          <div key={relevantReview.queue_id} style={{
                            background: '#f8f9fa',
                            borderRadius: '8px',
                            padding: '16px',
                            border: '1px solid #e5e5e5'
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '12px'
                            }}>
                              <div>
                                <div style={{
                                  fontWeight: 600,
                                  color: '#343541',
                                  marginBottom: '4px'
                                }}>
                                  Custom Modification Request
                                </div>
                                <div style={{
                                  fontSize: '14px',
                                  color: '#6b7280'
                                }}>
                                  Queue ID: {relevantReview.queue_id}
                                </div>
                              </div>
                              <div style={{
                                fontSize: '12px',
                                color: '#9ca3af',
                                background: '#f3f4f6',
                                padding: '4px 8px',
                                borderRadius: '4px'
                              }}>
                                {formatDate(relevantReview.created_at)}
                              </div>
                            </div>

                            <div style={{
                              marginBottom: '16px',
                              fontSize: '14px',
                              color: '#343541'
                            }}>
                              <div style={{
                                fontWeight: 500,
                                marginBottom: '4px'
                              }}>
                                Modifications:
                              </div>
                              <div>
                                {relevantReview.original_request?.modifications || 'No details provided'}
                              </div>

                              {/* Display nodes requiring pricing if available */}
                              {relevantReview.generated_quote?.items && relevantReview.generated_quote.items.length > 0 && (
                                <div style={{ marginTop: '12px' }}>
                                  <div style={{
                                    fontWeight: 500,
                                    marginBottom: '4px'
                                  }}>
                                    Nodes Requiring Pricing:
                                  </div>
                                  <div style={{
                                    maxHeight: '150px',
                                    overflowY: 'auto',
                                    border: '1px solid #e5e5e5',
                                    borderRadius: '4px',
                                    padding: '8px'
                                  }}>
                                    {relevantReview.generated_quote.items.map((item, index) => (
                                      <div key={index} style={{
                                        padding: '4px 0',
                                        borderBottom: index < relevantReview.generated_quote.items.length - 1 ? '1px solid #f0f0f0' : 'none'
                                      }}>
                                        <span style={{ fontWeight: 500 }}>{item.node_label || item.node_type}</span>
                                        {' - '}
                                        <span style={{ color: item.base_price === 0 ? '#dc2626' : '#059669' }}>
                                          {item.base_price === 0 ? 'Price not set (requires manual pricing)' : `$${item.base_price.toFixed(2)}`}
                                        </span>
                                        {item.requires_manual_review && (
                                          <span style={{
                                            background: '#fef3c7',
                                            color: '#92400e',
                                            fontSize: '10px',
                                            padding: '2px 4px',
                                            borderRadius: '2px',
                                            marginLeft: '6px'
                                          }}>
                                            Manual Review
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div style={{
                              display: 'flex',
                              justifyContent: 'flex-end'
                            }}>
                              <button
                                onClick={() => {
                                  setSelectedN8nReview(relevantReview);
                                  setShowN8nPriceModal(true);
                                }}
                                style={{
                                  background: '#10b981',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '8px 16px',
                                  fontWeight: 500,
                                  fontSize: '14px',
                                  cursor: 'pointer',
                                  transition: 'background 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = '#059669';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = '#10b981';
                                }}
                              >
                                Set Price & Approve
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{
                            color: '#9ca3af',
                            textAlign: 'center',
                            padding: '20px',
                            fontStyle: 'italic'
                          }}>
                            No pending n8n quote reviews for this project
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  background: '#f8f9fa',
                  borderRadius: '12px',
                  padding: '40px 20px',
                  border: '1px solid #e5e5e5',
                  textAlign: 'center',
                  color: '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  Select a project to view details
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* n8n Price Modal */}
      {showN8nPriceModal && selectedN8nReview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          overflow: 'auto',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '30px',
            width: '500px',
            maxWidth: '90%',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#343541',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              Set Price for Custom Modification
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontWeight: 500,
                color: '#343541',
                marginBottom: '8px'
              }}>
                Custom Modification Request:
              </div>
              <div style={{
                color: '#6b7280',
                fontSize: '14px',
                marginBottom: '16px',
                padding: '12px',
                background: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e5e5e5'
              }}>
                {selectedN8nReview.original_request?.modifications || 'No modification details provided'}
              </div>

              {/* Display nodes requiring pricing if available */}
              {selectedN8nReview.generated_quote?.items && selectedN8nReview.generated_quote.items.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    fontWeight: 500,
                    color: '#343541',
                    marginBottom: '8px'
                  }}>
                    Workflow Nodes ({selectedN8nReview.generated_quote.items.length}):
                  </div>
                  <div style={{
                    maxHeight: '250px',
                    overflowY: 'auto',
                    border: '1px solid #e5e5e5',
                    borderRadius: '4px',
                    padding: '8px',
                    fontSize: '13px'
                  }}>
                    {selectedN8nReview.generated_quote.items.map((item, index) => (
                      <div key={index} style={{
                        padding: '8px 0',
                        borderBottom: index < selectedN8nReview.generated_quote.items.length - 1 ? '1px solid #f0f0f0' : 'none'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontWeight: 500 }}>{item.node_label || item.node_type}</span>
                            {item.requires_manual_review && (
                              <span style={{
                                background: '#fef3c7',
                                color: '#92400e',
                                fontSize: '10px',
                                padding: '2px 4px',
                                borderRadius: '2px',
                                marginLeft: '6px'
                              }}>
                                Manual Review
                              </span>
                            )}
                          </div>
                          <div>
                            {item.base_price === 0 ? (
                              <input
                                type="number"
                                value={item.tempPrice || ''}
                                onChange={(e) => {
                                  // Update the tempPrice in the selectedN8nReview state
                                  const updatedItems = [...selectedN8nReview.generated_quote.items];
                                  updatedItems[index].tempPrice = e.target.value;
                                  setSelectedN8nReview({
                                    ...selectedN8nReview,
                                    generated_quote: {
                                      ...selectedN8nReview.generated_quote,
                                      items: updatedItems
                                    }
                                  });
                                }}
                                style={{
                                  width: '80px',
                                  padding: '4px',
                                  borderRadius: '4px',
                                  border: '1px solid #d1d5db',
                                  fontSize: '12px',
                                  boxSizing: 'border-box'
                                }}
                                placeholder="Price"
                                step="0.01"
                                min="0"
                              />
                            ) : (
                              <span style={{ color: '#059669' }}>
                                ${item.base_price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        {item.base_price === 0 && (
                          <div style={{
                            color: '#dc2626',
                            fontSize: '11px',
                            marginTop: '4px'
                          }}>
                            Price not set (requires manual pricing)
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  setShowN8nPriceModal(false);
                  setSelectedN8nReview(null);
                  setN8nPrice('');
                }}
                style={{
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontWeight: 500,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f3f4f6';
                }}
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  // Calculate total price from individual node prices
                  let totalPrice = 0;
                  let allPricesSet = true;
                  const nodePrices = {};
                  const missingPrices = [];

                  if (selectedN8nReview.generated_quote?.items) {
                    selectedN8nReview.generated_quote.items.forEach(item => {
                      if (item.base_price === 0) {
                        if (item.tempPrice && parseFloat(item.tempPrice) > 0) {
                          totalPrice += parseFloat(item.tempPrice);
                          // Store the node price using a unique identifier
                          const nodeId = item.node_id || item.nodeId || item.node_label || item.node_type;
                          if (nodeId) {
                            nodePrices[nodeId] = parseFloat(item.tempPrice);
                          }
                        } else {
                          allPricesSet = false;
                          missingPrices.push(item.node_label || item.node_type);
                        }
                      } else {
                        totalPrice += item.base_price;
                        // Store existing prices too
                        const nodeId = item.node_id || item.nodeId || item.node_label || item.node_type;
                        if (nodeId) {
                          nodePrices[nodeId] = item.base_price;
                        }
                      }
                    });
                  }

                  if (!allPricesSet) {
                    setError(`Please set prices for all nodes. Missing: ${missingPrices.join(', ')}`);
                    return;
                  }

                  if (totalPrice <= 0) {
                    setError('Total price must be greater than 0');
                    return;
                  }

                  try {
                    setProcessing(true);
                    setError(null);
                    await handleN8nQuoteApproval(selectedN8nReview.queue_id, totalPrice.toFixed(2), nodePrices);
                    // Close modal on success
                    setShowN8nPriceModal(false);
                    setSelectedN8nReview(null);
                  } catch (err) {
                    setError('Failed to approve quote: ' + err.message);
                  } finally {
                    setProcessing(false);
                  }
                }}
                disabled={processing}
                style={{
                  background: processing ? '#9ca3af' : '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: processing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (!processing) {
                    e.target.style.background = '#059669';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!processing) {
                    e.target.style.background = '#10b981';
                  }
                }}
              >
                {processing ? (
                  <>
                    <div style={{
                      width: '14px',
                      height: '14px',
                      border: '2px solid white',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Processing...
                  </>
                ) : (
                  'Set Prices & Approve'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}