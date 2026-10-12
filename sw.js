// KonichiWhat offline cache.
// When you upload a new index.html, change VERSION (e.g. v1 -> v2) so phones fetch the update.
const VERSION = 'konichiwhat-v9';
const APP_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Cache-first: the app works fully offline once it has been opened online one time.
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        // Also keep a copy of the web fonts so they look right offline.
        if (res && (res.ok || res.type === 'opaque') && /fonts\.(googleapis|gstatic)\.com/.test(req.url)) {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => req.mode === 'navigate' ? caches.match('./index.html') : undefined);
    })
  );
});
