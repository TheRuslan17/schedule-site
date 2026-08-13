// ============================================
// SERVICE WORKER — ОФЛАЙН-РЕЖИМ
// ============================================
const CACHE_NAME = 'schedule-v1';
const ASSETS = [
    '/schedule-site/',
    '/schedule-site/index.html',
    '/schedule-site/manifest.json',
    '/schedule-site/logo.png',
    '/schedule-site/НХТК.jpg',
    '/schedule-site/schedule.json'
];

// ===== УСТАНОВКА =====
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Кэширование ресурсов...');
                return cache.addAll(ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// ===== АКТИВАЦИЯ =====
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// ===== ПЕРЕХВАТ ЗАПРОСОВ =====
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                if (cached) {
                    if (event.request.url.includes('schedule.json')) {
                        fetch(event.request)
                            .then(response => {
                                caches.open(CACHE_NAME).then(cache => {
                                    cache.put(event.request, response);
                                });
                            })
                            .catch(() => {});
                    }
                    return cached;
                }
                return fetch(event.request)
                    .then(response => {
                        if (response && response.status === 200) {
                            const clone = response.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, clone);
                            });
                        }
                        return response;
                    })
                    .catch(() => {
                        if (event.request.mode === 'navigate') {
                            return caches.match('/schedule-site/index.html');
                        }
                        return new Response('Офлайн-режим', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});