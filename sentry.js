window.sentryOnLoad = function() {
  Sentry.init({
    dsn: "https://personal-c0h.sentry.io",
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay()
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0
  });

  Sentry.lazyLoadIntegration("feedbackIntegration")
    .then((feedbackIntegration) => {
      Sentry.addIntegration(feedbackIntegration({
  	autoInject: true,
	isEmailRequired: false
        // User Feedback configuration options
      }));
    })
    .catch(() => {
      // this can happen if e.g. a network error occurs,
      // in this case User Feedback will not be enabled
    });
};
