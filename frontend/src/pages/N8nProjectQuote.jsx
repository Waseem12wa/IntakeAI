import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import N8nQuoteApi from '../api/n8nQuoteApi';

export default function N8nProjectQuote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      setLoading(true);
      try {
        const quoteData = await N8nQuoteApi.getProjectQuoteById(id);
        if (quoteData.success) {
          setQuote(quoteData.data);
        }
      } catch (err) {
        console.error('Error fetching quote:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchQuote();
    }
  }, [id]);

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
        <div style={{ textAlign: 'center', color: '#888', fontSize: 18 }}>Loading quote...</div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#f9fafb', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
      }}>
        <div style={{ textAlign: 'center', color: '#888', fontSize: 18 }}>Quote not found.</div>
      </div>
    );
  }

  // Check if quote is pending approval
  const isPendingApproval = quote.status === 'pending_approval';

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
            n8n Project Quote Details
          </h2>
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

        {/* Status Banner for Pending Approval */}
        {isPendingApproval && (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #f6e05e',
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
            textAlign: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              color: '#d69e2e',
              fontWeight: 600,
              fontSize: 18
            }}>
              <span style={{ fontSize: 24 }}>⏳</span>
              <span>Waiting for Admin Approval</span>
            </div>
            <p style={{ 
              color: '#975a16', 
              marginTop: 8,
              fontSize: 15
            }}>
              This quote is currently pending approval from an administrator. 
              Pricing details will be available once approved.
            </p>
          </div>
        )}

        {/* Quote Summary */}
        <div style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 2px 8px #0001',
          padding: 32,
          marginBottom: 24
        }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.5rem', color: '#222', marginBottom: 16 }}>
            {quote.fileName}
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <div style={{ color: '#6c757d', fontSize: 14, marginBottom: 4 }}>Total Price</div>
              <div style={{ fontWeight: 700, fontSize: 24, color: '#1976d2' }}>
                {isPendingApproval ? '-' : `$${quote.totalPrice.toFixed(2)}`}
              </div>
            </div>
            
            <div>
              <div style={{ color: '#6c757d', fontSize: 14, marginBottom: 4 }}>Base Price</div>
              <div style={{ fontWeight: 700, fontSize: 24, color: '#28a745' }}>
                {isPendingApproval ? '-' : `$${quote.basePrice.toFixed(2)}`}
              </div>
            </div>
            
            <div>
              <div style={{ color: '#6c757d', fontSize: 14, marginBottom: 4 }}>Modifications</div>
              <div style={{ fontWeight: 700, fontSize: 24, color: '#ffc107' }}>
                {isPendingApproval ? '-' : `$${quote.modificationsPrice.toFixed(2)}`}
              </div>
            </div>
            
            <div>
              <div style={{ color: '#6c757d', fontSize: 14, marginBottom: 4 }}>Status</div>
              <div style={{ 
                fontWeight: 700, 
                fontSize: 16, 
                color: quote.status === 'approved' ? '#28a745' : 
                       quote.status === 'pending_approval' ? '#ffc107' : 
                       '#6c757d'
              }}>
                {quote.status.replace('_', ' ')}
              </div>
            </div>
          </div>
          
          {quote.customerRequest && (
            <div style={{ marginTop: 20 }}>
              <div style={{ color: '#6c757d', fontSize: 14, marginBottom: 4 }}>Customer Request</div>
              <div style={{ 
                padding: 12, 
                background: '#f8f9fa', 
                borderRadius: 6, 
                border: '1px solid #e9ecef',
                fontSize: 15
              }}>
                {quote.customerRequest}
              </div>
            </div>
          )}
          
          {quote.adminNotes && (
            <div style={{ marginTop: 20 }}>
              <div style={{ color: '#6c757d', fontSize: 14, marginBottom: 4 }}>Admin Notes</div>
              <div style={{ 
                padding: 12, 
                background: '#e9f7ef', 
                borderRadius: 6, 
                border: '1px solid #c3e6cb',
                color: '#155724',
                fontSize: 15
              }}>
                {quote.adminNotes}
              </div>
            </div>
          )}
          
          <div style={{ 
            color: '#6c757d', 
            fontSize: 13, 
            marginTop: 20, 
            paddingTop: 12, 
            borderTop: '1px solid #e9ecef' 
          }}>
            Created: {new Date(quote.createdAt).toLocaleString()}
            {quote.reviewedAt && (
              <span style={{ marginLeft: 16 }}>
                Reviewed: {new Date(quote.reviewedAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Node Details - Only show when not pending approval */}
        {!isPendingApproval && (
          <div style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 2px 8px #0001',
            padding: 32,
            marginBottom: 24
          }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.3rem', color: '#222', marginBottom: 16 }}>
              Workflow Nodes ({quote.nodes.length})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {quote.nodes.map((node, index) => (
                <div key={node.nodeId} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 16,
                  background: '#f8f9fa',
                  borderRadius: 8,
                  border: '1px solid #e9ecef'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16, color: '#222' }}>
                      {node.nodeLabel}
                    </div>
                    <div style={{ color: '#6c757d', fontSize: 14, marginTop: 4 }}>
                      Type: {node.nodeType}
                    </div>
                    {node.requiresManualReview && (
                      <div style={{ 
                        display: 'inline-block',
                        background: '#fff3cd',
                        color: '#856404',
                        fontSize: 12,
                        padding: '2px 8px',
                        borderRadius: 4,
                        marginTop: 6
                      }}>
                        Requires Manual Review
                      </div>
                    )}
                    {node.basePrice === 0 && (
                      <div style={{ 
                        display: 'inline-block',
                        background: '#f8d7da',
                        color: '#721c24',
                        fontSize: 12,
                        padding: '2px 8px',
                        borderRadius: 4,
                        marginTop: 6,
                        marginLeft: 6
                      }}>
                        Price Not Set
                      </div>
                    )}
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 18, color: '#222' }}>
                      {isPendingApproval ? '-' : `$${node.totalPrice.toFixed(2)}`}
                    </div>
                    <div style={{ color: '#6c757d', fontSize: 14, marginTop: 2 }}>
                      {isPendingApproval ? '-' : `Base: $${node.basePrice.toFixed(2)}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modifications - Only show when not pending approval and has modifications */}
        {!isPendingApproval && quote.modifications && quote.modifications.length > 0 && (
          <div style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 2px 8px #0001',
            padding: 32
          }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.3rem', color: '#222', marginBottom: 16 }}>
              Modifications ({quote.modifications.length})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {quote.modifications.map((mod, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 16,
                  background: '#f8f9fa',
                  borderRadius: 8,
                  border: '1px solid #e9ecef'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16, color: '#222' }}>
                      {mod.description}
                    </div>
                    <div style={{ 
                      display: 'inline-block',
                      background: mod.approved ? '#d4edda' : '#f8d7da',
                      color: mod.approved ? '#155724' : '#721c24',
                      fontSize: 12,
                      padding: '2px 8px',
                      borderRadius: 4,
                      marginTop: 6
                    }}>
                      {mod.approved ? 'Approved' : mod.requiresApproval ? 'Pending Approval' : 'Not Required'}
                    </div>
                  </div>
                  
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#222' }}>
                    {isPendingApproval ? '-' : `$${mod.price.toFixed(2)}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}