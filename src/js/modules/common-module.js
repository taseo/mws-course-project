const commonModule = (function() {

  // register service worker
  const initServiceWorker = () => {

    if (navigator.serviceWorker) {

      navigator.serviceWorker.register('sw.js').then(() => {
        console.log('Service worker registered successfully');
      }).catch(() => {
        console.log('Service worker could not register');
      });
    }
  };

  // provide functionality for skip to content link
  const initSkipLink = () => {

    const mainContent = document.getElementById('content-start');

    document.getElementById('skip-content').addEventListener('click', (event) => {
      event.preventDefault();

      mainContent.setAttribute('tabindex', '1');
      mainContent.focus();
      mainContent.removeAttribute('tabindex');
    });
  };

  return {
    initServiceWorker,
    initSkipLink
  };

}());

export default commonModule;