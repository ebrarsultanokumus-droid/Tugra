// Offline-Speicher für Tuğra.
// Die App selbst wird immer zuerst frisch aus dem Netz geholt (so kommen neue Versionen sofort an)
// und nur ohne Internet aus dem Speicher geladen. Deine Einträge liegen NICHT hier, sondern im Gerät und in Firebase.
const CACHE = 'tugra-shell-v2';
const FB_VER = '10.12.2';
const LIBS = ['app', 'auth', 'firestore'].map(n => `https://www.gstatic.com/firebasejs/${FB_VER}/firebase-${n}-compat.js`);
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png', './firebase-config.js'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all([...SHELL, ...LIBS].map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const netFirst = async req => {
  const c = await caches.open(CACHE);
  try { const r = await fetch(req, {cache: 'no-store'}); if (r && r.ok) c.put(req, r.clone()); return r; }
  catch (e) { return (await c.match(req, {ignoreSearch: true})) || (await c.match('./index.html')) || Response.error(); }
};
const cacheFirst = async req => {
  const c = await caches.open(CACHE), hit = await c.match(req);
  if (hit) return hit;
  const r = await fetch(req); if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r;
};
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin === location.origin) { e.respondWith(netFirst(req)); return; }
  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com' || (u.hostname === 'www.gstatic.com' && u.pathname.startsWith('/firebasejs/'))) e.respondWith(cacheFirst(req));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type: 'window'}).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./')));
});
