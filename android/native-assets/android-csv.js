(() => {
  'use strict';
  if (window.__bseCsvHookInstalled || !window.BSEAndroidCsv) return;
  window.__bseCsvHookInstalled = true;
  const origin = 'https://appassets.androidplatform.net';
  const originalClick = HTMLAnchorElement.prototype.click;
  const maxBytes = 5 * 1024 * 1024;
  function exportCsv(anchor) {
    if (!anchor || !anchor.download || !/\.csv$/i.test(anchor.download) ||
        !anchor.href.startsWith('blob:' + origin + '/')) return false;
    // Start fetch immediately: dashboard exporters may revoke their object URLs after click().
    fetch(anchor.href)
      .then(response => response.blob())
      .then(async blob => {
        if (!/^text\/csv(?:;|$)/i.test(blob.type) || blob.size > maxBytes) {
          throw new Error('CSV files must be under 5 MB.');
        }
        window.BSEAndroidCsv.postMessage(JSON.stringify({
          type: 'csv', name: anchor.download, text: await blob.text()
        }));
      })
      .catch(() => window.alert('CSV export failed. Android CSV exports are limited to 5 MB.'));
    return true;
  }
  // The dashboard's anchor is intentionally detached from the DOM, so capture clicks alone is insufficient.
  HTMLAnchorElement.prototype.click = function () {
    if (!exportCsv(this)) return originalClick.call(this);
  };
  document.addEventListener('click', event => {
    const anchor = event.target && event.target.closest ? event.target.closest('a[download]') : null;
    if (exportCsv(anchor)) event.preventDefault();
  }, true);
})();
