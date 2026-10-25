// Session Timeout Hook for Admin Dashboard
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE = 5 * 60 * 1000; // 5 minutes before timeout

export function useSessionTimeout(options = {}) {
  const {
    timeout = DEFAULT_TIMEOUT,
    warningBefore = WARNING_BEFORE,
    onTimeout,
    onWarning,
    enabled = true
  } = options;

  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [remainingTime, setRemainingTime] = useState(timeout);
  const [isActive, setIsActive] = useState(true);

  const timeoutRef = useRef(null);
  const warningRef = useRef(null);
  const countdownRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const navigate = useNavigate();

  // Reset the timeout
  const resetTimeout = useCallback(() => {
    lastActivityRef.current = Date.now();
    setRemainingTime(timeout);
    setIsWarningVisible(false);
    setIsActive(true);

    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    if (!enabled) return;

    // Set warning timer
    warningRef.current = setTimeout(() => {
      setIsWarningVisible(true);
      if (onWarning) onWarning();

      // Start countdown
      countdownRef.current = setInterval(() => {
        const elapsed = Date.now() - lastActivityRef.current;
        const remaining = Math.max(0, timeout - elapsed);
        setRemainingTime(remaining);

        if (remaining <= 0) {
          clearInterval(countdownRef.current);
        }
      }, 1000);
    }, timeout - warningBefore);

    // Set timeout timer
    timeoutRef.current = setTimeout(() => {
      handleTimeout();
    }, timeout);
  }, [timeout, warningBefore, enabled, onWarning]);

  // Handle session timeout
  const handleTimeout = useCallback(() => {
    setIsActive(false);
    setIsWarningVisible(false);

    // Clear all timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    // Clear admin session
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    sessionStorage.removeItem('admin_session');

    // Call custom handler or navigate to login
    if (onTimeout) {
      onTimeout();
    } else {
      navigate('/admin/login', {
        state: { message: 'Your session has expired. Please log in again.' }
      });
    }
  }, [onTimeout, navigate]);

  // Extend session (user clicked "Stay Logged In")
  const extendSession = useCallback(() => {
    resetTimeout();
  }, [resetTimeout]);

  // Logout manually
  const logout = useCallback(() => {
    handleTimeout();
  }, [handleTimeout]);

  // Track user activity
  useEffect(() => {
    if (!enabled) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

    const handleActivity = () => {
      // Debounce activity tracking
      const now = Date.now();
      if (now - lastActivityRef.current > 1000) {
        resetTimeout();
      }
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timeout setup
    resetTimeout();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [enabled, resetTimeout]);

  // Handle visibility change (pause when tab is hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause countdown display but keep timeout running
      } else {
        // Resume and check if we should have timed out
        const elapsed = Date.now() - lastActivityRef.current;
        if (elapsed >= timeout) {
          handleTimeout();
        } else {
          setRemainingTime(timeout - elapsed);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [timeout, handleTimeout]);

  // Format remaining time for display
  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    isWarningVisible,
    remainingTime,
    remainingTimeFormatted: formatTime(remainingTime),
    isActive,
    extendSession,
    logout,
    resetTimeout
  };
}

// Session Timeout Warning Component
import React from 'react';
import { AlertTriangle, Clock, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SessionTimeoutWarning({
  isVisible,
  remainingTime,
  onExtend,
  onLogout
}) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-center text-stone-900 mb-2">
          Session Expiring Soon
        </h2>

        <p className="text-stone-600 text-center mb-4">
          Your session will expire due to inactivity. Do you want to stay logged in?
        </p>

        <div className="flex items-center justify-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-stone-400" />
          <span className="text-2xl font-mono font-bold text-stone-900">
            {remainingTime}
          </span>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </Button>

          <Button
            className="flex-1 gap-2 bg-[#2D5016] hover:bg-[#4A7C23]"
            onClick={onExtend}
          >
            <RefreshCw className="w-4 h-4" />
            Stay Logged In
          </Button>
        </div>
      </div>
    </div>
  );
}

export default useSessionTimeout;
