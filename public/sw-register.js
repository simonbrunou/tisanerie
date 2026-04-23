(function () {
  if (!('serviceWorker' in navigator)) return;

  var current = document.currentScript;
  var base = (current && current.dataset && current.dataset.base) || '/';
  if (!base.endsWith('/')) base += '/';

  window.addEventListener('load', function () {
    navigator.serviceWorker.register(base + 'sw.js').catch(function () {});
  });
})();
