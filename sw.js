/* UNESCO Dhaka NFC Card — offline cache (v2) */
const CACHE = 'nfc-v2.0.0';
const ASSETS = ["./", "index.html", "assets/style.css", "assets/common.js", "assets/app.js", "assets/qr.js", "assets/img/logo.webp", "assets/img/emblem.png", "assets/img/icon-192.png", "assets/fonts/hind-siliguri-bengali-400-normal.woff2", "assets/fonts/hind-siliguri-bengali-600-normal.woff2", "assets/fonts/hind-siliguri-latin-400-normal.woff2", "assets/fonts/hind-siliguri-latin-600-normal.woff2"];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;           // Firebase & others: always network
  if (/admin\.(html|js)$/.test(u.pathname)) return;                          // admin: never cached
  const fresh = r.mode === 'navigate' || /\/(config\.js|index\.html)?$/.test(u.pathname) || u.pathname.endsWith('config.js');
  if (fresh) {                                                                // network first, cache fallback
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); return res; }).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
  } else {                                                                    // cache first
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); } return res; })));
  }
});
