// Initialize Sentry when loaded
window.sentryOnLoad = function() {
  if (typeof Sentry !== 'undefined') {
    Sentry.init({
      enableInternalErrorTracking: true,
      debug: false,
      tracesSampleRate: 1.0,
      replaysOnErrorSampleRate: 1.0
    });

    window.addEventListener('unhandledrejection', function(event) {
      Sentry.captureException(event.reason);
    });

    Sentry.lazyLoadIntegration("feedbackIntegration")
      .then((feedbackIntegration) => {
        Sentry.addIntegration(feedbackIntegration({
          autoInject: true,
          isEmailRequired: false
        }));
      })
      .catch((error) => {
        console.warn('Failed to load Sentry feedback integration:', error);
      });
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
