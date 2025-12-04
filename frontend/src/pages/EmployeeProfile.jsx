import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';


export default function EmployeeProfile() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    title: '',
    experience: '',
    skills: '',
    bio: '',
    jobType: 'Full-time',
    remote: 'Hybrid'
  });
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef();

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Helper: map parsed data to form fields (customize as needed)
  const mapParsedDataToForm = (parsed) => ({
    firstName: parsed.firstName || parsed.name?.split(' ')[0] || '',
    lastName: parsed.lastName || parsed.name?.split(' ')[1] || '',
    email: parsed.email || '',
    phone: parsed.phone || '',
    location: parsed.location || '',
    title: parsed.title || '',
    experience: parsed.experience || '',
    skills: parsed.skills ? Array.isArray(parsed.skills) ? parsed.skills.join(', ') : parsed.skills : '',
    bio: parsed.summary || parsed.bio || '',
    jobType: formData.jobType,
    remote: formData.remote
  });

  // Handle CV upload
  const handleCVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setUploading(true);
    const formDataObj = new FormData();
    formDataObj.append('cv', file);
    try {
      const res = await fetch('/api/profiles/employee/upload-cv', {
        method: 'POST',
        body: formDataObj,
      });
      if (!res.ok) throw new Error('Failed to parse CV');
      const parsed = await res.json();
      setFormData(prev => ({ ...prev, ...mapParsedDataToForm(parsed) }));
    } catch (err) {
      alert('CV parsing failed: ' + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSelectedFile(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Employee profile data:', formData);
    navigate('/dashboard');
  };

  return (
    <div style={{ 
      background: '#ffffff', 
      minHeight: '100vh',
      fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
    }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
        padding: '40px',
        textAlign: 'center',
        color: '#ffffff'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          margin: '0 0 16px 0',
          lineHeight: '1.1'
        }}>
          Employee Profile Setup
        </h1>
        <p style={{
          fontSize: '1.1rem',
          margin: '0',
          opacity: 0.9
        }}>
          Create your professional profile to find your dream job
        </p>
      </div>

      {/* Form */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 20px'
      }}>
        {/* CV Upload */}
        <div style={{ margin: '1em 0', display: 'flex', alignItems: 'center', gap: '1em' }}>
          <label htmlFor="cv-upload" style={{
            display: 'inline-block',
            padding: '10px 20px',
            background: '#1976d2',
            color: '#fff',
            borderRadius: '6px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '1rem',
            opacity: uploading ? 0.6 : 1,
            transition: 'background 0.2s',
            border: 'none',
            boxShadow: '0 2px 6px rgba(25, 118, 210, 0.08)'
          }}>
            {uploading ? 'Uploading...' : 'Upload CV to fill'}
          </label>
          <input
            id="cv-upload"
            type="file"
            accept=".pdf,.doc,.docx"
            ref={fileInputRef}
            onChange={handleCVUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          {selectedFile && <span style={{ fontSize: '0.95em' }}>{selectedFile.name}</span>}
          {uploading && <span style={{ color: '#1976d2' }}>Parsing...</span>}
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: 700,
              margin: '0 0 32px 0',
              color: '#000000'
            }}>
              Personal Information
            </h2>
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
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
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
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
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
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
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
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
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

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 600,
                color: '#374151'
              }}>
                Location *
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

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 600,
                color: '#374151'
              }}>
                Professional Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Senior Frontend Developer"
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
                  Years of Experience *
                </label>
                <select
                  name="experience"
                  value={formData.experience}
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
                  <option value="">Select experience</option>
                  <option value="0-1">0-1 years</option>
                  <option value="1-3">1-3 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="5-10">5-10 years</option>
                  <option value="10+">10+ years</option>
                </select>
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 600,
                  color: '#374151'
                }}>
                  Preferred Job Type *
                </label>
                <select
                  name="jobType"
                  value={formData.jobType}
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
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Freelance">Freelance</option>
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
                Skills & Technologies *
              </label>
              <textarea
                name="skills"
                value={formData.skills}
                onChange={handleInputChange}
                placeholder="e.g., React, JavaScript, Python, AWS, Docker"
                required
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

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 600,
                color: '#374151'
              }}>
                Professional Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about your professional background, achievements, and what you're passionate about..."
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
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Complete Profile
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
