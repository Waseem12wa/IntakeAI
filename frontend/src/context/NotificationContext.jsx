import React, { createContext, useContext, useState, useEffect } from 'react';

// Global Notification Context
const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Global Notification Component
function GlobalNotificationPopup({ show, message, type, onClose, jobId, projectName }) {
  // Removed auto-close timer - popup stays until user clicks close or the popup itself

  const handleNotificationClick = () => {
    if (jobId) {
      // Navigate to the specific project's chat
      window.open(`/ai-bot/${jobId}`, '_blank');
      onClose();
    }
  };

  if (!show) return null;

  const bgColor = type === 'success' ? '#10b981' : '#ef4444';
  const icon = type === 'success' ? '✅' : '❌';

  return (
    <div 
      onClick={handleNotificationClick}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 100%)`,
        color: 'white',
        padding: '16px 24px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        zIndex: 9999, // Higher z-index to ensure it appears above all content
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '300px',
        animation: 'slideInRight 0.3s ease-out',
        backdropFilter: 'blur(10px)',
        cursor: jobId ? 'pointer' : 'default',
        transition: 'transform 0.2s ease'
      }}
      onMouseEnter={(e) => {
        if (jobId) e.target.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        if (jobId) e.target.style.transform = 'translateY(0)';
      }}
    >
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>
          {type === 'success' ? 'Success!' : 'Error!'}
        </div>
        <div style={{ fontSize: '13px', opacity: 0.9 }}>{message}</div>
        {jobId && (
          <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px', fontStyle: 'italic' }}>
            Click to open project chat
          </div>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          color: 'white',
          borderRadius: '6px',
          padding: '4px 8px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        ✕
      </button>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// Global Approval Notification Component for n8n quotes
function GlobalN8nApprovalNotificationPopup({ show, onClose, projectName, queueId }) {
  // Removed auto-close timer - popup stays until user clicks close or the popup itself

  const handleNotificationClick = () => {
    if (queueId) {
      // Navigate to the specific n8n project quote
      window.location.href = `/n8n-project-quote/${queueId}`;
      onClose();
    }
  };

  if (!show) return null;

  const title = 'Quote Approved!';
  const message = `Your quote for "${projectName}" has been approved by admin!`;
  const icon = '🎉';
  const bgColor = '#10b981';

  return (
    <div 
      onClick={handleNotificationClick}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 100%)`,
        color: 'white',
        padding: '20px 24px',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        zIndex: 9999, // Higher z-index to ensure it appears above all content
        minWidth: '350px',
        maxWidth: '400px',
        animation: 'slideInRight 0.5s ease-out, pulse 2s infinite',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        cursor: 'pointer',
        transition: 'transform 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'translateY(-3px) scale(1.02)';
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0) scale(1)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{
          fontSize: '28px',
          marginTop: '2px'
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontWeight: '700', 
            fontSize: '16px', 
            marginBottom: '6px',
            letterSpacing: '-0.2px'
          }}>
            {title}
          </div>
          <div style={{ 
            fontSize: '14px', 
            opacity: 0.95,
            lineHeight: '1.4'
          }}>
            {message}
          </div>
          <div style={{
            fontSize: '12px',
            opacity: 0.8,
            marginTop: '8px',
            fontStyle: 'italic'
          }}>
            💬 Click to view quote details
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'white',
            borderRadius: '8px',
            padding: '6px 10px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
        >
          ✕
        </button>
      </div>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          }
          50% {
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
          }
        }
      `}</style>
    </div>
  );
}

// Global Approval Notification Component
function GlobalApprovalNotificationPopup({ show, onClose, status, projectTitle, jobId }) {
  // Removed auto-close timer - popup stays until user clicks close or the popup itself

  const handleNotificationClick = () => {
    if (jobId) {
      // If we're already on the AIBot page, just scroll to top or refresh
      if (window.location.pathname.includes(`/ai-bot/${jobId}`)) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.location.reload();
      } else {
        // Navigate to the specific project's chat
        window.location.href = `/ai-bot/${jobId}`;
      }
      onClose();
    }
  };

  if (!show) return null;

  const isApproved = status === 'approved';
  const title = isApproved ? 'Request Approved!' : 'Estimate Updated!';
  const message = isApproved 
    ? `Your estimate for "${projectTitle}" has been approved by admin!`
    : `Your estimate for "${projectTitle}" has been updated by admin!`;
  const icon = isApproved ? '🎉' : '✏️';
  const bgColor = isApproved ? '#10b981' : '#3b82f6';

  return (
    <div 
      onClick={handleNotificationClick}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 100%)`,
        color: 'white',
        padding: '20px 24px',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        zIndex: 9999, // Higher z-index to ensure it appears above all content
        minWidth: '350px',
        maxWidth: '400px',
        animation: 'slideInRight 0.5s ease-out, pulse 2s infinite',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        cursor: 'pointer',
        transition: 'transform 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'translateY(-3px) scale(1.02)';
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0) scale(1)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{
          fontSize: '28px',
          marginTop: '2px'
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontWeight: '700', 
            fontSize: '16px', 
            marginBottom: '6px',
            letterSpacing: '-0.2px'
          }}>
            {title}
          </div>
          <div style={{ 
            fontSize: '14px', 
            opacity: 0.95,
            lineHeight: '1.4'
          }}>
            {message}
          </div>
          <div style={{
            fontSize: '12px',
            opacity: 0.8,
            marginTop: '8px',
            fontStyle: 'italic'
          }}>
            💬 Click to view project details
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'white',
            borderRadius: '8px',
            padding: '6px 10px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
        >
          ✕
        </button>
      </div>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          }
          50% {
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
          }
        }
      `}</style>
    </div>
  );
}

// Notification Provider Component
export const NotificationProvider = ({ children }) => {
  const [generalNotification, setGeneralNotification] = useState({ 
    show: false, 
    message: '', 
    type: '', 
    jobId: null 
  });
  
  const [approvalNotification, setApprovalNotification] = useState({ 
    show: false, 
    status: '', 
    projectTitle: '', 
    jobId: null 
  });
  
  const [n8nApprovalNotification, setN8nApprovalNotification] = useState({ 
    show: false, 
    projectName: '', 
    queueId: null 
  });

  const showGeneralNotification = (message, type, jobId = null) => {
    setGeneralNotification({
      show: true,
      message,
      type,
      jobId
    });
  };

  const hideGeneralNotification = () => {
    setGeneralNotification({ 
      show: false, 
      message: '', 
      type: '', 
      jobId: null 
    });
  };

  const showApprovalNotification = (status, projectTitle, jobId) => {
    setApprovalNotification({
      show: true,
      status,
      projectTitle,
      jobId
    });
  };
  
  const showN8nApprovalNotification = (projectName, queueId) => {
    setN8nApprovalNotification({
      show: true,
      projectName,
      queueId
    });
  };

  const hideApprovalNotification = () => {
    setApprovalNotification({ 
      show: false, 
      status: '', 
      projectTitle: '', 
      jobId: null 
    });
  };
  
  const hideN8nApprovalNotification = () => {
    setN8nApprovalNotification({ 
      show: false, 
      projectName: '', 
      queueId: null 
    });
  };

  const value = {
    showGeneralNotification,
    hideGeneralNotification,
    showApprovalNotification,
    hideApprovalNotification,
    showN8nApprovalNotification,
    hideN8nApprovalNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Global Notifications */}
      <GlobalNotificationPopup
        show={generalNotification.show}
        message={generalNotification.message}
        type={generalNotification.type}
        jobId={generalNotification.jobId}
        onClose={hideGeneralNotification}
      />
      
      <GlobalApprovalNotificationPopup
        show={approvalNotification.show}
        status={approvalNotification.status}
        projectTitle={approvalNotification.projectTitle}
        jobId={approvalNotification.jobId}
        onClose={hideApprovalNotification}
      />
      
      <GlobalN8nApprovalNotificationPopup
        show={n8nApprovalNotification.show}
        projectName={n8nApprovalNotification.projectName}
        queueId={n8nApprovalNotification.queueId}
        onClose={hideN8nApprovalNotification}
      />
    </NotificationContext.Provider>
  );
};