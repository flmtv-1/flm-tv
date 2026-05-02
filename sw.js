// FLM TV Service Worker
const CACHE_NAME = 'flmtv-v1';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/home.html',
    '/live.html',
    '/assets/logos/flm-logo.png',
];

// Install - cache static assets
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(function(key) {
                    return key !== CACHE_NAME;
                }).map(function(key) {
                    return caches.delete(key);
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch - network first, fall back to cache
self.addEventListener('fetch', function(event) {
    // Don't cache HLS streams or Jellyfin API calls
    if (event.request.url.includes('.m3u8') ||
        event.request.url.includes('.ts') ||
        event.request.url.includes('jellyfin') ||
        event.request.url.includes('duckdns') ||
        event.request.url.includes('firebase')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(function(response) {
                // Cache successful responses
                if (response && response.status === 200) {
                    var responseClone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(function() {
                // Fall back to cache if offline
                return caches.match(event.request);
            })
    );
});
