window.sentryOnLoad = function() {
  Sentry.init({
    // add other configuration here
  });

  Sentry.lazyLoadIntegration("feedbackIntegration")
    .then((feedbackIntegration) => {
      Sentry.addIntegration(feedbackIntegration({
  	autoInject: true
        // User Feedback configuration options
      }));
    })
    .catch(() => {
      // this can happen if e.g. a network error occurs,
      // in this case User Feedback will not be enabled
    });
};
