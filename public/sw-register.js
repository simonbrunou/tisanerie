(function () {
  if (!('serviceWorker' in navigator)) return;

  var host = location.hostname;
  var isDev =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '' ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host.endsWith('.local');

  if (isDev) {
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      return Promise.all(regs.map(function (r) { return r.unregister(); }));
    }).then(function () {
      if (typeof caches === 'undefined') return;
      return caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (k) { return caches.delete(k); }));
      });
    }).catch(function () {});
    return;
  }

  var current = document.currentScript;
  var base = (current && current.dataset && current.dataset.base) || '/';
  if (!base.endsWith('/')) base += '/';

  window.addEventListener('load', function () {
    navigator.serviceWorker.register(base + 'sw.js').catch(function () {});
  });
})();
