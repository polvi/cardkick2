const CACHE_NAME = 'vcard-qr-v2';
const ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/qrcode.min.js',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then(response => {
                    // Check if we received a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    // Clone the response as it can only be consumed once
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                }).catch(() => {
                    // Return a fallback response for offline scenarios
                    return new Response('Offline Mode - Some features may be limited');
                });
            })
    );
});
