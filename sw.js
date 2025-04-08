const CACHE_NAME = 'vcard-qr-v3';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './sentry.js',
    'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// Pre-cache assets during installation
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Serve from cache, falling back to network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // Return cached response immediately
                    return cachedResponse;
                }

                // If not in cache, fetch from network
                return fetch(event.request)
                    .then(response => {
                        // Don't cache if not a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Cache the new response
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Return a custom offline page or message
                        return new Response(
                            'You are offline. Please check your internet connection.',
                            {
                                headers: { 'Content-Type': 'text/plain' }
                            }
                        );
                    });
            })
    );
});
