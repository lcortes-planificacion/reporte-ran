/* Service worker del Reporte Estado de RAN.
   Estrategia: red primero (para tomar siempre la última versión publicada)
   y caché como respaldo cuando no hay señal. */

var CACHE = "reporte-ran-v1";
var ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./ran-192.png",
  "./ran-512.png",
  "./ran-maskable-512.png",
  "./ran-180.png"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ARCHIVOS); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.map(function(k){ return k===CACHE ? null : caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;                    /* nunca tocar los guardados a Supabase */
  var url = new URL(req.url);
  if(url.origin !== self.location.origin) return;     /* Supabase siempre va directo a la red */

  e.respondWith(
    fetch(req).then(function(r){
      var copia = r.clone();
      caches.open(CACHE).then(function(c){ c.put(req, copia); });
      return r;
    }).catch(function(){
      return caches.match(req).then(function(r){
        return r || caches.match("./index.html");
      });
    })
  );
});
