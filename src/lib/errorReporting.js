// Error Reporting / Crash Reporting Service
import config from './config';

// Initialize error reporting
export function initErrorReporting() {
  // Setup global error handlers
  setupGlobalHandlers();

  // Initialize Sentry if configured
  if (config.errorTracking.sentryDsn) {
    initSentry();
  }

  // Log initialization
  if (config.app.debug) {
    console.log('[ErrorReporting] Initialized');
  }
}

// Initialize Sentry
async function initSentry() {
  try {
    // Dynamically import Sentry to avoid bundling when not used
    const Sentry = await import('@sentry/react');

    Sentry.init({
      dsn: config.errorTracking.sentryDsn,
      environment: config.app.environment,
      release: `gracia-app@${config.app.version}`,
      tracesSampleRate: config.app.environment === 'production' ? 0.1 : 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,

      // Filter out known non-critical errors
      beforeSend(event, hint) {
        const error = hint.originalException;

        // Ignore network errors
        if (error?.message?.includes('Failed to fetch')) {
          return null;
        }

        // Ignore user-cancelled actions
        if (error?.name === 'AbortError') {
          return null;
        }

        return event;
      },

      // Add additional context
      initialScope: {
        tags: {
          app: 'gracia-visitor-app'
        }
      }
    });

    if (config.app.debug) {
      console.log('[ErrorReporting] Sentry initialized');
    }
  } catch (error) {
    console.error('[ErrorReporting] Failed to initialize Sentry:', error);
  }
}

// Setup global error handlers
function setupGlobalHandlers() {
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason, {
      type: 'unhandledrejection',
      promise: true
    });
  });

  // Global errors
  window.addEventListener('error', (event) => {
    reportError(event.error || event.message, {
      type: 'global',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  // Console error override for development
  if (config.app.debug) {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Don't report React dev warnings
      const firstArg = args[0];
      if (typeof firstArg === 'string' && firstArg.includes('Warning:')) {
        originalConsoleError.apply(console, args);
        return;
      }

      // Report other errors
      if (args[0] instanceof Error) {
        reportError(args[0], { source: 'console.error' });
      }

      originalConsoleError.apply(console, args);
    };
  }
}

// Report an error
export function reportError(error, context = {}) {
  const errorData = {
    message: error?.message || String(error),
    stack: error?.stack,
    name: error?.name,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    ...context
  };

  // Log to console in debug mode
  if (config.app.debug) {
    console.error('[ErrorReporting]', errorData);
  }

  // Store locally for debugging
  storeErrorLocally(errorData);

  // Send to Sentry if available
  if (config.errorTracking.sentryDsn && window.Sentry) {
    window.Sentry.captureException(error, {
      extra: context
    });
  }

  // Send to custom error tracking API
  if (config.api.baseUrl) {
    sendToErrorAPI(errorData).catch(() => {
      // Silently fail - we don't want error reporting to cause more errors
    });
  }
}

// Report a message (non-error)
export function reportMessage(message, level = 'info', context = {}) {
  const data = {
    message,
    level,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    ...context
  };

  if (config.app.debug) {
    console.log(`[ErrorReporting] ${level}:`, message, context);
  }

  // Send to Sentry
  if (config.errorTracking.sentryDsn && window.Sentry) {
    window.Sentry.captureMessage(message, level);
  }
}

// Set user context for error tracking
export function setUser(user) {
  if (window.Sentry) {
    window.Sentry.setUser(user ? {
      id: user.id,
      email: user.email,
      username: user.name
    } : null);
  }

  // Store for local error reports
  if (user) {
    sessionStorage.setItem('error_user_context', JSON.stringify({
      id: user.id,
      email: user.email
    }));
  } else {
    sessionStorage.removeItem('error_user_context');
  }
}

// Add breadcrumb for better error context
export function addBreadcrumb(message, category = 'user', data = {}) {
  if (window.Sentry) {
    window.Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info'
    });
  }
}

// Store error locally for debugging
function storeErrorLocally(errorData) {
  try {
    const errors = JSON.parse(localStorage.getItem('gracia_error_log') || '[]');
    errors.push(errorData);

    // Keep only last 50 errors
    if (errors.length > 50) {
      errors.splice(0, errors.length - 50);
    }

    localStorage.setItem('gracia_error_log', JSON.stringify(errors));
  } catch (e) {
    // Ignore storage errors
  }
}

// Get stored errors for debugging
export function getStoredErrors() {
  try {
    return JSON.parse(localStorage.getItem('gracia_error_log') || '[]');
  } catch (e) {
    return [];
  }
}

// Clear stored errors
export function clearStoredErrors() {
  localStorage.removeItem('gracia_error_log');
}

// Send error to custom API
async function sendToErrorAPI(errorData) {
  if (!config.api.baseUrl) return;

  try {
    await fetch(`${config.api.baseUrl}/errors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(errorData)
    });
  } catch (e) {
    // Silently fail
  }
}

// Export error reporting for window
if (typeof window !== 'undefined') {
  window.reportError = reportError;
}

export default {
  initErrorReporting,
  reportError,
  reportMessage,
  setUser,
  addBreadcrumb,
  getStoredErrors,
  clearStoredErrors
};
