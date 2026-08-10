// ============================================
// КОНСТАНТЫ
// ============================================
const SCHEDULE_URL = 'schedule.json';

// ===== ПОГОДА =====
const WEATHER_API_KEY = '9652c71035f09eb62cc3f9730e00d99e';
const CITY = 'Nevinnomyssk';
const WEATHER_URL = `https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&appid=${WEATHER_API_KEY}&units=metric&lang=ru&cnt=6`;

// ===== РАСПИСАНИЕ ЗВОНКОВ =====
const CALLS_SCHEDULE = [
    { pair: 1, start: '08:00', end: '09:30', break: '20 мин' },
    { pair: 2, start: '09:50', end: '11:20', break: '30 мин' },
    { pair: 3, start: '11:50', end: '13:20', break: '10 мин' },
    { pair: 4, start: '13:30', end: '15:00', break: '10 мин' },
    { pair: 5, start: '15:10', end: '16:40', break: '10 мин' },
    { pair: 6, start: '16:50', end: '18:20', break: '10 мин' },
    { pair: 7, start: '18:30', end: '20:00', break: '—' }
];

let scheduleData = {};
let currentTab = 'schedule';
let isTransitioning = false;
let deferredPrompt;

// ============================================
// ФОРМАТИРОВАНИЕ ДАТЫ
// ============================================
function formatDate(date) {
    let d = date.getDate();
    let m = date.getMonth() + 1;
    let y = date.getFullYear();
    return (d < 10 ? '0' : '') + d + '.' + (m < 10 ? '0' : '') + m + '.' + y;
}

// ============================================
// ОПРЕДЕЛЕНИЕ НЕДЕЛИ (А или Б) — ПРОСТОЙ И НАДЁЖНЫЙ
// ============================================
function getCurrentWeekType() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();

    // ===== ЖЁСТКОЕ РАСПИСАНИЕ ДЛЯ СЕНТЯБРЯ 2026 =====
    if (year === 2026 && month === 8) {
        if (day >= 1 && day <= 6) return 'A';
        if (day >= 7 && day <= 13) return 'B';
        if (day >= 14 && day <= 20) return 'A';
        if (day >= 21 && day <= 27) return 'B';
        if (day >= 28 && day <= 30) return 'A';
    }

    // ===== ДЛЯ ОСТАЛЬНЫХ МЕСЯЦЕВ =====
    const startDate = new Date(year, 8, 1);
    if (now < startDate) {
        startDate.setFullYear(year - 1);
    }
    const diffDays = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffDays / 7) + 1;
    return weekNumber % 2 === 0 ? 'B' : 'A';
}

// ============================================
// ПОЛУЧЕНИЕ ДАТЫ ПО ДНЮ НЕДЕЛИ
// ============================================
function getDateByDayName(dayName) {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const now = new Date();
    const todayIndex = now.getDay();
    const targetIndex = days.indexOf(dayName);
    let diff = targetIndex - todayIndex;
    if (diff < 0) diff += 7;
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + diff);
    return formatDate(targetDate);
}

// ============================================
// ОТОБРАЖЕНИЕ ДАТЫ И НОМЕРА НЕДЕЛИ
// ============================================
function updateDateAndWeek() {
    const now = new Date();
    const dateStr = formatDate(now);
    const weekType = getCurrentWeekType();
    const weekLabel = weekType === 'A' ? 'Неделя А' : 'Неделя Б';
    const days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
    const dayName = days[now.getDay()];
    document.getElementById('currentDate').textContent = `📅 ${dateStr}, ${dayName}`;
    document.getElementById('currentWeek').textContent = `📆 ${weekLabel}`;
}

