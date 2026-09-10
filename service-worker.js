const CACHE = 'pes3-coach-v1-5-pwa-1';
const APP_SHELL = [
  './','./index.html','./manifest.webmanifest',
  './css/base.css','./css/academy.css','./css/app.css','./css/free-kick.css',
  './js/core.js','./js/academy.js','./js/ui.js','./js/matchlab.js','./js/challenge.js','./js/v14.js','./js/free-kick.js','./js/pwa.js',
  './assets/icons/icon-192.png','./assets/icons/icon-512.png','./assets/icons/icon-maskable-512.png','./assets/icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if(event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  const req = event.request;
  const url = new URL(req.url);

  // Only manage same-origin app files. External resources keep normal browser behavior.
  if(url.origin !== self.location.origin) return;

  // Network-first prevents old CSS/JS from lingering after a deployment.
  event.respondWith(
    fetch(req)
      .then(res => {
        if(res && res.ok){
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        if(cached) return cached;
        if(req.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      })
  );
});
