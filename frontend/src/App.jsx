import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
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
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Don't show navbar on registration and login pages
  const hideNavbar = location.pathname === '/' || location.pathname === '/profile-setup';

  // Check if we're on the admin page
  const isAdminPage = location.pathname === '/admin' || location.pathname.startsWith('/admin/');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Close mobile menu when route changes
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (hideNavbar) {
    return null; // Don't render navbar on registration and login pages
  }

  // For admin page, show a minimal navbar without user-specific links
  if (isAdminPage) {
    return (
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'clamp(12px, 3vw, 24px) clamp(16px, 4vw, 40px)',
        fontWeight: 600,
        fontSize: 'clamp(14px, 2vw, 16px)',
        background: '#2196F3',
        borderBottom: '1px solid #e9ecef',
        width: '100%',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        boxSizing: 'border-box'
      }}>
        {/* Logo Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(4px, 1vw, 8px)',
          flex: '0 0 auto'
        }}>
          <img
            src="/LOGO.png"
            alt="Company Logo"
            style={{
              height: 'clamp(35px, 8vw, 55px)',
              objectFit: 'contain'
            }}
          />
          <span style={{
            color: '#ffffff',
            fontSize: 'clamp(14px, 3vw, 20px)',
            fontWeight: '600',
            fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
            whiteSpace: 'nowrap'
          }}>
            Intake.AI - Admin
          </span>
        </div>

        {/* Desktop Navigation */}
        <div style={{
          display: window.innerWidth >= 768 ? 'flex' : 'none',
          alignItems: 'center',
          gap: '24px'
        }}>
          <Link to="/home" style={{ ...linkStyle, color: location.pathname === '/home' ? '#000000' : '#ffffff' }}>Home</Link>
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
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: window.innerWidth < 768 ? 'flex' : 'none',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '4px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            minWidth: '44px',
            minHeight: '44px'
          }}
          aria-label="Toggle menu"
        >
          <div style={{ width: '24px', height: '2px', background: '#ffffff', borderRadius: '2px' }}></div>
          <div style={{ width: '24px', height: '2px', background: '#ffffff', borderRadius: '2px' }}></div>
          <div style={{ width: '24px', height: '2px', background: '#ffffff', borderRadius: '2px' }}></div>
        </button>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && window.innerWidth < 768 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#2196F3',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <Link
              to="/home"
              style={{
                ...linkStyle,
                color: '#ffffff',
                padding: '12px 16px',
                display: 'block',
                borderRadius: '6px',
                background: location.pathname === '/home' ? 'rgba(255,255,255,0.1)' : 'transparent'
              }}
            >
              Home
            </Link>
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '6px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                textAlign: 'left',
                width: '100%'
              }}
            >
              Logout
            </button>
          </div>
        )}
      </nav>
    );
  }

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 'clamp(12px, 3vw, 24px) clamp(16px, 4vw, 40px)',
      fontWeight: 600,
      fontSize: 'clamp(14px, 2vw, 16px)',
      background: '#2196F3',
      borderBottom: '1px solid #e9ecef',
      width: '100%',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      boxSizing: 'border-box'
    }}>
      {/* Logo Section */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(4px, 1vw, 8px)',
        flex: '0 0 auto'
      }}>
        <img
          src="/LOGO.png"
          alt="Company Logo"
          style={{
            height: 'clamp(35px, 8vw, 55px)',
            objectFit: 'contain'
          }}
        />
        <span style={{
          color: '#ffffff',
          fontSize: 'clamp(14px, 3vw, 20px)',
          fontWeight: '600',
          fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
          whiteSpace: 'nowrap'
        }}>
          Intake.AI
        </span>
      </div>

      {/* Desktop Navigation Links */}
      <div style={{
        display: window.innerWidth >= 768 ? 'flex' : 'none',
        alignItems: 'center',
        gap: 'clamp(16px, 3vw, 32px)'
      }}>
        <Link to="/home" style={{ ...linkStyle, color: location.pathname === '/home' ? '#000000' : '#ffffff' }}>Home</Link>
        <Link to="/about" style={{ ...linkStyle, color: location.pathname === '/about' ? '#000000' : '#ffffff' }}>About</Link>
        <Link to="/contact" style={{ ...linkStyle, color: location.pathname === '/contact' ? '#000000' : '#ffffff' }}>Contact</Link>

        {/* Show Projects and Post a Project only to authenticated users */}
        {isAuthenticated && (
          <>
            <Link to="/jobs" style={{ ...linkStyle, color: location.pathname === '/jobs' ? '#000000' : '#ffffff' }}>Projects</Link>
            <Link to="/post-project" style={{ ...linkStyle, color: location.pathname === '/post-project' ? '#000000' : '#ffffff' }}>Post a Project</Link>
          </>
        )}

        {/* Desktop Auth Buttons */}
        {isAuthenticated ? (
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
        ) : (
          <div style={{ display: 'flex', gap: '12px' }}>
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
          </div>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        style={{
          display: window.innerWidth < 768 ? 'flex' : 'none',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '4px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          minWidth: '44px',
          minHeight: '44px'
        }}
        aria-label="Toggle menu"
      >
        <div style={{ width: '24px', height: '2px', background: '#ffffff', borderRadius: '2px' }}></div>
        <div style={{ width: '24px', height: '2px', background: '#ffffff', borderRadius: '2px' }}></div>
        <div style={{ width: '24px', height: '2px', background: '#ffffff', borderRadius: '2px' }}></div>
      </button>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && window.innerWidth < 768 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#2196F3',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <Link
            to="/home"
            style={{
              ...linkStyle,
              color: '#ffffff',
              padding: '12px 16px',
              display: 'block',
              borderRadius: '6px',
              background: location.pathname === '/home' ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            Home
          </Link>
          <Link
            to="/about"
            style={{
              ...linkStyle,
              color: '#ffffff',
              padding: '12px 16px',
              display: 'block',
              borderRadius: '6px',
              background: location.pathname === '/about' ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            About
          </Link>
          <Link
            to="/contact"
            style={{
              ...linkStyle,
              color: '#ffffff',
              padding: '12px 16px',
              display: 'block',
              borderRadius: '6px',
              background: location.pathname === '/contact' ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            Contact
          </Link>

          {isAuthenticated && (
            <>
              <Link
                to="/jobs"
                style={{
                  ...linkStyle,
                  color: '#ffffff',
                  padding: '12px 16px',
                  display: 'block',
                  borderRadius: '6px',
                  background: location.pathname === '/jobs' ? 'rgba(255,255,255,0.1)' : 'transparent'
                }}
              >
                Projects
              </Link>
              <Link
                to="/post-project"
                style={{
                  ...linkStyle,
                  color: '#ffffff',
                  padding: '12px 16px',
                  display: 'block',
                  borderRadius: '6px',
                  background: location.pathname === '/post-project' ? 'rgba(255,255,255,0.1)' : 'transparent'
                }}
              >
                Post a Project
              </Link>
            </>
          )}

          {/* Mobile Auth Buttons */}
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '6px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                textAlign: 'left',
                width: '100%'
              }}
            >
              Logout
            </button>
          ) : (
            <>
              <Link
                to="/?mode=login"
                style={{
                  ...linkStyle,
                  color: '#ffffff',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '12px 16px',
                  fontSize: '14px',
                  display: 'block',
                  textAlign: 'center',
                  borderRadius: '6px'
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
                  padding: '12px 16px',
                  fontSize: '14px',
                  display: 'block',
                  textAlign: 'center',
                  borderRadius: '6px'
                }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

// App Component
export default function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
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