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
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="h-16 flex items-center justify-center font-bold text-xl border-b">IntakeAI</div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/dashboard" className="block py-2 px-4 rounded hover:bg-blue-100 font-medium">Dashboard</Link>
          <Link to="/admin" className="block py-2 px-4 rounded hover:bg-blue-100 font-medium">Submissions</Link>
          <Link to="/profile-setup" className="block py-2 px-4 rounded hover:bg-blue-100 font-medium">Profile</Link>
        </nav>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 p-8">
        {/* Topbar */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="font-medium">Welcome, Admin</span>
            <img src="https://i.pravatar.cc/40" alt="avatar" className="rounded-full w-10 h-10" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('submissions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'submissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Submissions
            </button>
            <button
              onClick={() => setActiveTab('estimates')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'estimates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Estimate Approvals
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'submissions' ? (
          <>
            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                <span className="text-3xl font-bold text-blue-600">42</span>
                <span className="text-gray-500">Submissions</span>
              </div>
              <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                <span className="text-3xl font-bold text-green-600">8</span>
                <span className="text-gray-500">Documents</span>
              </div>
              <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                <span className="text-3xl font-bold text-purple-600">3</span>
                <span className="text-gray-500">Admins</span>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Recent Submissions</h2>
              {loading ? (
                <div className="text-gray-500">Loading...</div>
              ) : error ? (
                <div className="text-red-500">{error}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 font-semibold">ID</th>
                        <th className="py-2 px-4 font-semibold">Project Type</th>
                        <th className="py-2 px-4 font-semibold">Objective</th>
                        <th className="py-2 px-4 font-semibold">Date</th>
                        <th className="py-2 px-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-4 text-center text-gray-400">No submissions found.</td>
                        </tr>
                      ) : (
                        submissions.map((s) => (
                          <tr key={s._id}>
                            <td className="py-2 px-4">{s._id.slice(-6)}</td>
                            <td className="py-2 px-4">{s.extractedFields?.project_type || '-'}</td>
                            <td className="py-2 px-4">{s.extractedFields?.objective || '-'}</td>
                            <td className="py-2 px-4">{new Date(s.createdAt).toLocaleDateString()}</td>
                            <td className="py-2 px-4">
                              <button className="text-blue-600 hover:underline" onClick={() => handleView(s)}>View</button>
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
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full relative">
              <button onClick={closeModal} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
              <h3 className="text-xl font-bold mb-2">Submission Details</h3>
              <div className="mb-2 text-sm text-gray-500">ID: {modalData._id}</div>
              <div className="mb-2 text-sm text-gray-500">Date: {new Date(modalData.createdAt).toLocaleString()}</div>
              <div className="mb-4">
                <h4 className="font-semibold mb-1">Extracted Fields:</h4>
                <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto max-h-60">{JSON.stringify(modalData.extractedFields, null, 2)}</pre>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Conversation:</h4>
                <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto max-h-40">{JSON.stringify(modalData.conversation, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}