// ============================================
// ОТОБРАЖЕНИЕ ПАР (поддерживает массивы)
// ============================================
function renderPairs(pairData, key, weekType) {
    const time = getPairTime(parseInt(key));

    if (Array.isArray(pairData)) {
        // Фильтруем массив по неделе
        const filtered = pairData.filter(p => p.week === 'both' || p.week === weekType);
        if (filtered.length === 0) return '';

        let html = `
            <div class="pair-group">
                <div class="pair-group-header">
                    <span class="pair-number">📗 ${key} пара</span>
                    <span class="pair-time">🕒 ${time}</span>
                </div>
        `;
        filtered.forEach(pair => {
            const icon = getSubjectIcon(pair.subject);
            html += `
                <div class="pair-item">
                    <span class="pair-subject">
                        <span class="subject-icon">${icon}</span>
                        ${pair.subject}
                    </span>
                    <span class="pair-meta">
                        ${pair.teacher ? `<span class="teacher">👨‍🏫 ${pair.teacher}</span>` : ''}
                        ${pair.room ? `<span class="room">📍 ${pair.room}</span>` : ''}
                        ${pair.building ? `<span class="building">🏢 ${pair.building}</span>` : ''}
                    </span>
                </div>
            `;
        });
        html += `</div>`;
        return html;
    }

    // Если это объект
    if (pairData.week && pairData.week !== 'both' && pairData.week !== weekType) {
        return ''; // Скрываем, если неделя не подходит
    }

    const icon = getSubjectIcon(pairData.subject);
    return `
        <div class="pair-group">
            <div class="pair-group-header">
                <span class="pair-number">📗 ${key} пара</span>
                <span class="pair-time">🕒 ${time}</span>
            </div>
            <div class="pair-item">
                <span class="pair-subject">
                    <span class="subject-icon">${icon}</span>
                    ${pairData.subject}
                </span>
                <span class="pair-meta">
                    ${pairData.teacher ? `<span class="teacher">👨‍🏫 ${pairData.teacher}</span>` : ''}
                    ${pairData.room ? `<span class="room">📍 ${pairData.room}</span>` : ''}
                    ${pairData.building ? `<span class="building">🏢 ${pairData.building}</span>` : ''}
                </span>
            </div>
        </div>
    `;
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================
function getPairTime(pairNum) {
    const times = {
        1: '08:00-09:30',
        2: '09:50-11:20',
        3: '11:50-13:20',
        4: '13:30-15:00',
        5: '15:10-16:40',
        6: '16:50-18:20',
        7: '18:30-20:00'
    };
    return times[pairNum] || `${pairNum} пара`;
}

function getSubjectIcon(subject) {
    const icons = {
        'Разговоры о важном': '💬',
        'Инструментальные средства разработки ПО': '🛠️',
        'Разработка мобильных приложений': '📱',
        'Математическое моделирование': '📐',
        'Технология разработки ПО': '💻',
        'Основы финансовой грамотности': '💰',
        'Физическая культура': '🏃',
        'Иностранный язык в профессиональной деятельности': '🌍'
    };
    return icons[subject] || '📘';
}

// ============================================
// ПОГОДА
// ============================================
async function fetchWeather() {
    const container = document.getElementById('weatherWidget');
    try {
        const response = await fetch(WEATHER_URL);
        if (!response.ok) throw new Error('Ошибка загрузки');
        const data = await response.json();
        const today = data.list[0];
        const todayEmoji = getWeatherEmoji(today.weather[0].icon);
        const todayTemp = Math.round(today.main.temp);
        const todayDesc = today.weather[0].description;
        const feelsLike = Math.round(today.main.feels_like);
        const tomorrow = data.list[4] || data.list[data.list.length - 1];
        const tomorrowEmoji = getWeatherEmoji(tomorrow.weather[0].icon);
        const tomorrowTemp = Math.round(tomorrow.main.temp);
        const tomorrowDesc = tomorrow.weather[0].description;
        container.innerHTML = `
            <div class="weather-content">
                <div class="weather-main">
                    <span class="weather-icon">${todayEmoji}</span>
                    <div class="weather-info">
                        <span class="weather-temp">${todayTemp}°C</span>
                        <span class="weather-desc">${todayDesc}</span>
                        <span class="weather-feels">Ощущается как ${feelsLike}°C</span>
                        <span class="weather-city">📍 ${data.city.name}</span>
                    </div>
                </div>
                <div class="weather-divider"></div>
                <div class="weather-tomorrow">
                    <span class="weather-tomorrow-label">Завтра</span>
                    <span class="weather-tomorrow-icon">${tomorrowEmoji}</span>
                    <span class="weather-tomorrow-temp">${tomorrowTemp}°C</span>
                    <span class="weather-tomorrow-desc">${tomorrowDesc}</span>
                </div>
            </div>
        `;
    } catch (e) {
        container.innerHTML = `<div class="weather-error">⚠️ Не удалось загрузить погоду</div>`;
    }
}

function getWeatherEmoji(icon) {
    const map = {
        '01d': '☀️', '01n': '🌙',
        '02d': '⛅', '02n': '☁️',
        '03d': '☁️', '03n': '☁️',
        '04d': '☁️', '04n': '☁️',
        '09d': '🌧️', '09n': '🌧️',
        '10d': '🌦️', '10n': '🌧️',
        '11d': '⛈️', '11n': '⛈️',
        '13d': '❄️', '13n': '❄️',
        '50d': '🌫️', '50n': '🌫️'
    };
    return map[icon] || '🌤️';
}

// ============================================
// PWA — УСТАНОВКА ПРИЛОЖЕНИЯ
// ============================================
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('installBanner').style.display = 'block';
});

