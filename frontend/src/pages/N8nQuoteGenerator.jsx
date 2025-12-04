import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import N8nQuoteApi from '../api/n8nQuoteApi';

export default function N8nQuoteGenerator() {
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quote, setQuote] = useState(null);
  const [reviewQueueId, setReviewQueueId] = useState(null);
  const [modifications, setModifications] = useState('');
  const [pendingApproval, setPendingApproval] = useState(false);
  const [approvedQuote, setApprovedQuote] = useState(null);
  const [showModifications, setShowModifications] = useState(false);
  const [quoteGenerated, setQuoteGenerated] = useState(false); // New state to track if quote was generated
  const fileInputRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Poll for quote updates when there's a pending approval
  useEffect(() => {
    if (pendingApproval && reviewQueueId) {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const response = await fetch('/api/n8n-quote/pending-reviews');
          if (response.ok) {
            const data = await response.json();
            const review = data.reviews?.find(r => r.queue_id === reviewQueueId);
            
            if (!review || review.status !== 'pending') {
              clearInterval(pollIntervalRef.current);
              
              if (review && review.status === 'approved') {
                const chatData = {
                  workflowId: 'workflow-' + Date.now(),
                  fileName: uploadedFile.name,
                  fileSize: uploadedFile.size,
                  messages: [],
                  modifications: modifications,
                  totalPrice: review.generated_quote.total_price,
                  basePrice: review.generated_quote.total_price - (review.generated_quote.modifications_price || 0),
                  modificationsPrice: review.generated_quote.modifications_price || 0,
                  items: review.generated_quote.items.map(item => ({
                    nodeId: item.node_id || item.nodeId || 'custom-modification',
                    nodeLabel: item.node_label || item.nodeLabel || 'Custom Modification',
                    nodeType: item.node_type || item.nodeType || 'custom_modification',
                    basePrice: item.base_price || item.basePrice || 0,
                    totalPrice: item.total_price || item.totalPrice || 0
                  })),
                  createdAt: new Date(review.generated_quote.created_at),
                  updatedAt: new Date()
                };
                
                try {
                  await N8nQuoteApi.saveChat(chatData);
                } catch (saveError) {
                  console.error('Error saving chat data:', saveError);
                }
                
                setApprovedQuote(review.generated_quote);
                setPendingApproval(false);
                setQuoteGenerated(true); // Set quote generated flag
              }
            }
          }
        } catch (err) {
          console.error('Error polling for quote updates:', err);
        }
      }, 5000);
    }
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [pendingApproval, reviewQueueId, uploadedFile, modifications]);

  const handleFileSelect = (files) => {
    const file = files[0];
    if (file && (file.type === 'application/json' || file.name.endsWith('.json'))) {
      // Check file size limit (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit. Please upload a smaller file.');
        return;
      }
      setUploadedFile(file);
      setError(null);
      setShowModifications(true);
      setQuoteGenerated(false); // Reset quote generated flag when new file is selected
      setPendingApproval(false); // Reset pending approval state
    } else {
      setError('Please upload a valid JSON file exported from n8n.');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const removeFile = () => {
    setUploadedFile(null);
    setError(null);
    setShowModifications(false);
    setModifications('');
    setQuote(null);
    setQuoteGenerated(false); // Reset quote generated flag
    setPendingApproval(false); // Reset pending approval state
    setReviewQueueId(null); // Reset review queue ID
  };

  const generateQuote = async () => {
    if (!uploadedFile) return;
    
    setLoading(true);
    setError(null);
    setQuote(null);
    setQuoteGenerated(false); // Reset quote generated flag
    setPendingApproval(false); // Reset pending approval state
    setReviewQueueId(null); // Reset review queue ID
    
    try {
      const validateData = await N8nQuoteApi.validateWorkflow(uploadedFile);
      
      if (!validateData.success) {
        throw new Error(validateData.message || 'Invalid n8n workflow file.');
      }
      
      const priceListData = await N8nQuoteApi.generatePriceList(uploadedFile);
      
      if (!priceListData.success) {
        throw new Error(priceListData.message || 'Failed to generate price list.');
      }
      
      const payloadData = await N8nQuoteApi.buildCompactPayload(
        uploadedFile,
        modifications
      );
      
      if (!payloadData.success) {
        throw new Error(payloadData.message || 'Failed to build LLM payload.');
      }
      
      const promptData = await N8nQuoteApi.buildPrompt(payloadData.data);
      
      if (!promptData.success) {
        throw new Error(promptData.message || 'Failed to build LLM prompt.');
      }
      
      const isModificationHardcoded = !modifications || 
        modifications.toLowerCase().includes('standard') || 
        modifications.toLowerCase().includes('basic') ||
        modifications.toLowerCase().includes('simple');
      
      if (modifications && !isModificationHardcoded) {
        // First, get the price list data to include all nodes
        const priceListData = await N8nQuoteApi.generatePriceList(uploadedFile);
        
        if (!priceListData.success) {
          throw new Error(priceListData.message || 'Failed to generate price list.');
        }
        
        // Create items array with all workflow nodes
        const items = priceListData.data.items.map(item => {
          // Check if item requires manual review
          const requiresManualReview = item.requires_manual_review;
          
          return {
            node_label: item.label,
            node_type: item.node_type,
            base_price: item.base_price,
            total_price: requiresManualReview ? 0 : item.base_price,
            confidence: requiresManualReview ? 0.1 : 0.95,
            requires_manual_review: requiresManualReview
          };
        });
        
        // Add the custom modification as a separate item
        items.push({
          node_label: "Custom Modification",
          node_type: "custom_modification",
          base_price: 0,
          total_price: 0,
          confidence: 0.1,
          requires_manual_review: true
        });
        
        const reviewData = await N8nQuoteApi.addToReviewQueue(
          {
            customer_email: "customer@example.com",
            total_price: 0,
            total_delta: 0,
            items: items,
            summary: `Custom modification requested: ${modifications}`,
            confidence: 1.0,
            created_at: new Date().toISOString(),
            modifications_price: 0
          },
          ['custom_modification'],
          {
            workflow: uploadedFile.name,
            modifications: modifications
          },
          "customer@example.com"
        );
        
        if (reviewData.success && reviewData.queue_id) {
          setReviewQueueId(reviewData.queue_id);
          setPendingApproval(true);
          
          // Create a pending quote in the projects section immediately
          const chatData = {
            workflowId: 'workflow-' + Date.now(),
            fileName: uploadedFile.name,
            fileSize: uploadedFile.size,
            messages: [],
            modifications: modifications,
            totalPrice: 0,
            basePrice: 0,
            modificationsPrice: 0,
            items: items.map(item => ({
              nodeId: item.node_id || 'custom-modification',
              nodeLabel: item.node_label || 'Custom Modification',
              nodeType: item.node_type || 'custom_modification',
              basePrice: item.base_price || 0,
              totalPrice: item.total_price || 0,
              requiresManualReview: item.requires_manual_review || false
            })),
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'pending_approval'
          };
          
          try {
            await N8nQuoteApi.saveChat(chatData);
          } catch (saveError) {
            console.error('Error saving pending chat data:', saveError);
          }
          
          setQuote({
            pending_approval: true,
            message: "Your custom modifications have been sent to admin for approval. You will be notified when the admin sets the price."
          });
          setQuoteGenerated(true); // Set quote generated flag
        }
        setLoading(false);
        return;
      }
      
      const modificationsPrice = modifications ? 50.00 : 0.00;
      const basePrice = priceListData.data.summary.estimated_base_total || 0;
      const totalPrice = basePrice + modificationsPrice;
      
      const simulatedQuote = {
        customer_email: "customer@example.com",
        total_price: totalPrice,
        total_delta: modificationsPrice,
        items: priceListData.data.items.map(item => {
          // Check if item requires manual review
          const requiresManualReview = item.requires_manual_review;
          
          return {
            node_id: item.id,
            node_label: item.label,
            node_type: item.node_type,
            base_price: item.base_price,
            modifiers: item.modifiers.map(mod => ({
              name: mod,
              value: 1,
              type: "per_unit",
              price: 0
            })),
            total_price: requiresManualReview ? 0 : item.base_price,
            confidence: requiresManualReview ? 0.1 : 0.95,
            requires_manual_review: requiresManualReview
          };
        }),
        summary: `Quote generated for n8n workflow with ${priceListData.data.items.length} items` + 
                 (modifications ? `\nModifications requested: ${modifications}` : ''),
        confidence: 0.95,
        created_at: new Date().toISOString(),
        modifications_price: modificationsPrice
      };
      
      const chatData = {
        workflowId: 'workflow-' + Date.now(),
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        messages: [],
        modifications: modifications,
        totalPrice: totalPrice,
        basePrice: basePrice,
        modificationsPrice: modificationsPrice,
        items: simulatedQuote.items.map(item => ({
          nodeId: item.node_id,
          nodeLabel: item.node_label,
          nodeType: item.node_type,
          basePrice: item.base_price,
          totalPrice: item.total_price,
          requiresManualReview: item.requires_manual_review
        })),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      try {
        await N8nQuoteApi.saveChat(chatData);
      } catch (saveError) {
        console.error('Error saving chat data:', saveError);
      }
      
      setQuote(simulatedQuote);
      setQuoteGenerated(true); // Set quote generated flag
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!quote) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;

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
        if (yPosition > 280) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += fontSize * 0.5;
      });
      yPosition += 5;
    };

    addText('n8n Workflow Quote', 20, true, '#1976d2');
    yPosition += 10;
    addText(`Generated on: ${new Date().toLocaleDateString()}`, 10);
    yPosition += 10;
    addText('Summary:', 16, true, '#1976d2');
    addText(quote.summary);
    yPosition += 10;

    if (modifications) {
      addText('Requested Modifications:', 16, true, '#1976d2');
      addText(modifications);
      yPosition += 10;
    }

    addText('Pricing Details:', 16, true, '#1976d2');
    
    quote.items.forEach((item, index) => {
      addText(`${index + 1}. ${item.node_label} (${item.node_type})`, 12, true);
      addText(`   Base Price: $${item.base_price.toFixed(2)}`);
      if (item.modifiers && item.modifiers.length > 0) {
        addText('   Modifiers:');
        item.modifiers.forEach(mod => {
          addText(`     - ${mod.name}: ${mod.value} (${mod.type}) = $${mod.price.toFixed(2)}`);
        });
      }
      addText(`   Total: $${item.total_price.toFixed(2)}`);
      yPosition += 5;
    });
    
    if (quote.modifications_price > 0) {
      yPosition += 5;
      addText(`Modifications: $${quote.modifications_price.toFixed(2)}`, 12, true);
    }
    
    yPosition += 10;
    addText(`Total Price: $${quote.total_price.toFixed(2)}`, 16, true, '#1976d2');
    if (quote.total_delta > 0) {
      addText(`Price Delta: +$${quote.total_delta.toFixed(2)}`, 14, false, '#666666');
    }
    
    yPosition += 10;
    addText(`Confidence Level: ${(quote.confidence * 100).toFixed(1)}%`, 14, true);
    
    const fileName = `n8n_quote_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
  };

  const downloadJSON = () => {
    if (!quote) return;
    
    const dataStr = JSON.stringify(quote, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `n8n_quote_${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div style={{ 
      background: '#ffffff', 
      minHeight: '100vh',
      fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
    }}>
      <main style={{ padding: '80px 40px' }}>
        <div style={{ 
          textAlign: 'center', 
          maxWidth: '800px', 
          margin: '0 auto 40px auto' 
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f3f4f6',
            padding: '8px 16px',
            borderRadius: '20px',
            marginBottom: '24px'
          }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>⚙️</span>
            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>
              Workflow, Process, Automate
            </span>
          </div>

          <h1 style={{
            fontSize: '3rem',
            fontWeight: 800,
            color: '#000000',
            margin: '0 0 16px 0',
            lineHeight: '1.1',
            letterSpacing: '-1px'
          }}>
            Generate quotes for <span style={{ color: '#4CAF50' }}>n8n</span> workflows
          </h1>

          <p style={{
            fontSize: '1.1rem',
            color: '#6b7280',
            lineHeight: '1.6',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Upload your n8n workflow JSON file to generate a detailed quote for your automation project
          </p>
        </div>

        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          background: '#ffffff',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0'
        }}>
          {/* File Upload Section */}
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#1a365d',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            Upload n8n Workflow
          </h2>
          
          {!uploadedFile ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              cursor: 'pointer',
              border: isDragging ? '2px dashed #4CAF50' : '1px dashed #e2e8f0',
              borderRadius: '12px',
              transition: 'all 0.2s ease'
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            >
              <div style={{
                width: '60px',
                height: '60px',
                background: '#f0fdf4',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                border: '2px dashed #4CAF50'
              }}>
                <span style={{ fontSize: '24px' }}>📁</span>
              </div>
              <p style={{
                color: '#4a5568',
                marginBottom: '16px'
              }}>
                Drag & drop your n8n JSON file here
              </p>
              <p style={{
                color: '#a0aec0',
                fontSize: '0.9rem',
                marginBottom: '20px'
              }}>
                or
              </p>
              <button style={{
                background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'linear-gradient(135deg, #43A047 0%, #1B5E20 100%)'}
              onMouseLeave={(e) => e.target.style.background = 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)'}
              >
                Browse Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={(e) => handleFileSelect(e.target.files)}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              background: '#f0fff4',
              borderRadius: '8px',
              border: '1px solid #9ae6b4'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '20px' }}>📄</span>
                <div>
                  <div style={{
                    fontWeight: '500',
                    color: '#2d3748'
                  }}>
                    {uploadedFile.name}
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#718096'
                  }}>
                    {(uploadedFile.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
              <button
                onClick={removeFile}
                style={{
                  background: '#e53e3e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
                onMouseEnter={(e) => e.target.style.background = '#c53030'}
                onMouseLeave={(e) => e.target.style.background = '#e53e3e'}
              >
                ×
              </button>
            </div>
          )}
          
          {error && (
            <div style={{
              marginTop: '20px',
              padding: '12px 16px',
              background: '#fed7d7',
              border: '1px solid #feb2b2',
              borderRadius: '8px',
              color: '#c53030',
              fontWeight: '500'
            }}>
              {error}
            </div>
          )}
          
          {/* Modifications Section - shown after file upload */}
          {showModifications && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1a365d',
                marginBottom: '16px'
              }}>
                Custom Modifications
              </h3>
              
              <textarea
                value={modifications}
                onChange={(e) => setModifications(e.target.value)}
                placeholder="Describe any custom modifications or special requirements for your workflow..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  marginBottom: '16px'
                }}
              />
              
              <p style={{
                fontSize: '0.9rem',
                color: '#718096',
                marginBottom: '20px'
              }}>
                Note: Custom modifications will require admin approval before pricing is finalized.
              </p>
            </div>
          )}
          
          {/* Generate Quote Button - shown after file upload */}
          {showModifications && (
            <button
              onClick={generateQuote}
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#cbd5e0' : 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                color: loading ? '#718096' : '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.background = 'linear-gradient(135deg, #43A047 0%, #1B5E20 100%)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.background = 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)';
                }
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Generating Quote...
                </>
              ) : (
                'Generate Quote'
              )}
            </button>
          )}
        </div>

        {/* Results Section - shown after generating quote */}
        {quoteGenerated && (
          <div style={{
            maxWidth: '600px',
            margin: '30px auto 0',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '30px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1a365d',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {pendingApproval ? 'Awaiting Approval' : 'Quote Generated'}
            </h2>

            <div style={{
              textAlign: 'center',
              padding: '40px 20px'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: pendingApproval ? '#fffbeb' : '#16a34a',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                border: pendingApproval ? '2px solid #f6e05e' : 'none',
                color: 'white',
                fontSize: '32px'
              }}>
                {pendingApproval ? '⏳' : '✓'}
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1a365d',
                marginBottom: '16px'
              }}>
                {pendingApproval ? 'Awaiting Admin Approval' : 'Quote Generated Successfully!'}
              </h3>
              <p style={{
                color: '#718096',
                lineHeight: '1.6',
                marginBottom: '24px'
              }}>
                {pendingApproval 
                  ? 'Your custom modifications have been sent to admin for approval. You will be notified when the admin sets the price.'
                  : 'Your quote has been generated. You can view the details in the Projects section.'}
              </p>
              
              {pendingApproval && (
                <div style={{
                  padding: '16px',
                  background: '#ebf8ff',
                  borderRadius: '8px',
                  color: '#3182ce',
                  fontWeight: '500',
                  marginBottom: '24px'
                }}>
                  Queue ID: {reviewQueueId}
                </div>
              )}
              
              <button
                onClick={() => navigate('/jobs')}
                style={{
                  background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  width: '100%',
                  marginBottom: '16px'
                }}
                onMouseEnter={(e) => e.target.style.background = 'linear-gradient(135deg, #43A047 0%, #1B5E20 100%)'}
                onMouseLeave={(e) => e.target.style.background = 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)'}
              >
                View Quote in Projects Section
              </button>
              
              <button
                onClick={() => {
                  setUploadedFile(null);
                  setModifications('');
                  setQuote(null);
                  setPendingApproval(false);
                  setShowModifications(false);
                  setQuoteGenerated(false);
                  setReviewQueueId(null);
                  setApprovedQuote(null);
                }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  color: '#4CAF50',
                  border: '2px solid #4CAF50',
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f0fdf4';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                }}
              >
                Generate Another Quote
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}