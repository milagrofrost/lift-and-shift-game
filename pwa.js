/* Optional enhancement: never reload, prompt, or change a running game. */
(() => {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  // Regression srcdoc frames must remain isolated from the real app.
  if (window.top !== window.self) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', {updateViaCache: 'none'})
      .catch(error => console.warn('Offline support unavailable:', error));
  });
})();
