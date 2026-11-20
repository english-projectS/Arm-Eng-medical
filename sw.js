/* Offline cache for the English–Armenian medical dictionary.
   Bump VERSION whenever index.html changes so installed copies refresh. */
const VERSION="med-dict-v1";
const CORE=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png"];

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET")return;
  const url=new URL(req.url);
  /* pages: network first, fall back to the cached copy when offline */
  if(req.mode==="navigate"){
    e.respondWith(fetch(req).then(r=>{const copy=r.clone();caches.open(VERSION).then(c=>c.put("index.html",copy));return r})
      .catch(()=>caches.match("index.html").then(r=>r||caches.match("./"))));
    return;
  }
  /* everything else (own files, Google Fonts): cached copy first, refreshed in the background */
  if(url.origin===location.origin||/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)){
    e.respondWith(caches.match(req).then(hit=>{
      const net=fetch(req).then(r=>{if(r&&(r.ok||r.type==="opaque")){const copy=r.clone();caches.open(VERSION).then(c=>c.put(req,copy))}return r}).catch(()=>hit);
      return hit||net;
    }));
  }
});
