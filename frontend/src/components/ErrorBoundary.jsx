import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px',
                    maxWidth: '800px',
                    margin: '0 auto',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                    <div style={{
                        backgroundColor: '#fee2e2',
                        border: '2px solid #ef4444',
                        borderRadius: '8px',
                        padding: '24px',
                        marginBottom: '20px'
                    }}>
                        <h2 style={{ color: '#dc2626', marginTop: 0 }}>
                            ⚠️ Something went wrong
                        </h2>
                        <p style={{ color: '#991b1b', marginBottom: '16px' }}>
                            The application encountered an error. Please try refreshing the page.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            Refresh Page
                        </button>
                    </div>

                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details style={{
                            backgroundColor: '#f3f4f6',
                            padding: '16px',
                            borderRadius: '8px',
                            fontSize: '14px'
                        }}>
                            <summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: '8px' }}>
                                Error Details (Development Only)
                            </summary>
                            <pre style={{
                                overflow: 'auto',
                                backgroundColor: '#1f2937',
                                color: '#f9fafb',
                                padding: '12px',
                                borderRadius: '4px',
                                fontSize: '12px'
                            }}>
                                {this.state.error.toString()}
                                {'\n\n'}
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
