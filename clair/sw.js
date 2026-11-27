const C='clair-v1';const A=['./','index.html','manifest.json',...Array.from({length:25},(_,i)=>'s/'+String(i+1).padStart(2,'0')+'.webp')];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(A))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
