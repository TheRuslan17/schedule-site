// ============================================
// SERVICE WORKER — ПОЛНОЕ ОБНОВЛЕНИЕ
// ============================================
const CACHE_NAME = 'schedule-v3'; // Меняйте версию при каждом обновлении
const ASSETS = [
    '/schedule-site/',
    '/schedule-site/index.html',
    '/schedule-site/style.css',
    '/schedule-site/script.js',
    '/schedule-site/schedule.json',
    '/schedule-site/НХТК.jpg'
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
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// ===== ПЕРЕХВАТ ЗАПРОСОВ =====
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
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
                return caches.match(event.request);
            })
    );
});

// ===== ОБРАБОТКА СООБЩЕНИЙ =====
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});