import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function N8nQuoteChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChat = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/n8n-quote/chats/${id}`);
        if (!res.ok) throw new Error('Failed to fetch chat');
        const chatData = await res.json();
        if (chatData.success) {
          setChat(chatData.data);
        }
      } catch (err) {
        console.error('Error fetching chat:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchChat();
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
        <div style={{ textAlign: 'center', color: '#888', fontSize: 18 }}>Loading chat...</div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#f9fafb', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
      }}>
        <div style={{ textAlign: 'center', color: '#888', fontSize: 18 }}>Chat not found.</div>
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
            n8n Quote Details
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
            onMouseOver={(e) => e.target.style.background = '#5a6268'}
            onMouseOut={(e) => e.target.style.background = '#6c757d'}
          >
            Back to Projects
          </button>
        </div>

        {/* Chat Details */}
        <div style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 2px 8px #0001',
          padding: 32,
          marginBottom: 24
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 24, color: '#222', marginBottom: 8 }}>
                {chat.fileName}
              </h3>
              <div style={{ color: '#6c757d', fontSize: 16 }}>
                Generated on {new Date(chat.createdAt).toLocaleDateString()} at {new Date(chat.createdAt).toLocaleTimeString()}
              </div>
            </div>
            <div style={{ 
              fontSize: 32, 
              fontWeight: 800, 
              color: '#1976d2' 
            }}>
              ${chat.totalPrice.toFixed(2)}
            </div>
          </div>

          {/* Modifications */}
          {chat.modifications && (
            <div style={{ 
              background: '#e1f5fe',
              borderRadius: 8,
              padding: 16,
              marginBottom: 24
            }}>
              <h4 style={{ 
                fontWeight: 700, 
                fontSize: 18, 
                color: '#0288d1', 
                marginTop: 0,
                marginBottom: 12
              }}>
                Requested Modifications
              </h4>
              <div style={{ 
                fontSize: 16, 
                color: '#01579b',
                fontStyle: 'italic'
              }}>
                {chat.modifications}
              </div>
              <div style={{ 
                fontSize: 16, 
                color: '#01579b',
                fontWeight: 'bold',
                marginTop: 12
              }}>
                Modifications Price: ${chat.modificationsPrice.toFixed(2)}
              </div>
            </div>
          )}

          {/* Pricing Breakdown */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ 
              fontWeight: 700, 
              fontSize: 18, 
              color: '#222', 
              marginTop: 0,
              marginBottom: 16
            }}>
              Pricing Breakdown
            </h4>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '1px solid #eee'
              }}>
                <div style={{ fontWeight: 600, color: '#495057' }}>Base Price</div>
                <div style={{ fontWeight: 600, color: '#495057' }}>${chat.basePrice.toFixed(2)}</div>
              </div>
              {chat.modificationsPrice > 0 && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: '1px solid #eee'
                }}>
                  <div style={{ fontWeight: 600, color: '#495057' }}>Modifications</div>
                  <div style={{ fontWeight: 600, color: '#495057' }}>${chat.modificationsPrice.toFixed(2)}</div>
                </div>
              )}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '16px 0',
                borderTop: '2px solid #dee2e6',
                borderBottom: '2px solid #dee2e6'
              }}>
                <div style={{ fontWeight: 700, fontSize: 20, color: '#1976d2' }}>Total Price</div>
                <div style={{ fontWeight: 700, fontSize: 20, color: '#1976d2' }}>${chat.totalPrice.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <h4 style={{ 
              fontWeight: 700, 
              fontSize: 18, 
              color: '#222', 
              marginTop: 0,
              marginBottom: 16
            }}>
              Workflow Items ({chat.items.length})
            </h4>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: 12
            }}>
              {chat.items.map((item, index) => (
                <div key={index} style={{
                  background: '#f8f9fa',
                  borderRadius: 8,
                  padding: 16,
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: 8
                  }}>
                    <div style={{ fontWeight: 600, color: '#222' }}>
                      {item.nodeLabel}
                    </div>
                    <div style={{ fontWeight: 700, color: '#1976d2' }}>
                      ${item.totalPrice.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: 14, 
                    color: '#6c757d'
                  }}>
                    {item.nodeType}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}