function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('✅ Приложение установлено');
                document.getElementById('installBanner').style.display = 'none';
            }
            deferredPrompt = null;
        });
    }
}

function closeInstallBanner() {
    document.getElementById('installBanner').style.display = 'none';
}

window.addEventListener('appinstalled', () => {
    document.getElementById('installBanner').style.display = 'none';
});

// ============================================
// ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
// ============================================
function switchTab(tab) {
    if (isTransitioning || tab === currentTab) return;
    isTransitioning = true;
    const oldTab = document.getElementById(`tab-${currentTab}`);
    const newTab = document.getElementById(`tab-${tab}`);
    const oldBtn = document.querySelector(`.tab[data-tab="${currentTab}"]`);
    const newBtn = document.querySelector(`.tab[data-tab="${tab}"]`);
    oldTab.style.transition = 'opacity 0.2s ease, transform 0.25s ease';
    oldTab.style.opacity = '0';
    oldTab.style.transform = 'translateX(-8px)';
    setTimeout(() => {
        oldTab.classList.remove('active');
        oldTab.style.opacity = '';
        oldTab.style.transform = '';
        oldBtn.classList.remove('active');
        newTab.classList.add('active');
        newTab.style.transition = 'opacity 0.25s ease, transform 0.3s ease';
        newTab.style.opacity = '0';
        newTab.style.transform = 'translateX(8px)';
        newBtn.classList.add('active');
        requestAnimationFrame(() => {
            newTab.style.opacity = '1';
            newTab.style.transform = 'translateX(0)';
        });
        setTimeout(() => {
            newTab.style.opacity = '';
            newTab.style.transform = '';
            isTransitioning = false;
        }, 350);
    }, 250);
    currentTab = tab;
    if (tab === 'calls') renderCalls();
}

