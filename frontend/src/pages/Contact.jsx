
import React, { useState } from 'react';

export default function Contact() {
  const [openFAQ, setOpenFAQ] = useState(0);

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? -1 : index);
  };

  return (
    <div style={{ 
      background: '#ffffff', 
      minHeight: '100vh',
      padding: '40px 20px',
      fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
    }}>
      {/* Main Content Container */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto'
      }}>
        
        {/* Talk to our experts Section */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '80px',
          padding: '60px 0'
        }}>
          <h1 style={{ 
            fontSize: '3.5rem', 
            fontWeight: 700, 
            color: '#000000',
            margin: '0 0 20px 0',
            letterSpacing: '-1px'
          }}>
            Talk to our experts
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: '#666666',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Have questions about pricing, plans, or how we can help? We'd love to chat!
          </p>
        </div>

        {/* Contact Options Cards */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '100px'
        }}>
          
          {/* Chat to sales */}
          <div style={{
            background: 'rgba(33, 150, 243, 0.1)',
            border: '1px solid rgba(33, 150, 243, 0.2)',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#f3f4f6',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <span style={{ fontSize: '24px' }}>💬</span>
            </div>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#000000',
              margin: '0 0 8px 0'
            }}>
              Chat to sales
            </h3>
            <p style={{
              fontSize: '1rem',
              color: '#666666',
              margin: '0 0 16px 0',
              lineHeight: '1.5'
            }}>
              Speak to our friendly team.
            </p>
            <a href="mailto:sales@intakeai.com" style={{
              color: '#000000',
              textDecoration: 'underline',
              fontWeight: 500
            }}>
              sales@intakeai.com
            </a>
          </div>

          {/* Chat to support */}
          <div style={{
            background: 'rgba(33, 150, 243, 0.1)',
            border: '1px solid rgba(33, 150, 243, 0.2)',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#f3f4f6',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <span style={{ fontSize: '24px' }}>❓</span>
            </div>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#000000',
              margin: '0 0 8px 0'
            }}>
              Chat to support
            </h3>
            <p style={{
              fontSize: '1rem',
              color: '#666666',
              margin: '0 0 16px 0',
              lineHeight: '1.5'
            }}>
              We're here to help.
            </p>
            <a href="mailto:support@intakeai.com" style={{
              color: '#000000',
              textDecoration: 'underline',
              fontWeight: 500
            }}>
              support@intakeai.com
            </a>
          </div>

          {/* Visit us */}
          <div style={{
            background: 'rgba(33, 150, 243, 0.1)',
            border: '1px solid rgba(33, 150, 243, 0.2)',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#f3f4f6',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <span style={{ fontSize: '24px' }}>📍</span>
            </div>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#000000',
              margin: '0 0 8px 0'
            }}>
              Visit us
            </h3>
            <p style={{
              fontSize: '1rem',
              color: '#666666',
              margin: '0 0 16px 0',
              lineHeight: '1.5'
            }}>
              Visit our office HQ.
            </p>
            <a href="#" style={{
              color: '#000000',
              textDecoration: 'underline',
              fontWeight: 500
            }}>
              View on Google Maps
            </a>
          </div>

        </div>

        {/* FAQ Section */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '60px'
        }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 700, 
            color: '#000000',
            margin: '0 0 60px 0',
            letterSpacing: '-1px'
          }}>
            Frequently asked questions
          </h2>
        </div>

        {/* FAQ Items */}
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto'
        }}>
          {[
            {
              question: "Is there a free trial available?",
              answer: "Yes, you can try us for free for 30 days. If you want, we'll provide you with a free 30-minute onboarding call to get you up and running. Book a call here."
            },
            {
              question: "Can I change my plan later?",
              answer: "Absolutely! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle."
            },
            {
              question: "What is your cancellation policy?",
              answer: "You can cancel your subscription at any time. There are no long-term contracts or cancellation fees."
            },
            {
              question: "Can other info be added to an invoice?",
              answer: "Yes, you can customize your invoices with additional fields, company logos, and custom branding to match your business needs."
            }
          ].map((faq, index) => (
            <div key={index} style={{
              borderBottom: '1px solid #e5e7eb',
              padding: '24px 0'
            }}>
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  padding: '0'
                }}
                onClick={() => toggleFAQ(index)}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#2196F3',
                    margin: 0
                  }}>
                    {index + 1}) {faq.question}
                  </h3>
                </div>
                <span style={{
                  fontSize: '20px',
                  transform: openFAQ === index ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}>
                  ▼
                </span>
              </div>
              {openFAQ === index && (
                <div style={{
                  padding: '20px 0 0 40px',
                  fontSize: '1rem',
                  color: '#666666',
                  lineHeight: '1.6'
                }}>
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
