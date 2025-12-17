import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Add this import


export default function Dashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [activeTab, setActiveTab] = useState('submissions'); // Add tab state

  // For demo, you can use a hardcoded admin token or add a real auth flow
  const adminToken = '';

  // Add this function (you'll need to implement listSubmissions)
  const listSubmissions = async (token) => {
    // Your existing implementation
    const response = await fetch('/api/submissions', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return await response.json();
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // You may need to provide a valid admin token here
        const res = await listSubmissions(adminToken);
        setSubmissions(res.submissions || []);
      } catch (err) {
        setError('Failed to load submissions.');
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleView = (submission) => {
    setModalData(submission);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalData(null);
  };

  return (
    <div className="min-h-screen flex bg-gray-100" style={{ flexDirection: window.innerWidth < 768 ? 'column' : 'row' }}>
      {/* Sidebar */}
      <aside className="bg-white shadow-lg flex flex-col" style={{
        width: window.innerWidth < 768 ? '100%' : '256px',
        minWidth: window.innerWidth < 768 ? 'auto' : '256px'
      }}>
        <div className="h-16 flex items-center justify-center font-bold text-xl border-b" style={{ fontSize: 'clamp(16px, 3vw, 20px)' }}>IntakeAI</div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/dashboard" className="block py-2 px-4 rounded hover:bg-blue-100 font-medium" style={{ fontSize: 'clamp(14px, 2vw, 16px)' }}>Dashboard</Link>
          <Link to="/admin" className="block py-2 px-4 rounded hover:bg-blue-100 font-medium" style={{ fontSize: 'clamp(14px, 2vw, 16px)' }}>Submissions</Link>
          <Link to="/profile-setup" className="block py-2 px-4 rounded hover:bg-blue-100 font-medium" style={{ fontSize: 'clamp(14px, 2vw, 16px)' }}>Profile</Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8" style={{ padding: 'clamp(16px, 4vw, 32px)' }}>
        {/* Topbar */}
        <div className="flex items-center justify-between mb-8" style={{
          flexDirection: window.innerWidth < 768 ? 'column' : 'row',
          gap: window.innerWidth < 768 ? '16px' : '0',
          marginBottom: 'clamp(16px, 4vw, 32px)'
        }}>
          <h1 className="text-2xl font-bold" style={{ fontSize: 'clamp(20px, 4vw, 24px)' }}>Dashboard</h1>
          <div className="flex items-center space-x-4" style={{ gap: 'clamp(8px, 2vw, 16px)' }}>
            <span className="font-medium" style={{ fontSize: 'clamp(14px, 2vw, 16px)' }}>Welcome, Admin</span>
            <img src="https://i.pravatar.cc/40" alt="avatar" className="rounded-full w-10 h-10" style={{ width: 'clamp(32px, 6vw, 40px)', height: 'clamp(32px, 6vw, 40px)' }} />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6" style={{ marginBottom: 'clamp(16px, 3vw, 24px)' }}>
          <nav className="flex space-x-8 border-b border-gray-200" style={{
            gap: 'clamp(16px, 4vw, 32px)',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'submissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              style={{
                fontSize: 'clamp(12px, 2vw, 14px)',
                whiteSpace: 'nowrap'
              }}
            >
              Submissions
            </button>
            <button
              onClick={() => setActiveTab('estimates')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'estimates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              style={{
                fontSize: 'clamp(12px, 2vw, 14px)',
                whiteSpace: 'nowrap'
              }}
            >
              Estimate Approvals
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'submissions' ? (
          <>
            {/* Cards */}
            <div className="grid gap-6 mb-8" style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(3, 1fr)',
              gap: 'clamp(16px, 3vw, 24px)',
              marginBottom: 'clamp(16px, 4vw, 32px)'
            }}>
              <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center" style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
                <span className="text-3xl font-bold text-blue-600" style={{ fontSize: 'clamp(24px, 5vw, 30px)' }}>42</span>
                <span className="text-gray-500" style={{ fontSize: 'clamp(12px, 2vw, 14px)' }}>Submissions</span>
              </div>
              <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center" style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
                <span className="text-3xl font-bold text-green-600" style={{ fontSize: 'clamp(24px, 5vw, 30px)' }}>8</span>
                <span className="text-gray-500" style={{ fontSize: 'clamp(12px, 2vw, 14px)' }}>Documents</span>
              </div>
              <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center" style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
                <span className="text-3xl font-bold text-purple-600" style={{ fontSize: 'clamp(24px, 5vw, 30px)' }}>3</span>
                <span className="text-gray-500" style={{ fontSize: 'clamp(12px, 2vw, 14px)' }}>Admins</span>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow p-6" style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
              <h2 className="text-xl font-bold mb-4" style={{ fontSize: 'clamp(18px, 3vw, 20px)', marginBottom: 'clamp(12px, 2vw, 16px)' }}>Recent Submissions</h2>
              {loading ? (
                <div className="text-gray-500" style={{ fontSize: 'clamp(14px, 2vw, 16px)' }}>Loading...</div>
              ) : error ? (
                <div className="text-red-500" style={{ fontSize: 'clamp(14px, 2vw, 16px)' }}>{error}</div>
              ) : (
                <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <table className="min-w-full text-left text-sm" style={{ fontSize: 'clamp(12px, 1.5vw, 14px)' }}>
                    <thead>
                      <tr>
                        <th className="py-2 px-4 font-semibold" style={{ padding: window.innerWidth < 768 ? '8px' : '8px 16px' }}>ID</th>
                        <th className="py-2 px-4 font-semibold" style={{ padding: window.innerWidth < 768 ? '8px' : '8px 16px' }}>Project Type</th>
                        <th className="py-2 px-4 font-semibold" style={{ padding: window.innerWidth < 768 ? '8px' : '8px 16px' }}>Objective</th>
                        <th className="py-2 px-4 font-semibold" style={{ padding: window.innerWidth < 768 ? '8px' : '8px 16px' }}>Date</th>
                        <th className="py-2 px-4 font-semibold" style={{ padding: window.innerWidth < 768 ? '8px' : '8px 16px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-4 text-center text-gray-400" style={{ fontSize: 'clamp(12px, 1.5vw, 14px)' }}>No submissions found.</td>
                        </tr>
                      ) : (
                        submissions.map((s) => (
                          <tr key={s._id}>
                            <td className="py-2 px-4" style={{ padding: window.innerWidth < 768 ? '8px' : '8px 16px' }}>{s._id.slice(-6)}</td>
                            <td className="py-2 px-4" style={{ padding: window.innerWidth < 768 ? '8px' : '8px 16px' }}>{s.extractedFields?.project_type || '-'}</td>
                            <td className="py-2 px-4" style={{ padding: window.innerWidth < 768 ? '8px' : '8px 16px' }}>{s.extractedFields?.objective || '-'}</td>
                            <td className="py-2 px-4" style={{ padding: window.innerWidth < 768 ? '8px' : '8px 16px' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                            <td className="py-2 px-4" style={{ padding: window.innerWidth < 768 ? '8px' : '8px 16px' }}>
                              <button className="text-blue-600 hover:underline" onClick={() => handleView(s)} style={{ minHeight: '44px', minWidth: '44px', padding: '8px' }}>View</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <EstimateApproval />
        )}

        {/* Modal for details */}
        {showModal && modalData && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50" style={{ padding: '16px' }}>
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full relative" style={{
              padding: 'clamp(16px, 4vw, 32px)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <button onClick={closeModal} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl" style={{ minHeight: '44px', minWidth: '44px' }}>&times;</button>
              <h3 className="text-xl font-bold mb-2" style={{ fontSize: 'clamp(18px, 3vw, 20px)' }}>Submission Details</h3>
              <div className="mb-2 text-sm text-gray-500" style={{ fontSize: 'clamp(12px, 1.5vw, 14px)' }}>ID: {modalData._id}</div>
              <div className="mb-2 text-sm text-gray-500" style={{ fontSize: 'clamp(12px, 1.5vw, 14px)' }}>Date: {new Date(modalData.createdAt).toLocaleString()}</div>
              <div className="mb-4">
                <h4 className="font-semibold mb-1" style={{ fontSize: 'clamp(14px, 2vw, 16px)' }}>Extracted Fields:</h4>
                <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto max-h-60" style={{ fontSize: 'clamp(10px, 1.5vw, 12px)' }}>{JSON.stringify(modalData.extractedFields, null, 2)}</pre>
              </div>
              <div>
                <h4 className="font-semibold mb-1" style={{ fontSize: 'clamp(14px, 2vw, 16px)' }}>Conversation:</h4>
                <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto max-h-40" style={{ fontSize: 'clamp(10px, 1.5vw, 12px)' }}>{JSON.stringify(modalData.conversation, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}