// ============================================
// РАСПИСАНИЕ ЗВОНКОВ
// ============================================
function renderCalls() {
    const container = document.getElementById('callsContainer');
    const timeLabels = [
        { key: 'morning', label: '🌅 Утро', icon: '☀️', pairs: CALLS_SCHEDULE.slice(0, 2) },
        { key: 'day', label: '☀️ День', icon: '🌤️', pairs: CALLS_SCHEDULE.slice(2, 5) },
        { key: 'evening', label: '🌙 Вечер', icon: '🌆', pairs: CALLS_SCHEDULE.slice(5, 7) }
    ];
    let html = `
        <div class="calls-container">
            <div class="calls-header-banner">
                <span class="banner-icon">⏰</span>
                <div>
                    <h3>Режим работы</h3>
                    <p>Актуальное расписание звонков на 2025/2026 учебный год</p>
                </div>
            </div>
    `;
    timeLabels.forEach(section => {
        if (!section.pairs || section.pairs.length === 0) return;
        html += `
            <div class="calls-section">
                <div class="calls-section-header">
                    <span class="section-icon">${section.icon}</span>
                    <span class="section-label">${section.label}</span>
                </div>
                <div class="calls-grid">
        `;
        section.pairs.forEach(call => {
            const pairEmoji = ['①', '②', '③', '④', '⑤', '⑥', '⑦'][call.pair - 1] || '🔢';
            html += `
                <div class="call-card" style="animation-delay: ${(call.pair - 1) * 0.08}s">
                    <div class="call-card-number">
                        <span class="pair-emoji">${pairEmoji}</span>
                        <span class="pair-number">${call.pair}</span>
                    </div>
                    <div class="call-card-time">
                        <div class="time-block">
                            <span class="time-label">Начало</span>
                            <span class="time-value">${call.start}</span>
                        </div>
                        <div class="time-divider">—</div>
                        <div class="time-block">
                            <span class="time-label">Конец</span>
                            <span class="time-value">${call.end}</span>
                        </div>
                    </div>
                    <div class="call-card-break">
                        <span class="break-icon">☕</span>
                        <span class="break-value">${call.break}</span>
                    </div>
                </div>
            `;
        });
        html += `
                </div>
            </div>
        `;
    });
    html += `
        <div class="calls-footer-info">
            <span>🕒 Всего пар: ${CALLS_SCHEDULE.length}</span>
            <span>⏱️ Общая длительность: 8 ч 30 мин</span>
            <span>📌 Обновлено: ${new Date().toLocaleDateString('ru-RU')}</span>
        </div>
    </div>
    `;
    container.innerHTML = html;
}

