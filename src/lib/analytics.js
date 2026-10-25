// Analytics & Search Tracking for Gracia Visitor App
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'gracia_analytics';
const MAX_ENTRIES = 1000;

// Analytics event types
export const EventType = {
  PAGE_VIEW: 'page_view',
  SEARCH: 'search',
  CLICK: 'click',
  BOOKING: 'booking',
  FAVORITE: 'favorite',
  SHARE: 'share',
  AI_CHAT: 'ai_chat',
  MAP_INTERACTION: 'map_interaction',
  ERROR: 'error'
};

// Get stored analytics
function getStoredAnalytics() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {
      events: [],
      searches: [],
      pageViews: {},
      sessions: []
    };
  } catch (e) {
    return { events: [], searches: [], pageViews: {}, sessions: [] };
  }
}

// Save analytics
function saveAnalytics(analytics) {
  try {
    // Trim if too large
    if (analytics.events.length > MAX_ENTRIES) {
      analytics.events = analytics.events.slice(-MAX_ENTRIES);
    }
    if (analytics.searches.length > MAX_ENTRIES) {
      analytics.searches = analytics.searches.slice(-MAX_ENTRIES);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(analytics));
  } catch (e) {
    console.error('Failed to save analytics:', e);
  }
}

// Track generic event
export function trackEvent(type, data = {}) {
  const analytics = getStoredAnalytics();

  analytics.events.push({
    type,
    data,
    timestamp: new Date().toISOString(),
    url: window.location.pathname,
    sessionId: getSessionId()
  });

  saveAnalytics(analytics);

  // Send to external analytics if configured
  sendToExternalAnalytics(type, data);
}

// Track page view
export function trackPageView(path, title) {
  const analytics = getStoredAnalytics();
  const page = path || window.location.pathname;

  // Increment page view count
  if (!analytics.pageViews[page]) {
    analytics.pageViews[page] = { count: 0, lastVisit: null };
  }
  analytics.pageViews[page].count++;
  analytics.pageViews[page].lastVisit = new Date().toISOString();

  // Add to events
  analytics.events.push({
    type: EventType.PAGE_VIEW,
    data: { path: page, title: title || document.title },
    timestamp: new Date().toISOString(),
    sessionId: getSessionId()
  });

  saveAnalytics(analytics);
}

// Track search
export function trackSearch(query, results = null, category = null) {
  const analytics = getStoredAnalytics();

  analytics.searches.push({
    query: query.toLowerCase().trim(),
    resultsCount: results?.length || 0,
    category,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId()
  });

  saveAnalytics(analytics);
}

// Track AI chat question
export function trackAIQuestion(question, successful = true) {
  trackEvent(EventType.AI_CHAT, {
    question: question.substring(0, 200), // Truncate for storage
    successful
  });
}

// Track booking
export function trackBooking(eventId, eventTitle, participants = 1) {
  trackEvent(EventType.BOOKING, {
    eventId,
    eventTitle,
    participants
  });
}

// Track error
export function trackError(error, context = {}) {
  trackEvent(EventType.ERROR, {
    message: error.message || String(error),
    stack: error.stack?.substring(0, 500),
    ...context
  });
}

// Get session ID
function getSessionId() {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);

    // Track new session
    const analytics = getStoredAnalytics();
    analytics.sessions.push({
      id: sessionId,
      startTime: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
    saveAnalytics(analytics);
  }
  return sessionId;
}

// Send to external analytics (placeholder for Google Analytics, Mixpanel, etc.)
function sendToExternalAnalytics(type, data) {
  // Google Analytics 4
  if (window.gtag) {
    window.gtag('event', type, data);
  }

  // Mixpanel
  if (window.mixpanel) {
    window.mixpanel.track(type, data);
  }

  // Custom API
  const apiUrl = import.meta.env.VITE_ANALYTICS_API_URL;
  if (apiUrl) {
    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data, timestamp: new Date().toISOString() })
    }).catch(() => {}); // Ignore errors
  }
}

// Get analytics summary
export function getAnalyticsSummary() {
  const analytics = getStoredAnalytics();
  const now = new Date();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  // Filter events by time
  const eventsToday = analytics.events.filter(e => new Date(e.timestamp) > dayAgo);
  const eventsThisWeek = analytics.events.filter(e => new Date(e.timestamp) > weekAgo);

  // Top pages
  const topPages = Object.entries(analytics.pageViews)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([path, data]) => ({ path, ...data }));

  // Top searches
  const searchCounts = {};
  analytics.searches.forEach(s => {
    searchCounts[s.query] = (searchCounts[s.query] || 0) + 1;
  });
  const topSearches = Object.entries(searchCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([query, count]) => ({ query, count }));

  // Event type breakdown
  const eventBreakdown = {};
  analytics.events.forEach(e => {
    eventBreakdown[e.type] = (eventBreakdown[e.type] || 0) + 1;
  });

  return {
    totalEvents: analytics.events.length,
    eventsToday: eventsToday.length,
    eventsThisWeek: eventsThisWeek.length,
    totalSearches: analytics.searches.length,
    totalSessions: analytics.sessions.length,
    topPages,
    topSearches,
    eventBreakdown,
    recentSearches: analytics.searches.slice(-10).reverse()
  };
}

// Get search suggestions based on past searches
export function getSearchSuggestions(partial, limit = 5) {
  const analytics = getStoredAnalytics();
  const lowerPartial = partial.toLowerCase();

  // Get unique searches that match
  const matches = new Set();
  for (const search of analytics.searches) {
    if (search.query.includes(lowerPartial)) {
      matches.add(search.query);
      if (matches.size >= limit) break;
    }
  }

  return Array.from(matches);
}

// Clear analytics
export function clearAnalytics() {
  localStorage.removeItem(STORAGE_KEY);
}

// Export analytics data
export function exportAnalytics() {
  const analytics = getStoredAnalytics();
  const blob = new Blob([JSON.stringify(analytics, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gracia-analytics-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// React hook for analytics
export function useAnalytics() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    setSummary(getAnalyticsSummary());
  }, []);

  const refresh = useCallback(() => {
    setSummary(getAnalyticsSummary());
  }, []);

  return {
    summary,
    refresh,
    trackEvent,
    trackPageView,
    trackSearch,
    trackAIQuestion,
    trackBooking,
    trackError,
    getSearchSuggestions,
    clearAnalytics,
    exportAnalytics
  };
}

// React hook for page view tracking
export function usePageTracking() {
  useEffect(() => {
    trackPageView();
  }, []);
}

export default {
  EventType,
  trackEvent,
  trackPageView,
  trackSearch,
  trackAIQuestion,
  trackBooking,
  trackError,
  getAnalyticsSummary,
  getSearchSuggestions,
  clearAnalytics,
  exportAnalytics,
  useAnalytics,
  usePageTracking
};
