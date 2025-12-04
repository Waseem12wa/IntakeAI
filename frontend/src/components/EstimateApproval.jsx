import React, { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';

// Receive token as a prop from AdminDashboard
export default function EstimateApproval({ token }) { 
  const [pendingEstimates, setPendingEstimates] = useState([]);
  const [approvedEstimates, setApprovedEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  // Use global notification context
  const { showGeneralNotification } = useNotification();
  
  // Price calculation states
  const [showPriceCalculator, setShowPriceCalculator] = useState(null); // holds estimate ID
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

  // Fetch pending estimates only when a valid token is provided
  useEffect(() => {
    if (token) {
      fetchEstimates();
    } else {
        setPendingEstimates([]); // Clear estimates if token is removed
        setApprovedEstimates([]);
        setLoading(false);
    }
  }, [token]); // Re-run effect when token changes

  const fetchEstimates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch pending estimates
      const pendingResponse = await fetch('/api/estimates/admin/pending', {
        headers: {
          'x-admin-token': token // Use correct header format
        }
      });
      
      if (!pendingResponse.ok) {
        throw new Error('Failed to authenticate or server error.');
      }

      const pendingData = await pendingResponse.json();
      
      if (pendingData.success) {
        setPendingEstimates(pendingData.estimates);
      } else {
        setError(pendingData.error || 'Failed to load pending estimates');
      }

      // Fetch approved estimates
      const approvedResponse = await fetch('/api/estimates/admin/approved', {
        headers: {
          'x-admin-token': token
        }
      });
      
      if (approvedResponse.ok) {
        const approvedData = await approvedResponse.json();
        if (approvedData.success) {
          setApprovedEstimates(approvedData.estimates);
        }
      }
      
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
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
    console.log('🚀 Starting approval process for estimate:', estimate._id);
    console.log('📊 Calculated price:', calculatedPrice);
    console.log('📝 Price inputs:', priceInputs);
    
    if (!calculatedPrice) {
      setError('Please calculate the price first before approving');
      return;
    }

    try {
      setProcessing(true);
      setError(null); // Clear any previous errors
      
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
      
      console.log('📤 Sending approval request:', requestBody);
      
      const response = await fetch(`/api/estimates/admin/${estimate._id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Failed to approve estimate: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Approval response:', data);

      if (data.success) {
        // Remove the processed estimate from the pending list
        setPendingEstimates(prev => prev.filter(est => est._id !== estimate._id));
        
        // Add the approved estimate to the approved list
        setApprovedEstimates(prev => [data.estimate, ...prev]);
        
        // Show success notification using global context
        const estimateInfo = estimate.jobId?.title || 'Unknown Project';
        showGeneralNotification(
          `Request for "${estimateInfo}" has been approved with calculated price $${calculatedPrice}!`,
          'success',
          estimate.jobId?._id || estimate.jobId
        );
        
        console.log('🎉 Estimate approved successfully!');
        
        // Reset calculator state
        setShowPriceCalculator(null);
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
        console.error('❌ Server returned error:', data.error);
        setError(data.error || 'Failed to approve estimate');
      }
    } catch (err) {
      console.error('💥 Approval error:', err);
      setError('Network error: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString() + ' ' + 
               new Date(dateString).toLocaleTimeString();
    };

    const cleanText = (text) => {
        if (!text) return '';
        return text
          .replace(/\*\*([^*]+)\*\*/g, '$1')
          .replace(/## Step \d+:\s*/g, '')
          .replace(/##\s+/g, '')
          .replace(/# /g, '')
          .trim();
    };


  if (loading) {
    return <div className="text-center p-6">Loading pending estimates...</div>;
  }
  
  // Render nothing or a message if there is no token
  if (!token) {
    return (
        <div className="bg-gray-100 p-6 rounded-lg text-center">
            <p className="text-gray-600">Please enter your admin token to manage estimates.</p>
        </div>
    );
  }

  return (
    <>
      
      <div style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
        padding: '16px',
        borderRadius: '16px',
        boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.1), 0 4px 6px -2px rgba(59, 130, 246, 0.05)',
        border: '2px solid #bfdbfe',
        width: '100%',
        margin: '60px 0 0 0',
        marginTop: '60px'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '16px', textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}>
            <span style={{ fontSize: '20px', color: 'white' }}>⚙️</span>
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '6px'
          }}>
            Estimate Approvals
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Review and approve AI-generated project estimates</p>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            marginBottom: '32px',
            padding: '24px',
            background: 'linear-gradient(135deg, #fef2f2 0%, #fce7e6 100%)',
            border: '2px solid #fca5a5',
            color: '#991b1b',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '24px', marginRight: '12px' }}>⚠️</span>
              <div>
                <div style={{ fontWeight: '600', fontSize: '18px' }}>Error</div>
                <div style={{ color: '#b91c1c' }}>{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Stats cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {/* Pending Stats */}
          <div style={{
            padding: '16px',
            background: 'linear-gradient(135deg, #ffffff 0%, #dbeafe 100%)',
            borderRadius: '10px',
            boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1), 0 2px 4px -1px rgba(59, 130, 246, 0.06)',
            border: '2px solid #bfdbfe'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#1e40af',
                  marginBottom: '4px'
                }}>
                  {pendingEstimates.length}
                </div>
                <div style={{ color: '#3b82f6', fontSize: '14px', fontWeight: '500' }}>Pending Review</div>
                <div style={{
                  width: '30px',
                  height: '2px',
                  background: '#3b82f6',
                  borderRadius: '2px',
                  margin: '6px auto 0'
                }}></div>
              </div>
            </div>
          </div>
          
          {/* Approved Stats */}
          <div style={{
            padding: '16px',
            background: 'linear-gradient(135deg, #ffffff 0%, #dbeafe 100%)',
            borderRadius: '10px',
            boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1), 0 2px 4px -1px rgba(59, 130, 246, 0.06)',
            border: '2px solid #bfdbfe'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#1e40af',
                  marginBottom: '4px'
                }}>
                  {approvedEstimates.length}
                </div>
                <div style={{ color: '#3b82f6', fontSize: '14px', fontWeight: '500' }}>Completed</div>
                <div style={{
                  width: '30px',
                  height: '2px',
                  background: '#3b82f6',
                  borderRadius: '2px',
                  margin: '6px auto 0'
                }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Two Section Layout */}
        <div style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'flex-start'
        }}>
          
          {/* Pending Estimates Section */}
          <div style={{
            flex: 1,
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1)',
            border: '2px solid #bfdbfe',
            overflow: 'hidden'
          }}>
            {/* Pending Header */}
            <div style={{
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              padding: '20px',
              borderBottom: '2px solid #93c5fd'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
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
                  <span style={{ color: 'white', fontSize: '16px' }}>⏳</span>
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e40af', margin: 0 }}>Pending Estimates</h3>
                  <p style={{ color: '#3b82f6', fontSize: '14px', margin: '2px 0 0 0' }}>Awaiting admin review and approval</p>
                </div>
              </div>
            </div>
            
            {/* Pending Content */}
            <div style={{ padding: '20px', maxHeight: '600px', overflowY: 'auto' }}>
              {pendingEstimates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: '#dbeafe',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <span style={{ fontSize: '24px', color: '#3b82f6' }}>📋</span>
                  </div>
                  <div style={{ color: '#1e40af', fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>No pending estimates</div>
                  <p style={{ color: '#3b82f6' }}>All estimates have been reviewed</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Render pending estimates with full calculator UI */}
                  {pendingEstimates.map((estimate) => (
                    <div key={estimate._id} style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
                      overflow: 'hidden',
                      border: '1px solid #f1f5f9',
                      transition: 'all 0.3s ease'
                    }}>
                      {/* Keep the existing detailed estimate card UI for pending items */}
                      {/* This will include the full calculator, company info, etc. */}
                      <div key={estimate._id} style={{
                        background: '#ffffff',
                        borderRadius: '12px',
                        boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
                        overflow: 'hidden',
                        border: '1px solid #f1f5f9',
                        transition: 'all 0.3s ease'
                      }}>
                        {/* Header Card */}
                        <div style={{
                          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                          padding: '16px',
                          borderBottom: '1px solid #f1f5f9'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '12px',
                                boxShadow: '0 2px 4px -1px rgba(59, 130, 246, 0.3)'
                              }}>
                                <span style={{ color: 'white', fontSize: '16px' }}>🎯</span>
                              </div>
                              <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                                  {estimate.jobId?.title || 'Unknown Project'}
                                </h3>
                                <p style={{ color: '#64748b', fontSize: '12px', marginTop: '2px', margin: 0 }}>
                                  Project Estimation • Submitted {formatDate(estimate.createdAt)}
                                </p>
                              </div>
                            </div>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '4px 8px',
                              borderRadius: '9999px',
                              fontSize: '10px',
                              fontWeight: '600',
                              background: '#fef3c7',
                              color: '#d97706',
                              border: '1px solid #fcd34d'
                            }}>
                              <span style={{
                                width: '6px',
                                height: '6px',
                                background: '#f59e0b',
                                borderRadius: '50%',
                                marginRight: '6px',
                                animation: 'pulse 2s infinite'
                              }}></span>
                              {estimate.status}
                            </span>
                          </div>
                        </div>

                        {/* Content Cards Grid */}
                        <div style={{ padding: '16px' }}>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: '12px',
                            marginBottom: '16px'
                          }}>
                            {/* Company Info Card */}
                            <div style={{
                              background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
                              borderRadius: '8px',
                              padding: '12px',
                              border: '1px solid #e5e7eb'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{
                                  width: '24px',
                                  height: '24px',
                                  background: '#dbeafe',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginRight: '8px'
                                }}>
                                  <span style={{ color: '#2563eb', fontSize: '12px' }}>🏢</span>
                                </div>
                                <h4 style={{ fontWeight: '600', color: '#1f2937', fontSize: '12px', margin: 0 }}>Company Details</h4>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', color: '#374151', fontSize: '12px' }}>
                                  <span style={{ width: '12px', color: '#9ca3af' }}>•</span>
                                  <span style={{ marginLeft: '6px', fontWeight: '500' }}>{estimate.jobId?.company || 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', color: '#374151', fontSize: '12px' }}>
                                  <span style={{ width: '12px', color: '#9ca3af' }}>📍</span>
                                  <span style={{ marginLeft: '6px' }}>{estimate.jobId?.location || 'N/A'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Contact Info Card */}
                            <div style={{
                              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                              borderRadius: '8px',
                              padding: '12px',
                              border: '1px solid #bbf7d0'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{
                                  width: '24px',
                                  height: '24px',
                                  background: '#dcfce7',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginRight: '8px'
                                }}>
                                  <span style={{ color: '#16a34a', fontSize: '12px' }}>📧</span>
                                </div>
                                <h4 style={{ fontWeight: '600', color: '#1f2937', fontSize: '12px', margin: 0 }}>Contact Information</h4>
                              </div>
                              <div style={{ fontSize: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', color: '#374151' }}>
                                  <span style={{ width: '12px', color: '#16a34a' }}>@</span>
                                  <span style={{ marginLeft: '6px', fontFamily: 'monospace', color: '#15803d' }}>
                                    {estimate.jobId?.email || 'No email provided'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Status Card */}
                            <div style={{
                              background: 'linear-gradient(135deg, #fdf4ff 0%, #f3e8ff 100%)',
                              borderRadius: '8px',
                              padding: '12px',
                              border: '1px solid #e9d5ff'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{
                                  width: '24px',
                                  height: '24px',
                                  background: '#f3e8ff',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginRight: '8px'
                                }}>
                                  <span style={{ color: '#9333ea', fontSize: '12px' }}>⏱️</span>
                                </div>
                                <h4 style={{ fontWeight: '600', color: '#1f2937', fontSize: '12px', margin: 0 }}>Timeline</h4>
                              </div>
                              <div style={{ fontSize: '12px', color: '#374151' }}>
                                <div style={{ fontWeight: '500' }}>{formatDate(estimate.createdAt)}</div>
                                <div style={{ color: '#6b7280', marginTop: '2px' }}>Awaiting Review</div>
                              </div>
                            </div>
                          </div>

                          {/* AI Estimate Card */}
                          <div style={{
                            background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                            borderRadius: '10px',
                            padding: '16px',
                            border: '1px solid #c7d2fe',
                            marginBottom: '16px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '12px',
                                boxShadow: '0 2px 4px -1px rgba(99, 102, 241, 0.3)'
                              }}>
                                <span style={{ color: 'white', fontSize: '14px' }}>🤖</span>
                              </div>
                              <div>
                                <h4 style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '14px', margin: 0 }}>AI Generated Estimate</h4>
                                <p style={{ color: '#64748b', fontSize: '11px', margin: '2px 0 0 0' }}>Automated cost analysis based on project requirements</p>
                              </div>
                            </div>
                            <div style={{
                              background: '#ffffff',
                              borderRadius: '8px',
                              padding: '16px',
                              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                              border: '1px solid #c7d2fe'
                            }}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{
                                  fontSize: '20px',
                                  fontWeight: 'bold',
                                  background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  marginBottom: '4px'
                                }}>
                                  {estimate.originalEstimate}
                                </div>
                                <div style={{ color: '#6366f1', fontSize: '11px', fontWeight: '500' }}>Total Project Cost Estimate</div>
                              </div>
                            </div>
                          </div>

                          {/* Price Calculator Section */}
                          {showPriceCalculator === estimate._id ? (
                            <div style={{
                              background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
                              borderRadius: '12px',
                              padding: '20px',
                              border: '2px solid #fdba74',
                              marginBottom: '16px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginRight: '12px'
                                }}>
                                  <span style={{ color: 'white', fontSize: '16px' }}>💰</span>
                                </div>
                                <h4 style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '16px', margin: 0 }}>Admin Price Calculator</h4>
                              </div>
                              
                              {/* Input Grid */}
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '12px',
                                marginBottom: '16px'
                              }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Estimated Work Hours</label>
                                  <input
                                    type="number"
                                    value={priceInputs.estimatedWorkHours}
                                    onChange={(e) => setPriceInputs(prev => ({ ...prev, estimatedWorkHours: e.target.value }))}
                                    style={{
                                      width: '100%',
                                      padding: '8px 12px',
                                      borderRadius: '6px',
                                      border: '1px solid #d1d5db',
                                      fontSize: '14px',
                                      boxSizing: 'border-box'
                                    }}
                                    placeholder="e.g., 40"
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Hourly Rate ($)</label>
                                  <input
                                    type="number"
                                    value={priceInputs.hourlyRate}
                                    onChange={(e) => setPriceInputs(prev => ({ ...prev, hourlyRate: e.target.value }))}
                                    style={{
                                      width: '100%',
                                      padding: '8px 12px',
                                      borderRadius: '6px',
                                      border: '1px solid #d1d5db',
                                      fontSize: '14px',
                                      boxSizing: 'border-box'
                                    }}
                                    placeholder="e.g., 75"
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Complexity Factor</label>
                                  <select
                                    value={priceInputs.complexityFactor}
                                    onChange={(e) => setPriceInputs(prev => ({ ...prev, complexityFactor: e.target.value }))}
                                    style={{
                                      width: '100%',
                                      padding: '8px 12px',
                                      borderRadius: '6px',
                                      border: '1px solid #d1d5db',
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
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Admin Fee ($)</label>
                                  <input
                                    type="number"
                                    value={priceInputs.adminFee}
                                    onChange={(e) => setPriceInputs(prev => ({ ...prev, adminFee: e.target.value }))}
                                    style={{
                                      width: '100%',
                                      padding: '8px 12px',
                                      borderRadius: '6px',
                                      border: '1px solid #d1d5db',
                                      fontSize: '14px',
                                      boxSizing: 'border-box'
                                    }}
                                    placeholder="e.g., 500"
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Commission ($)</label>
                                  <input
                                    type="number"
                                    value={priceInputs.commission}
                                    onChange={(e) => setPriceInputs(prev => ({ ...prev, commission: e.target.value }))}
                                    style={{
                                      width: '100%',
                                      padding: '8px 12px',
                                      borderRadius: '6px',
                                      border: '1px solid #d1d5db',
                                      fontSize: '14px',
                                      boxSizing: 'border-box'
                                    }}
                                    placeholder="e.g., 300"
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Surcharges ($)</label>
                                  <input
                                    type="number"
                                    value={priceInputs.surcharges}
                                    onChange={(e) => setPriceInputs(prev => ({ ...prev, surcharges: e.target.value }))}
                                    style={{
                                      width: '100%',
                                      padding: '8px 12px',
                                      borderRadius: '6px',
                                      border: '1px solid #d1d5db',
                                      fontSize: '14px',
                                      boxSizing: 'border-box'
                                    }}
                                    placeholder="e.g., 200"
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Discounts ($)</label>
                                  <input
                                    type="number"
                                    value={priceInputs.discounts}
                                    onChange={(e) => setPriceInputs(prev => ({ ...prev, discounts: e.target.value }))}
                                    style={{
                                      width: '100%',
                                      padding: '8px 12px',
                                      borderRadius: '6px',
                                      border: '1px solid #d1d5db',
                                      fontSize: '14px',
                                      boxSizing: 'border-box'
                                    }}
                                    placeholder="e.g., 100"
                                  />
                                </div>
                              </div>
                              
                              {/* Calculate Button */}
                              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                <button
                                  onClick={() => calculatePrice()}
                                  style={{
                                    flex: 1,
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    color: 'white',
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    border: 'none',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <span style={{ marginRight: '6px' }}>🧮</span>
                                  Calculate Price
                                </button>
                                <button
                                  onClick={() => {
                                    setShowPriceCalculator(null);
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
                                  }}
                                  style={{
                                    background: '#6b7280',
                                    color: 'white',
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    border: 'none',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                              
                              {/* Calculated Price Display */}
                              {calculatedPrice && (
                                <div style={{
                                  background: '#ffffff',
                                  borderRadius: '8px',
                                  padding: '16px',
                                  border: '2px solid #10b981',
                                  marginBottom: '16px'
                                }}>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Final Calculated Price</div>
                                    <div style={{
                                      fontSize: '24px',
                                      fontWeight: 'bold',
                                      color: '#10b981',
                                      marginBottom: '8px'
                                    }}>
                                      ${calculatedPrice}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                      Formula: (Hours × Rate × Complexity) + Fees + Commission + Surcharges - Discounts
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Final Approval Checkbox and Button */}
                              {calculatedPrice && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                                    <input
                                      type="checkbox"
                                      checked={finalApprovalReady}
                                      onChange={(e) => setFinalApprovalReady(e.target.checked)}
                                      style={{ marginRight: '8px', transform: 'scale(1.2)' }}
                                    />
                                    Approve with calculated price
                                  </label>
                                  {finalApprovalReady && (
                                    <button
                                      onClick={() => handleFinalApproval(estimate)}
                                      disabled={processing}
                                      style={{
                                        background: processing 
                                          ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                                          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        color: 'white',
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        border: 'none',
                                        cursor: processing ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
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
                                        <>
                                          <span>✅</span>
                                          Approve Project
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            /* Action button to open calculator */
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <button
                                onClick={() => {
                                  setShowPriceCalculator(estimate._id);
                                  setCalculatedPrice('');
                                  setFinalApprovalReady(false);
                                }}
                                style={{
                                  flex: 1,
                                  background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                                  color: 'white',
                                  padding: '12px 16px',
                                  borderRadius: '8px',
                                  fontWeight: '600',
                                  fontSize: '14px',
                                  transition: 'all 0.3s ease',
                                  boxShadow: '0 2px 4px -1px rgba(59, 130, 246, 0.3)',
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.transform = 'translateY(-1px)';
                                  e.target.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.transform = 'translateY(0)';
                                  e.target.style.boxShadow = '0 2px 4px -1px rgba(59, 130, 246, 0.3)';
                                }}
                              >
                                <span style={{ marginRight: '8px' }}>💰</span>
                                Calculate & Approve Price
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Approved Estimates Section */}
          <div style={{
            flex: 1,
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1)',
            border: '2px solid #bfdbfe',
            overflow: 'hidden'
          }}>
            {/* Approved Header */}
            <div style={{
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              padding: '20px',
              borderBottom: '2px solid #93c5fd'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
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
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e40af', margin: 0 }}>Approved Estimates</h3>
                  <p style={{ color: '#3b82f6', fontSize: '14px', margin: '2px 0 0 0' }}>Completed and approved projects</p>
                </div>
              </div>
            </div>
            
            {/* Approved Content */}
            <div style={{ padding: '20px', maxHeight: '600px', overflowY: 'auto' }}>
              {approvedEstimates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: '#dbeafe',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <span style={{ fontSize: '24px', color: '#3b82f6' }}>✅</span>
                  </div>
                  <div style={{ color: '#1e40af', fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>No approved estimates</div>
                  <p style={{ color: '#3b82f6' }}>Approved estimates will appear here</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {approvedEstimates.map((estimate) => (
                    <div key={estimate._id} style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
                      borderRadius: '12px',
                      padding: '20px',
                      border: '2px solid #bfdbfe'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '12px'
                          }}>
                            <span style={{ color: 'white', fontSize: '16px' }}>✅</span>
                          </div>
                          <div>
                            <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e40af', margin: 0 }}>
                              {estimate.jobId?.title || 'Unknown Project'}
                            </h4>
                            <p style={{ color: '#3b82f6', fontSize: '12px', margin: '2px 0 0 0' }}>
                              Approved on {formatDate(estimate.reviewedAt)}
                            </p>
                          </div>
                        </div>
                        <div style={{
                          background: '#3b82f6',
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          ${estimate.calculatedPrice || estimate.originalEstimate}
                        </div>
                      </div>
                      
                      <div style={{
                        background: '#ffffff',
                        borderRadius: '8px',
                        padding: '12px',
                        border: '2px solid #bfdbfe'
                      }}>
                        <div style={{ fontSize: '14px', color: '#1e40af' }}>
                          <strong>Company:</strong> {estimate.jobId?.company || 'N/A'}
                        </div>
                        <div style={{ fontSize: '14px', color: '#1e40af', marginTop: '4px' }}>
                          <strong>Contact:</strong> {estimate.jobId?.email || 'N/A'}
                        </div>
                        {estimate.adminNotes && (
                          <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '8px', fontStyle: 'italic' }}>
                            <strong>Admin Notes:</strong> {estimate.adminNotes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}