// ============================================
// ОТОБРАЖЕНИЕ РАСПИСАНИЯ ПО ДНЮ НЕДЕЛИ
// ============================================
function renderScheduleByDay(dayName, viewName) {
    const container = document.getElementById('scheduleContainer');
    const daySchedule = scheduleData[dayName] || {};
    const weekType = getCurrentWeekType();
    const pairKeys = Object.keys(daySchedule)
        .filter(key => daySchedule[key].week === 'both' || daySchedule[key].week === weekType)
        .sort((a, b) => parseInt(a) - parseInt(b));
    
    const dateStr = getDateByDayName(dayName);
    
    if (pairKeys.length === 0) {
        container.innerHTML = `
            <div class="no-schedule">
                📭 Расписания на ${dayName}, ${dateStr} нет
                <small>Возможно, это выходной день или начало семестра</small>
            </div>
        `;
        document.getElementById('currentView').textContent = viewName || `📅 ${dayName}`;
        return;
    }

    let html = `<div class="day-schedule"><div class="day-title">📅 ${dayName}, ${dateStr}</div>`;

    pairKeys.forEach(key => {
        const pair = daySchedule[key];
        const time = getPairTime(parseInt(key));
        const icon = getSubjectIcon(pair.subject);
        html += `
            <div class="pair-item">
                <span class="pair-group-header">
                    <span class="pair-number">📗 ${key} пара</span>
                    <span class="pair-time">🕒 ${time}</span>
                </span>
                <span class="pair-subject">
                    <span class="subject-icon">${icon}</span>
                    ${pair.subject}
                </span>
                <span class="pair-meta">
                    ${pair.teacher ? `<span class="teacher">👨‍🏫 ${pair.teacher}</span>` : ''}
                    ${pair.room ? `<span class="room">📍 ${pair.room}</span>` : ''}
                    ${pair.building ? `<span class="building">🏢 ${pair.building}</span>` : ''}
                    ${pair.note ? `<span class="note">📌 ${pair.note}</span>` : ''}
                </span>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
    document.getElementById('currentView').textContent = viewName || `📅 ${dayName}`;
}

// ============================================
// ЗАГРУЗКА ДАННЫХ
// ============================================
async function loadSchedule() {
    const container = document.getElementById('scheduleContainer');
    try {
        const response = await fetch(`${SCHEDULE_URL}?t=${Date.now()}`);
        if (!response.ok) throw new Error('Файл не найден');
        scheduleData = await response.json();
        const now = new Date();
        document.getElementById('updateTime').textContent =
            `Обновлено: ${now.toLocaleDateString('ru-RU')} ${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
        console.log('✅ Данные загружены, дней:', Object.keys(scheduleData).length);
        return true;
    } catch (e) {
        console.error('❌ Ошибка загрузки:', e);
        container.innerHTML = `
            <div class="no-schedule">
                📭 Расписание ещё не загружено
                <small>Пожалуйста, сообщите администратору</small>
            </div>
        `;
        return false;
    }
}

// ============================================
// КОМАНДЫ ЗАГРУЗКИ
// ============================================
async function loadToday() {
    const loaded = await loadSchedule();
    if (!loaded) return;
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const today = new Date();
    const dayName = days[today.getDay()];
    console.log('📅 Сегодня:', dayName);
    renderScheduleByDay(dayName, '📅 Сегодня');
    updateDateAndWeek();
}

async function loadTomorrow() {
    const loaded = await loadSchedule();
    if (!loaded) return;
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayName = days[tomorrow.getDay()];
    console.log('📅 Завтра:', dayName);
    renderScheduleByDay(dayName, '📅 Завтра');
    updateDateAndWeek();
}

async function loadWeek() {
    const loaded = await loadSchedule();
    if (!loaded) return;
    const container = document.getElementById('scheduleContainer');
    const weekDays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];
    const weekType = getCurrentWeekType();
    let html = '';
    let totalPairs = 0;
    let foundAny = false;
    console.log('📅 Тип недели (A/B):', weekType);
    weekDays.forEach(dayName => {
        const daySchedule = scheduleData[dayName] || {};
        const pairKeys = Object.keys(daySchedule)
            .filter(key => daySchedule[key].week === 'both' || daySchedule[key].week === weekType)
            .sort((a, b) => parseInt(a) - parseInt(b));
        const dateStr = getDateByDayName(dayName);
        if (pairKeys.length > 0) {
            foundAny = true;
            totalPairs += pairKeys.length;
            html += `<div class="day-schedule"><div class="day-title">📅 ${dayName}, ${dateStr}</div>`;
            pairKeys.forEach(key => {
                const pair = daySchedule[key];
                const time = getPairTime(parseInt(key));
                const icon = getSubjectIcon(pair.subject);
                html += `
                    <div class="pair-item">
                        <span class="pair-group-header">
                            <span class="pair-number">📗 ${key} пара</span>
                            <span class="pair-time">🕒 ${time}</span>
                        </span>
                        <span class="pair-subject">
                            <span class="subject-icon">${icon}</span>
                            ${pair.subject}
                        </span>
                        <span class="pair-meta">
                            ${pair.teacher ? `<span class="teacher">👨‍🏫 ${pair.teacher}</span>` : ''}
                            ${pair.room ? `<span class="room">📍 ${pair.room}</span>` : ''}
                            ${pair.building ? `<span class="building">🏢 ${pair.building}</span>` : ''}
                            ${pair.note ? `<span class="note">📌 ${pair.note}</span>` : ''}
                        </span>
                    </div>
                `;
            });
            html += '</div>';
        }
    });
    if (!foundAny) {
        html = `<div class="no-schedule">📭 Нет расписания на эту неделю</div>`;
    }
    container.innerHTML = html;
    document.getElementById('currentView').textContent = '📋 Вся неделя';
    updateDateAndWeek();
}

// ============================================
// ОТОБРАЖЕНИЕ РАСПИСАНИЯ ПО ДАТЕ
// ============================================
function renderScheduleByDate(dateStr, viewName) {
    const container = document.getElementById('scheduleContainer');
    const daySchedule = scheduleData[dateStr] || {};
    const weekType = getCurrentWeekType();

    // Определяем день недели по дате
    const parts = dateStr.split('.');
    const dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    const days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
    const dayName = days[dateObj.getDay()];

    const pairKeys = Object.keys(daySchedule).sort((a, b) => parseInt(a) - parseInt(b));

    let html = `<div class="day-schedule">
        <div class="day-title">📅 ${dateStr}, ${dayName} · ${weekType === 'A' ? 'Неделя А' : 'Неделя Б'}</div>
    `;

    let hasPairs = false;
    pairKeys.forEach(key => {
        const pairData = daySchedule[key];
        const rendered = renderPairs(pairData, key, weekType);
        if (rendered) {
            hasPairs = true;
            html += rendered;
        }
    });

    if (!hasPairs) {
        container.innerHTML = `
            <div class="no-schedule">
                📭 Расписания на ${dateStr} (${dayName}) нет
                <small>Возможно, это выходной день</small>
            </div>
        `;
        document.getElementById('currentView').textContent = viewName || `📅 ${dateStr}`;
        return;
    }

    html += '</div>';
    container.innerHTML = html;
    document.getElementById('currentView').textContent = viewName || `📅 ${dateStr}`;
}

// ============================================
// ВЫБОР ДАТЫ
// ============================================
async function loadDate(dateValue) {
    if (!dateValue) return;

    const loaded = await loadSchedule();
    if (!loaded) return;

    const parts = dateValue.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const day = parseInt(parts[2]);

    const dateStr = `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;

    if (scheduleData[dateStr]) {
        renderScheduleByDate(dateStr, `📅 ${dateStr}`);
        updateDateAndWeek();
    } else {
        document.getElementById('scheduleContainer').innerHTML = 
            `<div class="no-schedule">📭 Расписания на ${dateStr} нет</div>`;
    }
}

// ============================================
// PWA — ОБНОВЛЕНИЕ
// ============================================
async function checkForUpdates() {
    if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
        if (registration.waiting) {
            registration.waiting.postMessage('skipWaiting');
            setTimeout(() => {
                window.location.reload();
            }, 500);
        }
    }
}

setInterval(() => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.update();
        });
    }
}, 30000);

let newWorker;
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('updatefound', () => {
            newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    showUpdateNotification();
                }
            });
        });
    });
}

function showUpdateNotification() {
    if (sessionStorage.getItem('updateShown')) return;
    sessionStorage.setItem('updateShown', 'true');
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
        <div class="update-content">
            <span>🔄 Доступна новая версия приложения</span>
            <button onclick="updateApp()" class="update-btn">Обновить</button>
            <button onclick="closeUpdateNotification()" class="update-close">✕</button>
        </div>
    `;
    document.body.prepend(notification);
    setTimeout(() => {
        if (notification) {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }
    }, 10000);
}

function closeUpdateNotification() {
    const notification = document.querySelector('.update-notification');
    if (notification) {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
    }
    sessionStorage.removeItem('updateShown');
}

function updateApp() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            if (registration.waiting) {
                registration.waiting.postMessage('skipWaiting');
            }
            const status = document.createElement('div');
            status.className = 'update-status';
            status.textContent = '⏳ Обновление...';
            document.body.prepend(status);
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        });
    }
}

