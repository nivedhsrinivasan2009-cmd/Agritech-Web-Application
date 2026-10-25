// Service Worker for Gracia Visitor App
// Provides offline support and caching

const CACHE_NAME = 'gracia-app-v1';
const STATIC_CACHE = 'gracia-static-v1';
const DYNAMIC_CACHE = 'gracia-dynamic-v1';
const API_CACHE = 'gracia-api-v1';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

// API routes to cache
const API_ROUTES = [
  '/api/events',
  '/api/activities',
  '/api/shops',
  '/api/zones',
  '/api/announcements'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== API_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Handle static assets and pages
  event.respondWith(cacheFirstStrategy(request));
});

// Cache-first strategy for static assets
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Return cached response and update cache in background
      updateCache(request);
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Fetch failed, returning offline page:', error);
    const offlineResponse = await caches.match('/offline.html');
    return offlineResponse || new Response('Offline', { status: 503 });
  }
}

// Network-first strategy for API requests
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response(JSON.stringify({ error: 'Offline', cached: false }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Update cache in background
async function updateCache(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    // Silently fail - we already have a cached version
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  let data = {
    title: 'Gracia Farm',
    body: 'You have a new notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: 'gracia-notification',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      data: data.data,
      vibrate: [100, 50, 100],
      actions: [
        { action: 'open', title: 'Open' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Open new window if none exists
      return clients.openWindow(urlToOpen);
    })
  );
});

// Handle background sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncBookings());
  }

  if (event.tag === 'sync-feedback') {
    event.waitUntil(syncFeedback());
  }
});

// Sync pending bookings
async function syncBookings() {
  try {
    const pendingBookings = await getFromIndexedDB('pending-bookings');
    for (const booking of pendingBookings) {
      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking)
      });
      await removeFromIndexedDB('pending-bookings', booking.id);
    }
  } catch (error) {
    console.error('[SW] Failed to sync bookings:', error);
  }
}

// Sync pending feedback
async function syncFeedback() {
  try {
    const pendingFeedback = await getFromIndexedDB('pending-feedback');
    for (const feedback of pendingFeedback) {
      await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback)
      });
      await removeFromIndexedDB('pending-feedback', feedback.id);
    }
  } catch (error) {
    console.error('[SW] Failed to sync feedback:', error);
  }
}

// IndexedDB helpers
function getFromIndexedDB(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('gracia-offline', 1);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        resolve([]);
        return;
      }
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const getAll = store.getAll();
      getAll.onsuccess = () => resolve(getAll.result);
      getAll.onerror = () => reject(getAll.error);
    };
    request.onerror = () => reject(request.error);
  });
}

function removeFromIndexedDB(storeName, id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('gracia-offline', 1);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
}

console.log('[SW] Service worker loaded');
