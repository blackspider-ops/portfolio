'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ 
        backgroundColor: '#050505', 
        color: '#FFFFFF',
        fontFamily: 'system-ui, sans-serif',
        margin: 0,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          background: '#0A0A0A',
          border: '1px solid rgba(138, 145, 153, 0.2)',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '28rem',
          width: '100%',
          textAlign: 'center'
        }}>
          <div style={{
            width: '4rem',
            height: '4rem',
            margin: '0 auto 1.5rem',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#EF4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          
          <h1 style={{ 
            fontSize: '1.5rem', 
            marginBottom: '0.5rem',
            fontWeight: 600
          }}>
            Critical Error
          </h1>
          
          <p style={{ 
            color: '#8A9199', 
            marginBottom: '1.5rem',
            lineHeight: 1.6
          }}>
            The application encountered a critical error. Please try refreshing the page.
          </p>

          {error.digest && (
            <p style={{ 
              fontSize: '0.75rem', 
              color: '#8A9199', 
              marginBottom: '1rem',
              fontFamily: 'monospace'
            }}>
              Error ID: {error.digest}
            </p>
          )}

          <button
            onClick={reset}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#60A5FA',
              color: '#050505',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Refresh Page
          </button>
        </div>
      </body>
    </html>
  );
}
