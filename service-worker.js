const CACHE='pes3-coach-v1-4-pwa-1';
const APP_SHELL=[
  './','./index.html','./manifest.webmanifest',
  './css/base.css','./css/academy.css','./css/app.css',
  './js/core.js','./js/academy.js','./js/ui.js','./js/matchlab.js','./js/challenge.js','./js/v14.js','./js/pwa.js',
  './assets/icons/icon-192.png','./assets/icons/icon-512.png','./assets/icons/icon-maskable-512.png','./assets/icons/apple-touch-icon.png'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP_SHELL))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const req=event.request;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return res}).catch(()=>caches.match('./index.html')));return;
  }
  event.respondWith(caches.match(req).then(hit=>{
    const fresh=fetch(req).then(res=>{if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return res}).catch(()=>hit);
    return hit||fresh;
  }));
});
