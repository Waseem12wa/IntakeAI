import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EmployerProfile() {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
    industry: '',
    companySize: '',
    location: '',
    description: '',
    hiringNeeds: '',
    benefits: '',
    companyType: 'Private'
  });

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Employer profile data:', formData);
    navigate('/home');
  };

  return (
    <div style={{
      background: '#ffffff',
      minHeight: '100vh',
      fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
        padding: 'clamp(24px, 6vw, 40px)',
        textAlign: 'center',
        color: '#ffffff'
      }}>
        <h1 style={{
          fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
          fontWeight: 800,
          margin: '0 0 16px 0',
          lineHeight: '1.1'
        }}>
          Employer Profile Setup
        </h1>
        <p style={{
          fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
          margin: '0',
          opacity: 0.9
        }}>
          Create your company profile to start hiring top talent
        </p>
      </div>

      {/* Form */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: 'clamp(20px, 4vw, 40px) clamp(16px, 3vw, 20px)'
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{
            background: '#ffffff',
            borderRadius: 'clamp(12px, 2vw, 16px)',
            padding: 'clamp(24px, 5vw, 40px)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: 700,
              margin: '0 0 32px 0',
              color: '#000000'
            }}>
              Company Information
            </h2>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 600,
                color: '#374151'
              }}>
                Company Name *
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="e.g., TechCorp Inc."
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  fontFamily: 'inherit',
                  minHeight: '44px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr',
              gap: 'clamp(16px, 3vw, 24px)',
              marginBottom: 'clamp(16px, 3vw, 24px)'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 600,
                  color: '#374151'
                }}>
                  Contact Person Name *
                </label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleInputChange}
                  placeholder="e.g., John Smith"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 600,
                  color: '#374151'
                }}>
                  Contact Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="contact@company.com"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              marginBottom: '24px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 600,
                  color: '#374151'
                }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 123-4567"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 600,
                  color: '#374151'
                }}>
                  Company Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://www.company.com"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              marginBottom: '24px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 600,
                  color: '#374151'
                }}>
                  Industry *
                </label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    background: '#ffffff'
                  }}
                >
                  <option value="">Select industry</option>
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Finance">Finance</option>
                  <option value="Education">Education</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail">Retail</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 600,
                  color: '#374151'
                }}>
                  Company Size *
                </label>
                <select
                  name="companySize"
                  value={formData.companySize}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    background: '#ffffff'
                  }}
                >
                  <option value="">Select size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 600,
                color: '#374151'
              }}>
                Company Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="City, State or Remote"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              marginBottom: '24px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 600,
                  color: '#374151'
                }}>
                  Company Type *
                </label>
                <select
                  name="companyType"
                  value={formData.companyType}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    background: '#ffffff'
                  }}
                >
                  <option value="Private">Private Company</option>
                  <option value="Public">Public Company</option>
                  <option value="Startup">Startup</option>
                  <option value="Non-profit">Non-profit</option>
                  <option value="Government">Government</option>
                  <option value="Agency">Agency</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 600,
                  color: '#374151'
                }}>
                  Hiring Needs
                </label>
                <select
                  name="hiringNeeds"
                  value={formData.hiringNeeds}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    background: '#ffffff'
                  }}
                >
                  <option value="">Select hiring needs</option>
                  <option value="Immediate">Immediate hiring</option>
                  <option value="Next 30 days">Next 30 days</option>
                  <option value="Next 3 months">Next 3 months</option>
                  <option value="Ongoing">Ongoing hiring</option>
                  <option value="Project-based">Project-based</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 600,
                color: '#374151'
              }}>
                Company Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Tell us about your company, mission, values, and what makes you unique..."
                required
                rows="4"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 600,
                color: '#374151'
              }}>
                Benefits & Perks
              </label>
              <textarea
                name="benefits"
                value={formData.benefits}
                onChange={handleInputChange}
                placeholder="e.g., Health insurance, 401k, flexible hours, remote work, professional development..."
                rows="3"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '40px'
            }}>
              <button
                type="submit"
                style={{
                  padding: '16px 32px',
                  border: 'none',
                  background: '#4caf50',
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontSize: 'clamp(14px, 2vw, 16px)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minHeight: '44px',
                  minWidth: window.innerWidth < 768 ? '100%' : 'auto'
                }}
              >
                Complete Company Profile
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
