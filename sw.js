// FitStock Service Worker
// IMPORTANT: Change CACHE_VERSION every time you upload a new index.html
// This forces ALL devices (including iPhone/iPad) to reload the new version
const CACHE_VERSION = 'fitstock-v12';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_VERSION).then(c =>
      c.addAll(['/index.html', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'])
        .catch(() => {})
    )
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    // Delete every cache that isn't the current version
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() =>
      caches.open(CACHE_VERSION).then(c =>
        c.addAll(['/index.html', '/manifest.json'])
          .catch(() => {})
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Always fetch index.html fresh from network — never serve stale
  if(url.pathname.endsWith('/') || url.pathname.endsWith('index.html') || url.pathname.endsWith('sw.js')){
    e.respondWith(
      fetch(e.request, {cache: 'no-store'}).then(res => {
        if(res && res.status === 200){
          const clone = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // For other assets: network first, cache fallback
  e.respondWith(
    fetch(e.request).then(res => {
      if(res && res.status === 200){
        const clone = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
