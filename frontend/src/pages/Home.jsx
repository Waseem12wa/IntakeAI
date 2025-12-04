// Homepage Dashboard
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ 
      background: '#ffffff', 
      minHeight: '100vh',
      fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
    }}>


      {/* Main Content */}
      <main style={{ padding: '80px 40px' }}>
        {/* Hero Section */}
        <div style={{ 
          textAlign: 'center', 
          maxWidth: '800px', 
          margin: '0 auto 80px auto' 
        }}>
          {/* Tagline */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f3f4f6',
            padding: '8px 16px',
            borderRadius: '20px',
            marginBottom: '24px'
          }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>🔄</span>
            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>
              Chat, Process, Automate
            </span>
          </div>

          {/* Main Headline */}
          <h1 style={{
            fontSize: '4rem',
            fontWeight: 800,
            color: '#000000',
            margin: '0 0 24px 0',
            lineHeight: '1.1',
            letterSpacing: '-2px'
          }}>
            Create faster with <span style={{ color: '#2196F3' }}>AI</span> and collaborate seamlessly
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: '1.25rem',
            color: '#6b7280',
            lineHeight: '1.6',
            maxWidth: '600px',
            margin: '0 auto 40px auto'
          }}>
            Say goodbye to manual data entry and confusing forms. <span style={{ color: '#2196F3' }}>IntakeAI</span> helps you collect and process customer information in just a few clicks.
          </p>

          {/* CTA Buttons */}
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '80px',
            flexWrap: 'wrap'
          }}>
            <button 
              onClick={() => navigate('/ai-bot-upload')}
              style={{
                background: 'linear-gradient(135deg, #2196F3 0%, #0d47a1 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '16px 32px',
                fontSize: '18px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(33, 150, 243, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(33, 150, 243, 0.3)';
              }}
            >
              Intake Bot
              <span style={{ fontSize: '20px' }}>💬</span>
            </button>
            
            <button 
              onClick={() => navigate('/n8n-quote')}
              style={{
                background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '16px 32px',
                fontSize: '18px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
              }}
            >
              n8n Quote Generator
              <span style={{ fontSize: '20px' }}>⚙️</span>
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          
          {/* Card 1 - Paste or write */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            position: 'relative'
          }}>
            {/* Step Indicator */}
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              fontSize: '12px',
              color: '#6b7280',
              fontWeight: 500
            }}>
              Step 1/3
            </div>

            {/* Icon */}
            <div style={{
              width: '48px',
              height: '48px',
              background: '#f3f4f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <span style={{ fontSize: '24px' }}>💬</span>
            </div>

            {/* Title */}
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#000000',
              margin: '0 0 12px 0'
            }}>
              Chat or upload
            </h3>

            {/* Description */}
            <p style={{
              fontSize: '1rem',
              color: '#6b7280',
              lineHeight: '1.6',
              margin: 0
            }}>
              Customers can chat with our AI assistant or upload documents — anything from forms to handwritten notes.
            </p>
          </div>

          {/* Card 2 - Choose processing */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            position: 'relative'
          }}>
            {/* Step Indicator */}
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              fontSize: '12px',
              color: '#ffffff',
              fontWeight: 500
            }}>
              Step 2/3
            </div>

            {/* Icon */}
            <div style={{
              width: '48px',
              height: '48px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <span style={{ fontSize: '24px', color: '#ffffff' }}>⚙️</span>
            </div>

            {/* Title */}
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#ffffff',
              margin: '0 0 12px 0'
            }}>
              Choose processing
            </h3>

            {/* Description */}
            <p style={{
              fontSize: '1rem',
              color: '#ffffff',
              lineHeight: '1.6',
              margin: '0 0 20px 0'
            }}>
              Pick how you want to process: extract data, generate reports, create tasks, or all of the above.
            </p>

            {/* Processing Options */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              {[
                { name: 'Extract', icon: '📊', active: true },
                { name: 'Report', icon: '📋', active: false },
                { name: 'Task', icon: '✅', active: true },
                { name: 'Email', icon: '📧', active: false },
                { name: 'CRM', icon: '👥', active: false }
              ].map((option, index) => (
                <div key={index} style={{
                  background: option.active ? '#ffffff' : 'rgba(255,255,255,0.2)',
                  color: option.active ? '#667eea' : '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>{option.icon}</span>
                  {option.name}
                </div>
              ))}
            </div>

            {/* Navigation Arrow */}
            <div style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              width: '32px',
              height: '32px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}>
              <span style={{ fontSize: '14px', color: '#ffffff' }}>→</span>
            </div>
          </div>

          {/* Card 3 - Get results */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            position: 'relative'
          }}>
            {/* Step Indicator */}
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              fontSize: '12px',
              color: '#6b7280',
              fontWeight: 500
            }}>
              Step 3/3
            </div>

            {/* Icon */}
            <div style={{
              width: '48px',
              height: '48px',
              background: '#f3f4f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <span style={{ fontSize: '24px' }}>🚀</span>
            </div>

            {/* Title */}
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#000000',
              margin: '0 0 12px 0'
            }}>
              Get results instantly
            </h3>

            {/* Description */}
            <p style={{
              fontSize: '1rem',
              color: '#6b7280',
              lineHeight: '1.6',
              margin: 0
            }}>
              AI processes your data instantly. Review, edit, or export to your favorite tools with one click.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}