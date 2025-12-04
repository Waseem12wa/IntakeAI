
import React from 'react';

export default function About() {
  return (
    <div style={{ 
      background: '#ffffff', 
      minHeight: '100vh',
      padding: '60px 20px',
      fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
    }}>
      
      {/* Main Content Container */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto'
      }}>

        {/* Top Section - Brand Name and Description */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '80px',
          gap: '60px'
        }}>
          
          {/* Centered Description */}
          <div style={{
            flex: 'none',
            paddingTop: '20px',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '1.25rem',
              color: '#000000',
              lineHeight: '1.7',
              fontWeight: 400,
              margin: 0,
              maxWidth: '800px',
              display: 'inline-block'
            }}>
              At <span style={{ color: '#2196F3', fontWeight: 'bold' }}>IntakeAI</span>, we believe that document processing is more than just automation - it's an intelligent experience that connects businesses, data, and insights. That's why we are committed to providing unique AI solutions and unforgettable experiences that turn every document into actionable intelligence.
            </p>
          </div>
        </div>

        {/* Main Title */}
        <div style={{
          textAlign: 'center',
          marginBottom: '80px'
        }}>
          <h2 style={{
            fontSize: '5rem',
            fontWeight: 700,
            color: '#000000',
            margin: 0,
            letterSpacing: '-3px',
            lineHeight: '1.1'
          }}>
            Get to Know Us 
          </h2>
        </div>

        {/* Central Image Section */}
        <div style={{
          marginBottom: '80px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '800px',
            height: '500px',
            background: '#f8f9fa',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #e5e7eb',
            margin: '0 auto',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Team photo of 4 people sitting around a table with laptops */}
            <img 
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" 
              alt="Four people sitting around a table with laptops"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>
        </div>

        {/* Bottom Information Section - Three Columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 2fr',
          gap: '80px',
          alignItems: 'start',
          marginTop: '40px'
        }}>

          {/* Left Column - Founded In */}
          <div style={{
            textAlign: 'left',
            padding: '20px 0'
          }}>
            <div style={{
              fontSize: '0.75rem',
              color: '#9ca3af',
              fontWeight: 600,
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Founded in
            </div>
            <div style={{
              fontSize: '3.5rem',
              fontWeight: 800,
              color: '#000000',
              lineHeight: '1',
              letterSpacing: '-2px'
            }}>
              2024
            </div>
          </div>

          {/* Middle Column - Location */}
          <div style={{
            textAlign: 'left',
            padding: '20px 0'
          }}>
            <div style={{
              fontSize: '0.75rem',
              color: '#9ca3af',
              fontWeight: 600,
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Location
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#000000',
              lineHeight: '1.3',
              letterSpacing: '-0.5px'
            }}>
              Main Road.<br />
              <span style={{ fontWeight: 400, fontSize: '1.25rem' }}>Islamabad, Pakistan</span>
            </div>
          </div>

          {/* Right Column - Mission/Description */}
          <div style={{
            textAlign: 'left',
            padding: '20px 0',
            maxWidth: '600px'
          }}>
            <div style={{
              fontSize: '1.125rem',
              color: '#374151',
              lineHeight: '1.8',
              fontWeight: 400,
              marginBottom: '32px'
            }}>
              We embrace the idea that every document should be processed intelligently. Whether it's a complex legal document, a medical intake form, or a business contract, we carefully curate AI solutions that match every organization's needs and preferences.
            </div>
            <div style={{
              fontSize: '1.125rem',
              color: '#374151',
              lineHeight: '1.8',
              fontWeight: 400
            }}>
              We are dedicated to offering a seamless and trusted AI processing experience, connecting businesses with intelligent automation and authentic insights. From simple forms to complex documents, IntakeAI is here to make your document processing extraordinary.
            </div>
          </div>
        </div>

        {/* Horizontal Divider Line */}
        <div style={{
          marginTop: '60px',
          borderBottom: '1px solid #e5e7eb'
        }}></div>

        {/* Additional Features Section */}
        <div style={{
          marginTop: '100px',
          padding: '60px 0',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '40px'
          }}>
            
            {/* Feature 1 */}
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              borderRadius: '16px',
              background: 'rgba(33, 150, 243, 0.1)',
              border: '1px solid rgba(33, 150, 243, 0.2)'
            }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '20px'
              }}>
                🤖
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: '#000000',
                margin: '0 0 16px 0'
              }}>
                AI-Powered Processing
              </h3>
              <p style={{
                fontSize: '1rem',
                color: '#6b7280',
                lineHeight: '1.6',
                margin: 0
              }}>
                Advanced machine learning algorithms that understand context and extract meaningful information from any document type.
              </p>
            </div>

            {/* Feature 2 */}
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              borderRadius: '16px',
              background: 'rgba(33, 150, 243, 0.1)',
              border: '1px solid rgba(33, 150, 243, 0.2)'
            }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '20px'
              }}>
                ⚡
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: '#000000',
                margin: '0 0 16px 0'
              }}>
                Instant Results
              </h3>
              <p style={{
                fontSize: '1rem',
                color: '#6b7280',
                lineHeight: '1.6',
                margin: 0
              }}>
                Real-time processing that delivers structured data, reports, and actionable insights in seconds, not hours.
              </p>
            </div>

            {/* Feature 3 */}
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              borderRadius: '16px',
              background: 'rgba(33, 150, 243, 0.1)',
              border: '1px solid rgba(33, 150, 243, 0.2)'
            }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '20px'
              }}>
                🔒
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: '#000000',
                margin: '0 0 16px 0'
              }}>
                Enterprise Security
              </h3>
              <p style={{
                fontSize: '1rem',
                color: '#6b7280',
                lineHeight: '1.6',
                margin: 0
              }}>
                Bank-level security protocols ensure your sensitive documents are protected with the highest standards of data privacy.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
