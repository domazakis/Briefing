/* Φαίδων, ημερήσιο δελτίο
   Ο κώδικας κρατιέται τοπικά ώστε η εφαρμογή να ανοίγει ακαριαία.
   Τα δεδομένα (Dropbox) ΔΕΝ κρατιούνται ποτέ εδώ: περνούν πάντα από το δίκτυο. */

var CACHE = "briefing-v1";
var SHELL = ["./", "./index.html", "./manifest.json", "./icon.svg"];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(SHELL).catch(function () {});
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (k) {
          if (k !== CACHE) return caches.delete(k);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (e) {
  var url = e.request.url;

  /* Dropbox και Google Fonts: πάντα από το δίκτυο, χωρίς αποθήκευση */
  if (url.indexOf("dropboxapi.com") >= 0 || url.indexOf("dropbox.com") >= 0) return;
  if (e.request.method !== "GET") return;

  e.respondWith(
    caches.match(e.request).then(function (hit) {
      if (hit) {
        /* σιωπηλή ανανέωση στο παρασκήνιο */
        fetch(e.request).then(function (r) {
          if (r && r.ok) caches.open(CACHE).then(function (c) { c.put(e.request, r); });
        }).catch(function () {});
        return hit;
      }
      return fetch(e.request).then(function (r) {
        if (r && r.ok && url.indexOf(self.registration.scope) === 0) {
          var copy = r.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return r;
      });
    })
  );
});
