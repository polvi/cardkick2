const CACHE_NAME = 'cardkick-v2';
const ASSETS = [
    'index.html',
    'style.css',
    'app.js',
    'sentry.js',
    'debounce.js',
    'sw-register.js',
    'manifest.json',
    'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js'
];

// Pre-cache assets during installation
self.addEventListener('install', event => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            // Get the base URL from the registration
            const baseUrl = self.registration.scope;
            
            // Add base URL to relative paths, handling GitHub Pages paths
            const urlsToCache = ASSETS.map(path => {
                if (path.startsWith('http')) {
                    return path;
                }
                // Remove any leading slash to avoid double slashes
                const cleanPath = path.replace(/^\//, '');
                return new URL(cleanPath, baseUrl).href;
            });
            
            // Cache all assets
            await Promise.all(
                urlsToCache.map(url => 
                    cache.add(url).catch(err => {
                        console.error('Failed to cache:', url, err);
                        return Promise.resolve();
                    })
                )
            );
            
            await self.skipWaiting();
        })()
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

// Listen for skip waiting message
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
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
                                try {
                                    cache.put(event.request, responseToCache);
                                } catch (err) {
                                    console.error('Cache put error:', err);
                                }
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
