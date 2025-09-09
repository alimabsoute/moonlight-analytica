// Moonlight Analytica Service Worker
// Version 1.0.0 - Mobile-First Performance Optimization

const CACHE_NAME = 'moonlight-analytica-v1';
const STATIC_CACHE = 'moonlight-static-v1';
const DYNAMIC_CACHE = 'moonlight-dynamic-v1';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/moonlight-complete-structure.html',
  '/solutions.html',
  '/contact.html',
  '/insights.html',
  '/news.html',
  '/trends.html',
  '/products-discovery.html',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap',
  'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2'
];

// Resources to cache on first request
const DYNAMIC_ASSETS = [
  'https://www.googletagmanager.com/gtag/js',
  'https://www.clarity.ms/tag/'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(DYNAMIC_CACHE)
    ])
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests
  if (request.method === 'GET') {
    // Static HTML pages - Cache First
    if (request.destination === 'document' || url.pathname.endsWith('.html')) {
      event.respondWith(cacheFirst(request, STATIC_CACHE));
    }
    
    // Fonts - Cache First (long term caching)
    else if (request.destination === 'font' || url.pathname.includes('fonts')) {
      event.respondWith(cacheFirst(request, STATIC_CACHE, 86400000)); // 24 hours
    }
    
    // Analytics scripts - Network First (need fresh data)
    else if (url.hostname.includes('google') || url.hostname.includes('clarity')) {
      event.respondWith(networkFirst(request, DYNAMIC_CACHE, 3600000)); // 1 hour
    }
    
    // API calls - Network First with short cache
    else if (url.pathname.includes('/api/') || request.destination === 'empty') {
      event.respondWith(networkFirst(request, DYNAMIC_CACHE, 300000)); // 5 minutes
    }
    
    // Everything else - Stale While Revalidate
    else {
      event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
    }
  }
});

// Cache First Strategy - Good for static assets
async function cacheFirst(request, cacheName, maxAge = 3600000) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      const dateHeader = cachedResponse.headers.get('date');
      const cachedTime = dateHeader ? new Date(dateHeader).getTime() : 0;
      const isExpired = Date.now() - cachedTime > maxAge;
      
      if (!isExpired) {
        return cachedResponse;
      }
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Network error occurred', { 
      status: 408,
      statusText: 'Request Timeout' 
    });
  }
}

// Network First Strategy - Good for dynamic content
async function networkFirst(request, cacheName, maxAge = 300000) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      const dateHeader = cachedResponse.headers.get('date');
      const cachedTime = dateHeader ? new Date(dateHeader).getTime() : 0;
      const isExpired = Date.now() - cachedTime > maxAge;
      
      if (!isExpired) {
        return cachedResponse;
      }
    }
    
    return new Response('Content unavailable offline', { 
      status: 503,
      statusText: 'Service Unavailable' 
    });
  }
}

// Stale While Revalidate - Good for regular updates
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// Background sync for offline form submissions
self.addEventListener('sync', event => {
  if (event.tag === 'contact-form-sync') {
    event.waitUntil(syncContactForms());
  }
  
  if (event.tag === 'email-signup-sync') {
    event.waitUntil(syncEmailSignups());
  }
});

// Sync contact form submissions when online
async function syncContactForms() {
  try {
    const cache = await caches.open('offline-forms');
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('contact-form')) {
        const formData = await cache.match(request);
        const data = await formData.json();
        
        try {
          await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          
          cache.delete(request);
        } catch (error) {
          console.log('Failed to sync contact form:', error);
        }
      }
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

// Sync email signups when online
async function syncEmailSignups() {
  try {
    const cache = await caches.open('offline-forms');
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('email-signup')) {
        const formData = await cache.match(request);
        const data = await formData.json();
        
        try {
          await fetch('/api/newsletter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          
          cache.delete(request);
        } catch (error) {
          console.log('Failed to sync email signup:', error);
        }
      }
    }
  } catch (error) {
    console.log('Email signup sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New update from Moonlight Analytica',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: '/icon-explore.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Moonlight Analytica', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/?utm_source=push_notification&utm_medium=web_push')
    );
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Performance monitoring
self.addEventListener('message', event => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    );
  }
});