const CACHE_NAME = 'goroom-v2';
const STATIC_ASSETS = ['/', '/index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('supabase.co')) {
    e.respondWith(fetch(e.request).then(res => { caches.open(CACHE_NAME).then(c => c.put(e.request, res.clone())); return res; }).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).then(res => { caches.open(CACHE_NAME).then(c => c.put(e.request, res.clone())); return res; })));
});

self.addEventListener('push', (e) => {
  const data = e.data?.json() || { title: '구롬', body: '새 알림' };
  e.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: '/icon-192.png' }));
});
