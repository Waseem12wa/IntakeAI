import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthHeaders } from '../utils/api';

export default function PostProject() {
  const [form, setForm] = useState({
    title: '',
    company: '',   // ✅ Added company field in state
    email: '',     // ✅ Added email field
    description: '',
    skills: [],
    duration: '',
    budget: '',
    location: '', 
    type: 'Full-time'
  });
  const [skillInput, setSkillInput] = useState('');
  const skillInputRef = useRef();
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // document upload handler
  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("document", file);

    try {
      const res = await fetch("/api/parse-project-doc", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        alert("Invalid document");
        return;
      }

      const parsed = await res.json();

      setForm(prev => ({
        ...prev,
        title: parsed.data?.projectTitle || "",
        company: parsed.data?.company || "",   // ✅ Fill company if parser provides it
        description: parsed.data?.description || "",
        skills: parsed.data?.techStack?.map(s => s.name || s) || [],
        duration: parsed.data?.duration || "",
        budget: parsed.data?.budget || "",
        location: parsed.data?.location || ""   // ✅ Add this line
      }));
    } catch (err) {
      alert("Failed to parse document: " + err.message);
    }
  };

  // skill handling
  const handleSkillKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',' || e.key === 'Tab') && skillInput.trim()) {
      e.preventDefault();
      addSkill(skillInput.trim());
    }
  };

  const addSkill = (skill) => {
    if (!skill || form.skills.includes(skill)) return;
    setForm((prev) => ({ ...prev, skills: [...prev.skills, skill] }));
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (skillInput.trim()) addSkill(skillInput.trim());
    setSubmitting(true);
    try {
      const projectData = { ...form };
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(projectData),
      });
      if (!res.ok) throw new Error('Failed to post project');
      navigate('/jobs');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: 650, 
      margin: '48px auto', 
      background: '#f9fafb', 
      borderRadius: 16, 
      boxShadow: '0 4px 24px #0002', 
      padding: 40,
      fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
    }}>
      <h2 style={{ fontWeight: 800, fontSize: '2.3rem', marginBottom: 8, color: '#1976d2', letterSpacing: '-1px' }}>Post a Project</h2>
      <p style={{ color: '#374151', marginBottom: 32, fontSize: '1.1rem' }}>Fill in the details below to create a new project listing.</p>
      
      {/* Document Upload Section */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontWeight: 700, color: '#222', marginBottom: 6, display: 'block' }}>Upload Document</label>
        <input type="file" accept=".pdf,.doc,.docx" onChange={handleDocumentUpload} />
        <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Upload to auto-fill project details.</div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 22 }}>
        <div>
          <label style={{ fontWeight: 700, color: '#222', marginBottom: 6, display: 'block' }}>Project Title</label>
          <input name="title" value={form.title} onChange={handleChange} required style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #b6c2d1', fontSize: 16, background: '#fff' }} />
        </div>

        {/* ✅ New Company Field */}
        <div>
          <label style={{ fontWeight: 700, color: '#222', marginBottom: 6, display: 'block' }}>Company</label>
          <input name="company" value={form.company} onChange={handleChange} required style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #b6c2d1', fontSize: 16, background: '#fff' }} />
        </div>

        {/* ✅ New Email Field */}
        <div>
          <label style={{ fontWeight: 700, color: '#222', marginBottom: 6, display: 'block' }}>Contact Email</label>
          <input 
            name="email" 
            type="email" 
            value={form.email} 
            onChange={handleChange} 
            required 
            placeholder="your.email@example.com"
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #b6c2d1', fontSize: 16, background: '#fff' }} 
          />
        </div>

        <div>
          <label style={{ fontWeight: 700, color: '#222', marginBottom: 6, display: 'block' }}>Project Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} required rows={4} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #b6c2d1', fontSize: 16, background: '#fff', resize: 'vertical' }} />
        </div>
        <div>
          <label style={{ fontWeight: 700, color: '#222', marginBottom: 6, display: 'block' }}>Tech Stack / Skills <span style={{ color: '#1976d2', fontWeight: 500 }}>(press Enter or comma to add)</span></label>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            minHeight: 48,
            border: '1.5px solid #b6c2d1',
            borderRadius: 8,
            background: '#fff',
            padding: '6px 8px',
            alignItems: 'center',
            marginBottom: 0
          }}>
            {form.skills.map((skill, idx) => (
              <span key={idx} style={{
                background: '#1976d2',
                color: '#fff',
                borderRadius: 16,
                padding: '6px 14px',
                fontWeight: 600,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                userSelect: 'none'
              }} onClick={() => removeSkill(skill)} title="Remove skill">
                {skill} <span style={{ fontWeight: 900, marginLeft: 2 }}>&times;</span>
              </span>
            ))}
            <input
              ref={skillInputRef}
              type="text"
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              placeholder={form.skills.length === 0 ? 'Type a skill and press Enter' : ''}
              style={{
                flex: 1,
                minWidth: 120,
                border: 'none',
                outline: 'none',
                fontSize: 16,
                background: 'transparent',
                padding: 8
              }}
              disabled={submitting}
            />
          </div>
          <div style={{ color: '#888', fontSize: 13, marginTop: 4, marginBottom: 0 }}>Click a skill to remove it.</div>
        </div>

        {/* Location Field */}
        <div>
          <label style={{ fontWeight: 700, color: '#222', marginBottom: 6, display: 'block' }}>Location</label>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #b6c2d1', fontSize: 16, background: '#fff' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 18 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 700, color: '#222', marginBottom: 6, display: 'block' }}>Project Duration</label>
            <input name="duration" value={form.duration} onChange={handleChange} required style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #b6c2d1', fontSize: 16, background: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 700, color: '#222', marginBottom: 6, display: 'block' }}>Budget <span style={{ color: '#888', fontWeight: 400 }}>(optional)</span></label>
            <input name="budget" value={form.budget} onChange={handleChange} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #b6c2d1', fontSize: 16, background: '#fff' }} />
          </div>
        </div>
        <button type="submit" disabled={submitting} style={{ background: '#1976d2', color: '#fff', padding: '14px 0', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', marginTop: 10, letterSpacing: '0.5px', boxShadow: '0 2px 8px #1976d222' }}>
          {submitting ? 'Posting...' : 'Post Project'}
        </button>
      </form>
    </div>
  );
}
