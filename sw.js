const CACHE_NAME = 'vcard-qr-v1';
const ASSETS = [
    '/cardkick2/',
    '/cardkick2/index.html',
    '/cardkick2/style.css',
    '/cardkick2/app.js',
    'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js'
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
            .then(response => response || fetch(event.request))
    );
});
