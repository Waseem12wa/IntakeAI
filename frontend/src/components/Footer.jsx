import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      color: '#ffffff',
      padding: '80px 20px 40px 20px',
      fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      marginTop: '100px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        
        {/* Main Footer Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '60px',
          marginBottom: '60px'
        }}>
          
          {/* Company Info Section */}
          <div>
            {/* Logo and Company Name */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <img 
                src="/LOGO.png" 
                alt="IntakeAI Logo" 
                style={{ 
                  height: '40px',
                  objectFit: 'contain'
                }} 
              />
              <span style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#ffffff'
              }}>
                IntakeAI
              </span>
            </div>
            
            {/* Company Description */}
            <p style={{
              fontSize: '1rem',
              color: '#cbd5e1',
              lineHeight: '1.6',
              marginBottom: '24px',
              maxWidth: '300px'
            }}>
              Transforming document processing with intelligent AI solutions. We make every document actionable through advanced automation and authentic insights.
            </p>
            
            {/* Contact Info */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
                color: '#94a3b8'
              }}>
                <span>📧</span>
                <a href="mailto:hello@intakeai.com" style={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.color = '#ffffff'}
                onMouseOut={(e) => e.target.style.color = '#94a3b8'}
                >
                  hello@intakeai.com
                </a>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
                color: '#94a3b8'
              }}>
                <span>📍</span>
                <span>Main Road, Islamabad, Pakistan</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
                color: '#94a3b8'
              }}>
                <span>📅</span>
                <span>Founded in 2024</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: '#ffffff',
              marginBottom: '24px'
            }}>
              Quick Links
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <Link to="/home" style={{
                color: '#cbd5e1',
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'color 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.color = '#ffffff'}
              onMouseOut={(e) => e.target.style.color = '#cbd5e1'}
              >
                Home
              </Link>
              <Link to="/about" style={{
                color: '#cbd5e1',
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'color 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.color = '#ffffff'}
              onMouseOut={(e) => e.target.style.color = '#cbd5e1'}
              >
                About Us
              </Link>
              <Link to="/jobs" style={{
                color: '#cbd5e1',
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'color 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.color = '#ffffff'}
              onMouseOut={(e) => e.target.style.color = '#cbd5e1'}
              >
                Projects
              </Link>
              <Link to="/contact" style={{
                color: '#cbd5e1',
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'color 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.color = '#ffffff'}
              onMouseOut={(e) => e.target.style.color = '#cbd5e1'}
              >
                Contact
              </Link>
              <Link to="/post-project" style={{
                color: '#cbd5e1',
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'color 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.color = '#ffffff'}
              onMouseOut={(e) => e.target.style.color = '#cbd5e1'}
              >
                Post a Project
              </Link>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: '#ffffff',
              marginBottom: '24px'
            }}>
              Our Services
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <span style={{
                color: '#cbd5e1',
                fontSize: '0.875rem'
              }}>
                AI Document Processing
              </span>
              <span style={{
                color: '#cbd5e1',
                fontSize: '0.875rem'
              }}>
                Intelligent Data Extraction
              </span>
              <span style={{
                color: '#cbd5e1',
                fontSize: '0.875rem'
              }}>
                Automated Form Processing
              </span>
              <span style={{
                color: '#cbd5e1',
                fontSize: '0.875rem'
              }}>
                Business Intelligence
              </span>
              <span style={{
                color: '#cbd5e1',
                fontSize: '0.875rem'
              }}>
                Custom AI Solutions
              </span>
            </div>
          </div>

          {/* Newsletter Signup */}
          <div>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: '#ffffff',
              marginBottom: '24px'
            }}>
              Stay Updated
            </h3>
            <p style={{
              fontSize: '0.875rem',
              color: '#cbd5e1',
              lineHeight: '1.5',
              marginBottom: '20px'
            }}>
              Get the latest updates on AI innovations and document processing solutions.
            </p>
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '20px'
            }}>
              <input 
                type="email" 
                placeholder="Enter your email"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #475569',
                  background: '#1e293b',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
              <button style={{
                padding: '12px 20px',
                background: '#2196F3',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.background = '#1976D2'}
              onMouseOut={(e) => e.target.style.background = '#2196F3'}
              >
                Subscribe
              </button>
            </div>
            
            {/* Social Links */}
            <div style={{
              display: 'flex',
              gap: '16px',
              marginTop: '20px'
            }}>
              <a href="#" style={{
                color: '#94a3b8',
                fontSize: '1.25rem',
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.color = '#ffffff'}
              onMouseOut={(e) => e.target.style.color = '#94a3b8'}
              >
                📘
              </a>
              <a href="#" style={{
                color: '#94a3b8',
                fontSize: '1.25rem',
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.color = '#ffffff'}
              onMouseOut={(e) => e.target.style.color = '#94a3b8'}
              >
                🐦
              </a>
              <a href="#" style={{
                color: '#94a3b8',
                fontSize: '1.25rem',
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.color = '#ffffff'}
              onMouseOut={(e) => e.target.style.color = '#94a3b8'}
              >
                💼
              </a>
              <a href="#" style={{
                color: '#94a3b8',
                fontSize: '1.25rem',
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.color = '#ffffff'}
              onMouseOut={(e) => e.target.style.color = '#94a3b8'}
              >
                📷
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div style={{
          borderTop: '1px solid #475569',
          paddingTop: '40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          
          {/* Copyright */}
          <div style={{
            fontSize: '0.875rem',
            color: '#94a3b8'
          }}>
            © 2024 IntakeAI. All rights reserved.
          </div>
          
          {/* Legal Links */}
          <div style={{
            display: 'flex',
            gap: '24px',
            fontSize: '0.875rem'
          }}>
            <a href="#" style={{
              color: '#94a3b8',
              textDecoration: 'none',
              transition: 'color 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.color = '#ffffff'}
            onMouseOut={(e) => e.target.style.color = '#94a3b8'}
            >
              Privacy Policy
            </a>
            <a href="#" style={{
              color: '#94a3b8',
              textDecoration: 'none',
              transition: 'color 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.color = '#ffffff'}
            onMouseOut={(e) => e.target.style.color = '#94a3b8'}
            >
              Terms of Service
            </a>
            <a href="#" style={{
              color: '#94a3b8',
              textDecoration: 'none',
              transition: 'color 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.color = '#ffffff'}
            onMouseOut={(e) => e.target.style.color = '#94a3b8'}
            >
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
