// TERRA Sessioni: tiene l'app sul telefono, cosi' si apre anche senza internet.
const CACHE = "terra-sessioni-1.0";
const FILE = ["./", "index.html", "manifest.webmanifest", "icona-192.png", "icona-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((kk) => Promise.all(kk.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// prima la rete (per avere gli aggiornamenti), senza rete la copia sul telefono
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("index.html"))));
});
