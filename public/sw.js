// Service Worker for Milo PWA
const CACHE_NAME = 'milo-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/placeholder.svg',
  '/favicon.ico'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Background sync for offline journal entries
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-journal') {
    event.waitUntil(syncJournalEntries());
  }
});

async function syncJournalEntries() {
  // This would sync any offline journal entries when connection is restored
  // Implementation would depend on your specific data sync requirements
  console.log('Background sync triggered for journal entries');
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'meditate') {
    // Open meditation page
    event.waitUntil(
      clients.openWindow('/meditation-challenge')
    );
  } else if (event.action === 'dismiss') {
    // Just dismiss - do nothing
    console.log('Meditation reminder dismissed');
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle push messages (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: data.tag || 'meditation-reminder',
      requireInteraction: false
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Milo Reminder', options)
    );
  }
});