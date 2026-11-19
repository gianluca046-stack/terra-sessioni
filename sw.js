// TERRA Sessioni: tiene l'app sul telefono, cosi' si apre anche senza internet.
const CACHE = "terra-sessioni-2.1";
const FILE = ["./", "index.html", "manifest.webmanifest", "icona-192.png", "icona-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((kk) => Promise.all(kk.filter((k) => k !== CACHE && k !== "terra-condiviso").map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// file condiviso da WhatsApp, email ecc. (Android: Condividi > TERRA Sessioni):
// lo mette da parte e apre l'app, che lo carica come "Apri file delle sessioni"
async function condiviso(req) {
  try {
    const fd = await req.formData();
    const ff = [], campi = [];
    for (const [k, v] of fd.entries()) { campi.push(k); if (v && typeof v === "object" && typeof v.arrayBuffer === "function") ff.push(v); }
    const f = ff.find((x) => /\.json$/i.test(x.name || "")) || ff.slice().sort((a, b) => b.size - a.size)[0];
    const c = await caches.open("terra-condiviso");
    const h = { "Content-Type": "application/octet-stream", "X-N": String(ff.length), "X-Campi": encodeURIComponent(campi.join(",")) };
    if (f) Object.assign(h, { "X-Nome": encodeURIComponent(f.name || ""), "X-Tipo": encodeURIComponent(f.type || ""), "X-Dim": String(f.size) });
    await c.put("condiviso", new Response(f ? await f.arrayBuffer() : new ArrayBuffer(0), { headers: h }));
  } catch (e) { /* l'app dira' "Nessun file ricevuto" */ }
  return Response.redirect("./?condiviso=1", 303);
}
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method === "POST" && u.origin === location.origin && u.pathname.endsWith("/condividi")) { e.respondWith(condiviso(e.request)); return; }
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  // prima la rete (per avere gli aggiornamenti), senza rete la copia sul telefono
  e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("index.html"))));
});
// tocco sulla notifica (fine sessione, controllo GDOP): riporta in primo piano l'app
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cc) => {
    for (const c of cc) if ("focus" in c) return c.focus();
    return self.clients.openWindow("./");
  }));
});
