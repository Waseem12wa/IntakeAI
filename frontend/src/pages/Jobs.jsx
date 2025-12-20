import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import N8nQuoteApi from '../api/n8nQuoteApi';
import { getAuthHeaders } from '../utils/api';
import { generateN8nQuotePDF } from '../utils/n8nQuotePdfGenerator';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [n8nChats, setN8nChats] = useState([]); // New state for n8n chats
  const [projectQuotes, setProjectQuotes] = useState([]); // New state for project quotes
  const [approvedQuotes, setApprovedQuotes] = useState([]); // New state for approved quotes
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('jobs'); // New state for tab switching
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        // ✅ Fetch from /api/jobs
        const res = await fetch('/api/jobs', {
          headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch jobs');
        const jobsData = await res.json();
        setJobs(
          Array.isArray(jobsData.data)
            ? jobsData.data
            : Array.isArray(jobsData.jobs)
              ? jobsData.jobs
              : jobsData
        );
      } catch (err) {
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // Fetch n8n quote chats and project quotes
  useEffect(() => {
    const fetchN8nData = async () => {
      try {
        // Fetch n8n chats, project quotes, and approved quotes
        const [chatsResponse, quotesResponse, approvedResponse] = await Promise.all([
          fetch('/api/n8n-quote/chats'),
          N8nQuoteApi.getProjectQuotes(),
          N8nQuoteApi.getApprovedQuotes()
        ]);

        if (chatsResponse.ok) {
          const chatsData = await chatsResponse.json();
          if (chatsData.success) {
            setN8nChats(chatsData.data);
          }
        }

        if (quotesResponse.success) {
          setProjectQuotes(quotesResponse.data);
        }

        if (approvedResponse.success) {
          setApprovedQuotes(approvedResponse.data);
        }
      } catch (err) {
        console.error('Error fetching n8n data:', err);
        setN8nChats([]);
        setProjectQuotes([]);
        setApprovedQuotes([]);
      }
    };

    if (activeTab === 'n8n') {
      fetchN8nData();
    }
  }, [activeTab]);

  // Combine n8n chats, project quotes, and approved quotes for display
  const getAllN8nQuotes = () => {
    // Combine all data sources and sort by date
    const allQuotes = [
      ...n8nChats.map(chat => ({
        ...chat,
        type: 'chat',
        createdAt: new Date(chat.createdAt)
      })),
      ...projectQuotes.map(quote => ({
        ...quote,
        type: 'project',
        createdAt: new Date(quote.createdAt)
      })),
      ...approvedQuotes.map(quote => ({
        ...quote,
        type: 'approved',
        createdAt: new Date(quote.createdAt)
      }))
    ];

    // Sort by creation date (newest first)
    return allQuotes.sort((a, b) => b.createdAt - a.createdAt);
  };

  // Get integration status color
  const getIntegrationStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#059669';
      case 'failed': return '#dc2626';
      case 'in_progress': return '#1976d2';
      case 'pending': return '#eab308';
      default: return '#6b7280';
    }
  };

  // Handle PDF download
  const handleDownloadPDF = (quote, e) => {
    e.stopPropagation(); // Prevent navigation
    generateN8nQuotePDF(quote);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}>
      <h2 style={{ textAlign: 'center', fontWeight: 800, fontSize: '2.2rem', margin: '32px 0 24px 0', color: '#1976d2' }}>Projects & Quotes</h2>

      {/* Tab Navigation */}
      <div style={{
        maxWidth: 1000,
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '24px'
      }}>
        <div
          onClick={() => setActiveTab('jobs')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'jobs' ? '#1976d2' : '#e9ecef',
            color: activeTab === 'jobs' ? '#fff' : '#495057',
            fontWeight: 600,
            cursor: 'pointer',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            border: '1px solid #dee2e6',
            borderBottom: 'none'
          }}
        >
          Projects
        </div>
        <div
          onClick={() => setActiveTab('n8n')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'n8n' ? '#1976d2' : '#e9ecef',
            color: activeTab === 'n8n' ? '#fff' : '#495057',
            fontWeight: 600,
            cursor: 'pointer',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            border: '1px solid #dee2e6',
            borderBottom: 'none',
            marginLeft: '4px'
          }}
        >
          n8n Quotes
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, padding: '0 20px' }}>
        {/* Projects Section */}
        {activeTab === 'jobs' && (
          <>
            {loading ? (
              <div style={{ textAlign: 'center', color: '#888', fontSize: 18 }}>Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#888', fontSize: 18 }}>No projects posted yet.</div>
            ) : (
              jobs.map((job) => (
                <div
                  key={job._id || job.id}
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    boxShadow: '0 2px 8px #0001',
                    padding: 32,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    width: '100%',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/jobs/${job._id || job.id}`)} // Updated this line
                >
                  <div style={{ fontWeight: 700, fontSize: 22, color: '#222', marginBottom: 4 }}>{job.title}</div>
                  <div style={{ color: '#1976d2', fontWeight: 600, fontSize: 16 }}>{job.company}</div>
                  <div style={{ color: '#555', fontSize: 15 }}>{job.location} &middot; <span style={{ color: '#1976d2' }}>{job.type}</span></div>
                  {job.salary && <div style={{ color: '#059669', fontWeight: 600, fontSize: 15 }}>{job.salary}</div>}
                  <div style={{ color: '#444', fontSize: 15, lineHeight: '1.5', marginTop: 8 }}>{job.description || job.requirements}</div>
                  {Array.isArray(job.skills) && job.skills.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                      {job.skills.map((skill, idx) => (
                        <span key={idx} style={{ background: '#e3eafe', color: '#1976d2', borderRadius: 8, padding: '4px 12px', fontSize: 13, fontWeight: 500 }}>{skill}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {/* n8n Quotes Section - Combined view of chats and project quotes */}
        {activeTab === 'n8n' && (
          <>
            {getAllN8nQuotes().length === 0 ? (
              <div style={{ textAlign: 'center', color: '#888', fontSize: 18 }}>No n8n quotes generated yet.</div>
            ) : (
              getAllN8nQuotes().map((item) => (
                <div key={item._id} style={{
                  background: '#fff',
                  borderRadius: 12,
                  boxShadow: '0 2px 8px #0001',
                  padding: 32,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  width: '100%',
                  cursor: 'pointer'
                }}
                  onClick={() => {
                    if (item.type === 'chat') {
                      navigate(`/n8n-quote-chat/${item._id}`);
                    } else {
                      navigate(`/n8n-project-quote/${item._id}`);
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, fontSize: 22, color: '#222', marginBottom: 4 }}>
                      {item.fileName || item.workflowName || 'Unnamed Workflow'}
                    </div>
                    {item.status === 'approved' && (
                      <button
                        onClick={(e) => handleDownloadPDF(item, e)}
                        style={{
                          background: '#1976d2',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 16px',
                          fontWeight: 600,
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'background 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#1565c0'}
                        onMouseLeave={(e) => e.target.style.background = '#1976d2'}
                      >
                        📄 Download PDF
                      </button>
                    )}
                  </div>
                  <div style={{ color: '#1976d2', fontWeight: 600, fontSize: 16 }}>
                    {item.status === 'approved' ? `Total: $${item.totalPrice ? item.totalPrice.toFixed(2) : (item.basePrice + item.modificationsPrice).toFixed(2)}` : 'Total: Pending Approval'}
                  </div>
                  <div style={{ color: '#555', fontSize: 15 }}>
                    {item.status === 'approved' ? `Base: $${item.basePrice ? item.basePrice.toFixed(2) : '0.00'}` : 'Base: Pending Approval'}
                    {item.status === 'approved' && item.modificationsPrice > 0 && ` | Modifications: $${item.modificationsPrice.toFixed(2)}`}
                  </div>
                  <div style={{ color: '#555', fontSize: 15 }}>
                    Status: <span style={{
                      color: item.status === 'approved' ? '#059669' :
                        item.status === 'pending_approval' ? '#eab308' :
                          '#6b7280',
                      fontWeight: 600
                    }}>
                      {item.status ? item.status.replace('_', ' ') : 'Generated'}
                    </span>
                  </div>
                  {item.integrationStatus && item.status === 'approved' && (
                    <div style={{ color: '#555', fontSize: 15 }}>
                      Integration: <span style={{
                        color: getIntegrationStatusColor(item.integrationStatus),
                        fontWeight: 600
                      }}>
                        {item.integrationStatus.replace('_', ' ').toUpperCase()}
                      </span>
                      {item.integrationCompletedAt && (
                        <span style={{ color: '#888', fontSize: 13, marginLeft: 8 }}>
                          ({new Date(item.integrationCompletedAt).toLocaleString()})
                        </span>
                      )}
                    </div>
                  )}
                  {(item.customerRequest || item.modifications) && (
                    <div style={{ color: '#444', fontSize: 15, lineHeight: '1.5', marginTop: 8 }}>
                      <strong>Request:</strong> {item.customerRequest || item.modifications}
                    </div>
                  )}
                  <div style={{ color: '#888', fontSize: 14, marginTop: 8 }}>
                    {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString()}
                  </div>
                  {item.adminNotes && (
                    <div style={{ color: '#444', fontSize: 14, marginTop: 8, padding: '8px', background: '#f8f9fa', borderRadius: '4px' }}>
                      <strong>Admin Notes:</strong> {item.adminNotes}
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}