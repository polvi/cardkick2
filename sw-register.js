async function registerServiceWorker(retryCount = 0) {
    const MAX_RETRIES = 3;
    const BACKOFF_MS = 1000 * Math.pow(2, retryCount);
    
    if (!('serviceWorker' in navigator)) {
        console.warn('ServiceWorker not supported');
        return;
    }

    if (!window.isSecureContext) {
        console.warn('ServiceWorker requires secure context (HTTPS or localhost)');
        return;
    }

    try {
        // Check for existing registration first
        const existingReg = await navigator.serviceWorker.getRegistration();
        if (existingReg) {
            await existingReg.unregister();
        }

        // Determine correct scope based on deployment path
        const scope = new URL('./', window.location.href).pathname;
        
        // Register new service worker with correct path
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none'
        });

        // Handle updates
        if (registration.waiting) {
            await registration.waiting.postMessage({type: 'SKIP_WAITING'});
        }

        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            newWorker.postMessage({type: 'SKIP_WAITING'});
                        }
                    }
                });
            }
        });

        // Listen for controller change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (registration.active) {
                console.log('New ServiceWorker activated');
            }
        });

        console.log('ServiceWorker registration successful for:', scope);

        // Verify registration was successful
        if (!registration.active && !registration.installing && !registration.waiting) {
            throw new Error('ServiceWorker registration resulted in invalid state');
        }

        return registration;
        
    } catch (err) {
        console.error('ServiceWorker registration failed:', err);

        if (typeof Sentry !== 'undefined') {
            Sentry.withScope(scope => {
                scope.setExtra('swSupported', 'serviceWorker' in navigator);
                scope.setExtra('isSecureContext', window.isSecureContext);
                scope.setExtra('retryCount', retryCount);
                scope.setExtra('pathname', window.location.pathname);
                scope.setExtra('href', window.location.href);
                scope.setExtra('origin', window.location.origin);
                Sentry.captureException(err);
            });
        }

        // Retry with exponential backoff
        if (retryCount < MAX_RETRIES) {
            console.log(`Retrying ServiceWorker registration in ${BACKOFF_MS}ms...`);
            setTimeout(() => registerServiceWorker(retryCount + 1), BACKOFF_MS);
        }
    }
}

// Wait for DOM and all resources to load before registering
if (document.readyState === 'complete') {
    registerServiceWorker();
} else {
    window.addEventListener('load', () => registerServiceWorker());
}