function addUpdateButton() {
    const footer = document.querySelector('.footer-main');
    if (footer) {
        const updateBtn = document.createElement('button');
        updateBtn.className = 'update-manual-btn';
        updateBtn.innerHTML = '🔄 Проверить обновления';
        updateBtn.onclick = manualUpdateCheck;
        footer.appendChild(updateBtn);
    }
}

function manualUpdateCheck() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.update();
            showToast('🔍 Проверка обновлений...');
            setTimeout(() => {
                if (registration.waiting) {
                    showUpdateNotification();
                } else {
                    showToast('✅ У вас актуальная версия');
                }
            }, 2000);
        });
    }
}

function showToast(text) {
    const existing = document.querySelector('.update-status');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'update-status';
    toast.textContent = text;
    document.body.prepend(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// ============================================
// КНОПКА "НАВЕРХ"
// ============================================
const handleBackToTop = () => {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    if (window.scrollY > 300) {
        btn.classList.add('visible');
    } else {
        btn.classList.remove('visible');
    }
};

const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.addEventListener('scroll', handleBackToTop);

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadToday();
    renderCalls();
    fetchWeather();
    updateDateAndWeek();
    setTimeout(addUpdateButton, 500);
    setTimeout(checkForUpdates, 1000);
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    document.getElementById('datePicker').value = `${year}-${month}-${day}`;
});