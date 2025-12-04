import React, { useState, useEffect } from 'react';

export default function IntegrationManager() {
  const [platforms, setPlatforms] = useState([]);
  const [integrations, setIntegrations] = useState({});
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [credentials, setCredentials] = useState({
    email: '',
    apiToken: '',
    projectKey: 'KAN'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [projects, setProjects] = useState([]);
  const [showProjects, setShowProjects] = useState(false);
  const [loadingPlatforms, setLoadingPlatforms] = useState(true);

  // Load available platforms and integration statuses
  useEffect(() => {
    loadPlatforms();
    loadIntegrationStatuses();
  }, []);

  const loadPlatforms = async () => {
    setLoadingPlatforms(true);
    try {
      console.log('Loading platforms from:', '/api/integrations/platforms');
      const response = await fetch('/api/integrations/platforms');
      console.log('Platforms response:', response);
      const data = await response.json();
      console.log('Platforms data:', data);
      if (data.success) {
        setPlatforms(data.platforms);
        console.log('Platforms set:', data.platforms);
      } else {
        console.error('Platforms API returned error:', data.error);
        setMessage(`Failed to load platforms: ${data.error}`);
        // Fallback to hardcoded platforms if API fails
        setPlatforms([
          {
            name: 'jira',
            displayName: 'Atlassian Jira',
            isConfigured: false,
            features: ['Create Issues', 'Update Project Status', 'Export Project Data', 'Sync Tasks', 'Generate Reports']
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load platforms:', error);
      setMessage(`Failed to load platforms: ${error.message}. Using fallback platforms.`);
      // Fallback to hardcoded platforms if API fails
      setPlatforms([
        {
          name: 'jira',
          displayName: 'Atlassian Jira',
          isConfigured: false,
          features: ['Create Issues', 'Update Project Status', 'Export Project Data', 'Sync Tasks', 'Generate Reports']
        }
      ]);
    } finally {
      setLoadingPlatforms(false);
    }
  };

  const loadIntegrationStatuses = async () => {
    try {
      const response = await fetch('/api/integrations');
      const data = await response.json();
      if (data.success) {
        setIntegrations(data.integrations);
      }
    } catch (error) {
      console.error('Failed to load integration statuses:', error);
    }
  };

  const testConnection = async () => {
    if (!selectedPlatform) {
      setMessage('Please select a platform');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/integrations/${selectedPlatform}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ Successfully connected to ${selectedPlatform}!`);
        loadIntegrationStatuses(); // Refresh statuses
      } else {
        setMessage(`❌ Connection failed: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    if (!selectedPlatform) {
      setMessage('Please select a platform');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/integrations/${selectedPlatform}/projects`);
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.projects);
        setShowProjects(true);
        setMessage(`✅ Loaded ${data.projects.length} projects`);
      } else {
        setMessage(`❌ Failed to load projects: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    if (!selectedPlatform) {
      setMessage('Please select a platform');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/integrations/${selectedPlatform}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ Disconnected from ${selectedPlatform}`);
        loadIntegrationStatuses(); // Refresh statuses
        setShowProjects(false);
        setProjects([]);
      } else {
        setMessage(`❌ Failed to disconnect: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportProject = async (projectData) => {
    if (!selectedPlatform) {
      setMessage('Please select a platform');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/integrations/${selectedPlatform}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectData,
          options: {
            projectKey: credentials.projectKey
          }
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ Successfully exported ${data.exportedItems} items to ${selectedPlatform}!`);
      } else {
        setMessage(`❌ Export failed: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
    }}>
      <h2 style={{
        fontSize: '2rem',
        fontWeight: 700,
        color: '#1e40af',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        Integration Manager
      </h2>

      {/* Platform Selection */}
      <div style={{
        background: '#f8fafc',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#1e40af',
          marginBottom: '16px'
        }}>
          Select Platform
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '20px'
        }}>
          {loadingPlatforms ? (
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              background: '#ffffff',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              Loading platforms...
            </div>
          ) : platforms.length === 0 ? (
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              background: '#ffffff',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              No platforms available
            </div>
          ) : (
            platforms.map(platform => (
            <div
              key={platform.name}
              onClick={() => setSelectedPlatform(platform.name)}
              style={{
                padding: '16px',
                borderRadius: '8px',
                border: selectedPlatform === platform.name ? '2px solid #3b82f6' : '1px solid #d1d5db',
                background: selectedPlatform === platform.name ? '#eff6ff' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                fontWeight: 600,
                color: '#1e40af',
                marginBottom: '8px'
              }}>
                {platform.displayName}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                marginBottom: '8px'
              }}>
                Status: {integrations[platform.name]?.connected ? '✅ Connected' : '❌ Not Connected'}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#9ca3af'
              }}>
                Features: {platform.features.join(', ')}
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      {/* Credentials Form */}
      {selectedPlatform && (
        <div style={{
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1e40af',
            marginBottom: '16px'
          }}>
            {selectedPlatform === 'jira' ? 'Jira Credentials' : 'Platform Credentials'}
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '8px'
              }}>
                Email
              </label>
              <input
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                placeholder="your-email@example.com"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '8px'
              }}>
                API Token
              </label>
              <input
                type="password"
                value={credentials.apiToken}
                onChange={(e) => setCredentials({...credentials, apiToken: e.target.value})}
                placeholder="Your API token"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            {selectedPlatform === 'jira' && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Project Key
                </label>
                <input
                  type="text"
                  value={credentials.projectKey}
                  onChange={(e) => setCredentials({...credentials, projectKey: e.target.value})}
                  placeholder="INTAKE"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={testConnection}
              disabled={loading || !credentials.email || !credentials.apiToken}
              style={{
                padding: '12px 24px',
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: loading || !credentials.email || !credentials.apiToken ? 'not-allowed' : 'pointer',
                opacity: loading || !credentials.email || !credentials.apiToken ? 0.5 : 1,
                transition: 'background 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (!loading && credentials.email && credentials.apiToken) {
                  e.target.style.background = '#2563eb';
                }
              }}
              onMouseOut={(e) => {
                if (!loading && credentials.email && credentials.apiToken) {
                  e.target.style.background = '#3b82f6';
                }
              }}
            >
              {loading ? 'Testing...' : 'Test Connection'}
            </button>

            {integrations[selectedPlatform]?.connected && (
              <>
                <button
                  onClick={loadProjects}
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1
                  }}
                >
                  Load Projects
                </button>

                <button
                  onClick={disconnect}
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1
                  }}
                >
                  Disconnect
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div style={{
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          background: message.includes('✅') ? '#f0fdf4' : '#fef2f2',
          border: message.includes('✅') ? '1px solid #bbf7d0' : '1px solid #fecaca',
          color: message.includes('✅') ? '#166534' : '#dc2626'
        }}>
          {message}
        </div>
      )}

      {/* Projects Display */}
      {showProjects && projects.length > 0 && (
        <div style={{
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1e40af',
            marginBottom: '16px'
          }}>
            Available Projects
          </h3>
          
          <div style={{
            display: 'grid',
            gap: '12px'
          }}>
            {projects.map(project => (
              <div
                key={project.id}
                style={{
                  padding: '16px',
                  background: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div style={{
                  fontWeight: 600,
                  color: '#1e40af',
                  marginBottom: '4px'
                }}>
                  {project.name} ({project.key})
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  marginBottom: '8px'
                }}>
                  {project.description || 'No description'}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#9ca3af'
                }}>
                  Type: {project.projectTypeKey} | Lead: {project.lead || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Export Example */}
      {integrations[selectedPlatform]?.connected && (
        <div style={{
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '24px',
          marginTop: '24px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1e40af',
            marginBottom: '16px'
          }}>
            Quick Export Test
          </h3>
          
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            marginBottom: '16px'
          }}>
            Test the export functionality with sample project data:
          </p>
          
          <button
            onClick={() => exportProject({
              title: 'Sample Project Export',
              description: 'This is a test project exported from IntakeAI',
              tasks: [
                {
                  title: 'Setup Development Environment',
                  description: 'Configure development tools and dependencies',
                  type: 'Task',
                  skills: ['Node.js', 'React', 'MongoDB']
                },
                {
                  title: 'Implement User Authentication',
                  description: 'Create login and registration functionality',
                  type: 'Story',
                  skills: ['JWT', 'Express', 'MongoDB']
                }
              ]
            })}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: '#8b5cf6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            Export Sample Project
          </button>
        </div>
      )}
    </div>
  );
}
