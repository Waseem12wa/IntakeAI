import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Contact from './pages/Contact';
import About from './pages/About';
import Register from './pages/Register';
import ProfileSetup from './pages/ProfileSetup'; 
import AIBot from './pages/AIBot';
import AIBotUpload from './pages/AIBotUpload';
import N8nQuoteGenerator from './pages/N8nQuoteGenerator';
import N8nQuoteChat from './pages/N8nQuoteChat';
import N8nProjectQuote from './pages/N8nProjectQuote'; // Keep this for project quote details
import AdminDashboard from './components/AdminDashboard';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail'; // Add this import
import EmployeeProfile from './pages/EmployeeProfile';
import EmployerProfile from './pages/EmployerProfile';
import PostProject from './pages/PostProject';   // ✅ corrected import
import Footer from './components/Footer';

// Navbar Component
function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  // Don't show navbar on registration and login pages
  const hideNavbar = location.pathname === '/' || location.pathname === '/profile-setup';
  
  // Check if we're on the admin page
  const isAdminPage = location.pathname === '/admin' || location.pathname.startsWith('/admin/');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (hideNavbar) {
    return null; // Don't render navbar on registration and login pages
  }

  // For admin page, show a minimal navbar without user-specific links
  if (isAdminPage) {
    return (
      <nav style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 32,
        padding: '24px 40px',
        fontWeight: 600,
        fontSize: 16,
        background: '#2196F3',
        borderBottom: '1px solid #e9ecef',
        width: '100%',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000
      }}>
        <div style={{ 
          position: 'absolute', 
          left: '40px', 
          top: '50%', 
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '2px'
        }}>
          <img 
            src="/LOGO.png" 
            alt="Company Logo" 
            style={{ 
              height: '55px',
              objectFit: 'contain'
            }} 
          />
          <span style={{
            color: '#ffffff',
            fontSize: '20px',
            fontWeight: '600',
            fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
          }}>
            Intake.AI - Admin
          </span>
        </div>
        
        {/* Only show Home link for admin */}
        <Link to="/home" style={{...linkStyle, color: location.pathname === '/home' ? '#000000' : '#ffffff'}}>Home</Link>
        
        {/* Admin Logout Button - Right Corner */}
        <div style={{ 
          position: 'absolute', 
          right: '200px', 
          top: '50%', 
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button 
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.2)';
            }}
          >
            Admin Logout
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 32,
      padding: '24px 40px',
      fontWeight: 600,
      fontSize: 16,
      background: '#2196F3',
      borderBottom: '1px solid #e9ecef',
      width: '100%',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000
    }}>
      <div style={{ 
        position: 'absolute', 
        left: '40px', 
        top: '50%', 
        transform: 'translateY(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '2px'
      }}>
        <img 
          src="/LOGO.png" 
          alt="Company Logo" 
          style={{ 
            height: '55px',
            objectFit: 'contain'
          }} 
        />
        <span style={{
          color: '#ffffff',
          fontSize: '20px',
          fontWeight: '600',
          fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
        }}>
          Intake.AI
        </span>
      </div>
      
      {/* Navigation Links - Only show Home, About, Contact to unauthenticated users */}
      <Link to="/home" style={{...linkStyle, color: location.pathname === '/home' ? '#000000' : '#ffffff'}}>Home</Link>
      <Link to="/about" style={{...linkStyle, color: location.pathname === '/about' ? '#000000' : '#ffffff'}}>About</Link>
      <Link to="/contact" style={{...linkStyle, color: location.pathname === '/contact' ? '#000000' : '#ffffff'}}>Contact</Link>
      
      {/* Show Projects and Post a Project only to authenticated users */}
      {isAuthenticated && (
        <>
          <Link to="/jobs" style={{...linkStyle, color: location.pathname === '/jobs' ? '#000000' : '#ffffff'}}>Projects</Link>
          <Link to="/post-project" style={{...linkStyle, color: location.pathname === '/post-project' ? '#000000' : '#ffffff'}}>Post a Project</Link>
        </>
      )}
      
      {/* Authentication Buttons - Right Corner */}
      <div style={{ 
        position: 'absolute', 
        right: '200px', 
        top: '50%', 
        transform: 'translateY(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {isAuthenticated ? (
          <>
            <button 
              onClick={handleLogout}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.3)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.2)';
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link 
              to="/?mode=login" 
              style={{
                ...linkStyle, 
                color: '#ffffff',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '8px 16px',
                fontSize: '14px'
              }}
            >
              Login
            </Link>
            <Link 
              to="/" 
              style={{
                ...linkStyle, 
                color: '#2196F3',
                background: '#ffffff',
                border: '1px solid #ffffff',
                padding: '8px 16px',
                fontSize: '14px'
              }}
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

// App Component
export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <div style={{
          minHeight: '100vh',
          width: '100vw',
          background: '#ffffff',
          overflow: 'auto',
        }}>
          <Router>
            <Navbar />
            <div style={{
              maxWidth: 1200,
              margin: '0 auto',
              padding: '120px 32px 32px 32px', // Added top padding for fixed header
              background: '#ffffff'
            }}>
              <Routes>
                <Route path="/" element={<Register />} />
                <Route path="/profile-setup" element={<ProfileSetup />} />
                <Route path="/home" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/ai-bot/:id" element={<AIBot />} />
                <Route path="/ai-bot-upload" element={<AIBotUpload />} />
                <Route path="/ai-bot-upload/:id" element={<AIBotUpload />} />
                <Route path="/n8n-quote" element={<N8nQuoteGenerator />} />
                <Route path="/n8n-quote-chat/:id" element={<N8nQuoteChat />} />
                <Route path="/n8n-project-quote/:id" element={<N8nProjectQuote />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/jobs/:id" element={<JobDetail />} /> {/* Add this route */}
                <Route path="/post-project" element={<PostProject />} />   {/* ✅ corrected */}
                <Route path="/admin" element={<AdminDashboard />} />
              </Routes>
            </div>
            <Footer />
          </Router>
        </div>
      </NotificationProvider>
    </AuthProvider>
  );
}

// Shared link styles
const linkStyle = {
  color: '#000000',
  textDecoration: 'none',
  padding: '8px 16px',
  borderRadius: '6px',
  transition: 'all 0.2s ease',
  fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
};