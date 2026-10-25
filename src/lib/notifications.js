// Push Notifications Service for Gracia Visitor App

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
const API_URL = import.meta.env.VITE_API_URL || '';

// Check if push notifications are supported
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// Get current notification permission status
export function getNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

// Request notification permission
export async function requestNotificationPermission() {
  if (!isPushSupported()) {
    console.warn('Push notifications not supported');
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await subscribeToPush();
    }
    return permission;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return 'denied';
  }
}

// Subscribe to push notifications
export async function subscribeToPush() {
  if (!isPushSupported()) {
    throw new Error('Push notifications not supported');
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Send subscription to server
      await sendSubscriptionToServer(subscription);
    }

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
    throw error;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      await removeSubscriptionFromServer(subscription);
    }

    return true;
  } catch (error) {
    console.error('Failed to unsubscribe from push:', error);
    throw error;
  }
}

// Send subscription to server
async function sendSubscriptionToServer(subscription) {
  if (!API_URL) {
    // Store locally if no API
    localStorage.setItem('push_subscription', JSON.stringify(subscription));
    return;
  }

  try {
    await fetch(`${API_URL}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscription,
        userId: localStorage.getItem('user_id'),
        preferences: getNotificationPreferences()
      })
    });
  } catch (error) {
    console.error('Failed to send subscription to server:', error);
    // Store locally as fallback
    localStorage.setItem('push_subscription', JSON.stringify(subscription));
  }
}

// Remove subscription from server
async function removeSubscriptionFromServer(subscription) {
  if (!API_URL) {
    localStorage.removeItem('push_subscription');
    return;
  }

  try {
    await fetch(`${API_URL}/notifications/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint
      })
    });
    localStorage.removeItem('push_subscription');
  } catch (error) {
    console.error('Failed to remove subscription from server:', error);
  }
}

// Get notification preferences
export function getNotificationPreferences() {
  const defaults = {
    events: true,
    announcements: true,
    bookingReminders: true,
    zoneClosure: true,
    emergency: true,
    marketing: false
  };

  try {
    const saved = localStorage.getItem('notification_preferences');
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  } catch {
    return defaults;
  }
}

// Save notification preferences
export function saveNotificationPreferences(preferences) {
  localStorage.setItem('notification_preferences', JSON.stringify(preferences));

  // Update server if subscribed
  const subscription = localStorage.getItem('push_subscription');
  if (subscription && API_URL) {
    fetch(`${API_URL}/notifications/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        endpoint: JSON.parse(subscription).endpoint,
        preferences
      })
    }).catch(console.error);
  }
}

// Show local notification (for in-app notifications)
export function showLocalNotification(title, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.warn('Notifications not available');
    return;
  }

  const notification = new Notification(title, {
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: 'gracia-local',
    ...options
  });

  notification.onclick = () => {
    window.focus();
    if (options.data?.url) {
      window.location.href = options.data.url;
    }
    notification.close();
  };

  return notification;
}

// Schedule a local notification
export function scheduleNotification(title, options = {}, delay = 0) {
  if (delay <= 0) {
    return showLocalNotification(title, options);
  }

  const timeoutId = setTimeout(() => {
    showLocalNotification(title, options);
  }, delay);

  // Store timeout for potential cancellation
  const scheduled = JSON.parse(localStorage.getItem('scheduled_notifications') || '[]');
  scheduled.push({
    id: timeoutId,
    title,
    options,
    scheduledFor: Date.now() + delay
  });
  localStorage.setItem('scheduled_notifications', JSON.stringify(scheduled));

  return timeoutId;
}

// Cancel scheduled notification
export function cancelScheduledNotification(timeoutId) {
  clearTimeout(timeoutId);

  const scheduled = JSON.parse(localStorage.getItem('scheduled_notifications') || '[]');
  const updated = scheduled.filter(n => n.id !== timeoutId);
  localStorage.setItem('scheduled_notifications', JSON.stringify(updated));
}

// Helper: Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  if (!base64String) {
    return new Uint8Array();
  }

  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// React hook for notifications
import { useState, useEffect } from 'react';

export function useNotifications() {
  const [permission, setPermission] = useState(getNotificationPermission());
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [preferences, setPreferences] = useState(getNotificationPreferences());

  useEffect(() => {
    checkSubscription();
  }, []);

  async function checkSubscription() {
    if (!isPushSupported()) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Failed to check subscription:', error);
    }
  }

  async function enable() {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      setIsSubscribed(true);
    }
    return result;
  }

  async function disable() {
    await unsubscribeFromPush();
    setIsSubscribed(false);
  }

  function updatePreferences(newPrefs) {
    const updated = { ...preferences, ...newPrefs };
    saveNotificationPreferences(updated);
    setPreferences(updated);
  }

  return {
    isSupported: isPushSupported(),
    permission,
    isSubscribed,
    preferences,
    enable,
    disable,
    updatePreferences,
    showNotification: showLocalNotification
  };
}

export default {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getNotificationPreferences,
  saveNotificationPreferences,
  showLocalNotification,
  scheduleNotification,
  cancelScheduledNotification,
  useNotifications
};
