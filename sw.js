// ============================================
// SERVICE WORKER — ОФЛАЙН-РЕЖИМ + АВТООБНОВЛЕНИЕ
// ============================================
const CACHE_NAME = 'schedule-v2'; // Увеличиваем версию для принудительного обновления
const ASSETS = [
    '/schedule-site/',
    '/schedule-site/index.html',
    '/schedule-site/style.css',
    '/schedule-site/script.js',
    '/schedule-site/login.html',
    '/schedule-site/admin-panel.html',
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
            .then(() => self.skipWaiting()) // Принудительная активация
    );
});

// ===== АКТИВАЦИЯ =====
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            // Удаляем старые кэши
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => {
            // Захватываем контроль над всеми клиентами
            return self.clients.claim();
        })
    );
});

// ===== ПЕРЕХВАТ ЗАПРОСОВ =====
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                // Если есть в кэше — отдаём, но проверяем обновления в фоне
                if (cached) {
                    // Фоновое обновление для schedule.json
                    if (event.request.url.includes('schedule.json')) {
                        fetch(event.request)
                            .then(response => {
                                if (response && response.status === 200) {
                                    caches.open(CACHE_NAME).then(cache => {
                                        cache.put(event.request, response);
                                    });
                                }
                            })
                            .catch(() => {});
                    }
                    return cached;
                }
                // Иначе грузим с сети
                return fetch(event.request)
                    .then(response => {
                        // Кэшируем успешные ответы
                        if (response && response.status === 200) {
                            const clone = response.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, clone);
                            });
                        }
                        return response;
                    })
                    .catch(() => {
                        // Офлайн-страница-заглушка
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

// ===== ПРОВЕРКА ОБНОВЛЕНИЙ =====
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});