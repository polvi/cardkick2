// Initialize Sentry when loaded
window.sentryOnLoad = function() {
  try {
    if (typeof Sentry !== 'undefined') {
      Sentry.init({
        enableInternalErrorTracking: true,
        debug: false,
        tracesSampleRate: 1.0,
        replaysOnErrorSampleRate: 1.0,
        initialScope: {
          tags: {
            environment: 'production'
          }
        }
      });

      window.addEventListener('unhandledrejection', function(event) {
        Sentry.captureException(event.reason);
      });

      // Load feedback integration with proper scope
      Sentry.lazyLoadIntegration("feedbackIntegration")
        .then((feedbackIntegration) => {
          const integration = new feedbackIntegration({
            autoInject: true,
            isEmailRequired: false
          });
          Sentry.addIntegration(integration);
        })
        .catch((error) => {
          console.warn('Failed to load Sentry feedback integration:', error);
        });
    }
  } catch (error) {
    console.error('Error initializing Sentry:', error);
  }
};

// Create a safe wrapper for Sentry calls
window.safeSentry = {
  captureException: function(error) {
    if (typeof Sentry !== 'undefined') {
      Sentry.captureException(error);
    } else {
      console.error('Sentry not loaded:', error);
    }
  }
};
