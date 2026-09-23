/* ===================================================================
   RUTUJA — service worker (v22r)
   Keeps the site's own files on the phone so a repeat visit opens from
   the phone's copy, while a fresh copy is fetched quietly behind it.

   Page (index.html)      network first; the phone's copy only if offline,
                          so a new version is always seen when online.
   Versioned files (?v=)  from the phone's copy — a new version has a new
                          URL, so a stale file can never be served.
   Images and fonts       the phone's copy at once, refreshed behind it.
   Everything else — the Google Sheet, YouTube, anything sent — passes
   straight through untouched. Old copies are cleared when a new version
   of this file takes over.
   =================================================================== */
const CACHE = 'rutuja-v22r';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('rutuja-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
));

const put = (req, res) => {
  if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
  }
  return res;
};

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const own = url.origin === self.location.origin;
  const font = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!own && !font) return;

  if (req.mode === 'navigate') {
    /* The phone's copy of the page is shown at once — a repeat visit opens
       in a few hundred milliseconds instead of waiting for the network —
       and a fresh copy is fetched behind it and kept for the next visit.
       Every file the page then asks for carries ?v=, so a new version can
       never be served from an old copy. */
    e.respondWith(caches.match(req).then(hit => {
      const fresh = fetch(req).then(r => put(req, r)).catch(() => hit || caches.match('./'));
      return hit || fresh;
    }));
    return;
  }
  if (own && url.searchParams.has('v')) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => put(req, r))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {
    const fresh = fetch(req).then(r => put(req, r)).catch(() => hit);
    return hit || fresh;
  }));
});
