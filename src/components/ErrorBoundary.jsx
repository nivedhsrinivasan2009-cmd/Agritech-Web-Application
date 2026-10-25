import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Log error to console in development
    console.error('Error Boundary caught an error:', error, errorInfo);

    // Send to error tracking service if available
    if (window.reportError) {
      window.reportError({
        error: error.toString(),
        stack: errorInfo.componentStack,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    }

    // Store error in localStorage for debugging
    try {
      const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      errors.push({
        message: error.toString(),
        stack: errorInfo.componentStack,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
      // Keep only last 10 errors
      localStorage.setItem('app_errors', JSON.stringify(errors.slice(-10)));
    } catch (e) {
      // Ignore storage errors
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            <h1 className="text-2xl font-bold text-stone-900 mb-2">
              Something went wrong
            </h1>

            <p className="text-stone-600 mb-6">
              We're sorry, but something unexpected happened. Please try again or return to the home page.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-stone-100 rounded-lg p-4 mb-6 text-left">
                <p className="text-xs font-mono text-red-600 break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleRetry}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>

              <Button
                onClick={this.handleGoHome}
                className="gap-2 bg-[#2D5016] hover:bg-[#4A7C23]"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            </div>

            <p className="text-xs text-stone-400 mt-6">
              If this problem persists, please contact support at help@gracia.farm
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
