// ============================================
// КОНСТАНТЫ
// ============================================
const SCHEDULE_URL = 'schedule.json';
const PAIR_TIMES = {
    1: '08:00-09:30',
    2: '09:50-11:20',
    3: '11:50-13:20',
    4: '13:30-15:00',
    5: '15:10-16:40',
    6: '16:50-18:20',
    7: '18:30-20:00'
};

// ===== ПОГОДА =====
const WEATHER_API_KEY = '9652c71035f09eb62cc3f9730e00d99e'; // Получить на openweathermap.org
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

const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const SUBJECT_ICONS = {
    'Технология разработки программного обеспечения': '💻',
    'Инструментальные средства разработки программного обеспечения': '🛠️',
    'Математическое моделирование': '📐',
    'Основы финансовой грамотности': '💰',
    'Физическая культура': '🏃',
    'Иностранный язык в профессиональной деятельности': '🌍',
    'Разработка мобильных приложений': '📱'
};

let scheduleData = {};
let currentView = 'today';
let currentWeekOffset = 0;
let currentTab = 'schedule';
let userRole = 'student';
let isTransitioning = false;
let deferredPrompt;

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
        container.innerHTML = `
            <div class="weather-error">
                ⚠️ Не удалось загрузить погоду
            </div>
        `;
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
            } else {
                console.log('❌ Установка отменена');
            }
            deferredPrompt = null;
        });
    }
}

function closeInstallBanner() {
    document.getElementById('installBanner').style.display = 'none';
}

window.addEventListener('appinstalled', () => {
    console.log('✅ Приложение успешно установлено');
    document.getElementById('installBanner').style.display = 'none';
});

// ============================================
// ПРОВЕРКА РОЛИ
// ============================================
function checkUserRole() {
    const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
    if (token) {
        userRole = 'admin';
        document.getElementById('roleBadge').textContent = '👑 Админ';
        document.getElementById('roleBadge').style.background = '#2da44e';
    } else {
        userRole = 'student';
        document.getElementById('roleBadge').textContent = '👤 Студент';
        document.getElementById('roleBadge').style.background = '#4a6cf7';
    }
}

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
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================
const getWeekday = (dateStr) => {
    try {
        const parts = dateStr.split('.');
        const d = new Date(parts[2], parts[1] - 1, parts[0]);
        return WEEKDAYS[d.getDay()];
    } catch {
        return '';
    }
};

const formatDate = (date) => {
    return date.toLocaleDateString('ru-RU');
};

const getTomorrow = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date;
};

const getSubjectIcon = (subject) => {
    if (!subject) return '📘';
    if (SUBJECT_ICONS[subject]) return SUBJECT_ICONS[subject];
    for (const [key, icon] of Object.entries(SUBJECT_ICONS)) {
        if (subject.includes(key)) return icon;
    }
    return '📘';
};

const getWeekDates = (offset = 0) => {
    const today = new Date();
    const day = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
    monday.setDate(monday.getDate() + offset * 7);
    
    const dates = [];
    for (let i = 0; i < 5; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        dates.push(formatDate(date));
    }
    return dates;
};

const getWeekRange = (offset = 0) => {
    const dates = getWeekDates(offset);
    if (dates.length === 0) return 'Неделя';
    const parts1 = dates[0].split('.');
    const parts2 = dates[dates.length - 1].split('.');
    return `${parts1[2]}.${parts1[1]}.${parts1[0]} — ${parts2[2]}.${parts2[1]}.${parts2[0]}`;
};

// ===== ИНДИКАТОР ЗАГРУЗКИ =====
const showLoader = () => {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.remove('hidden');
};

const hideLoader = () => {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
};

// ===== КНОПКА "НАВЕРХ" =====
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
// ЗАГРУЗКА ДАННЫХ
// ============================================
const loadSchedule = async () => {
    const container = document.getElementById('scheduleContainer');
    showLoader();
    
    try {
        const response = await fetch(`${SCHEDULE_URL}?t=${Date.now()}`);
        if (!response.ok) throw new Error('Файл не найден');
        scheduleData = await response.json();

        const now = new Date();
        document.getElementById('updateTime').textContent =
            `Обновлено: ${now.toLocaleDateString('ru-RU')} ${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;

        hideLoader();
        return true;
    } catch (e) {
        hideLoader();
        container.innerHTML = `
            <div class="no-schedule">
                📭 Расписание ещё не загружено
                <small>Администратор должен загрузить файл</small>
            </div>
        `;
        return false;
    }
};

// ===== ОТОБРАЖЕНИЕ =====
const renderSchedule = (dateStr, schedule, viewName = '') => {
    const container = document.getElementById('scheduleContainer');

    if (!schedule || schedule.length === 0) {
        container.innerHTML = `
            <div class="no-schedule">
                📭 Расписания на ${dateStr} нет
                <small>Возможно, это выходной день</small>
            </div>
        `;
        return;
    }

    const sorted = [...schedule].sort((a, b) => a.pair - b.pair);
    const hasChanges = sorted.some(p => p.changed === true);

    let html = `
        <div class="day-schedule ${hasChanges ? 'has-changes' : ''}">
            <div class="day-title">
                📅 ${dateStr}, ${getWeekday(dateStr)}
                ${hasChanges ? '<span class="change-badge">🔄 Есть изменения</span>' : ''}
            </div>
    `;

    const pairsByNumber = {};
    sorted.forEach(pair => {
        const key = pair.pair;
        if (!pairsByNumber[key]) {
            pairsByNumber[key] = [];
        }
        pairsByNumber[key].push(pair);
    });

    Object.keys(pairsByNumber).sort((a, b) => a - b).forEach(pairNum => {
        const pairs = pairsByNumber[pairNum];
        const time = PAIR_TIMES[pairNum] || `${pairNum} пара`;
        const hasMultipleSubgroups = pairs.length > 1;
        const hasPairChanges = pairs.some(p => p.changed === true);

        html += `
            <div class="pair-group ${hasPairChanges ? 'pair-group-changed' : ''}">
                <div class="pair-group-header">
                    <span class="pair-number">📗 ${pairNum} пара</span>
                    <span class="pair-time">🕒 ${time}</span>
                    ${hasPairChanges ? '<span class="changed-badge">🔄 ИЗМЕНЕНИЕ</span>' : ''}
                </div>
        `;

        if (hasMultipleSubgroups) {
            pairs.forEach((pair, index) => {
                const icon = getSubjectIcon(pair.subject);
                const subgroupLabel = pair.subgroup ? `Подгруппа ${pair.subgroup}` : `Вариант ${index + 1}`;
                html += `
                    <div class="pair-item ${pair.changed ? 'pair-changed' : ''}">
                        <span class="pair-subgroup">👥 ${subgroupLabel}</span>
                        <span class="pair-subject">
                            <span class="subject-icon">${icon}</span>
                            ${pair.subject}
                        </span>
                        <span class="pair-meta">
                            ${pair.teacher ? `<span class="teacher">👨‍🏫 ${pair.teacher}</span>` : ''}
                            ${pair.room ? `<span class="room">📍 ${pair.room}</span>` : ''}
                            ${pair.building ? `<span class="building">🏢 ${pair.building}</span>` : ''}
                            ${pair.changed ? '<span class="changed">🔄</span>' : ''}
                        </span>
                    </div>
                `;
            });
        } else {
            const pair = pairs[0];
            const icon = getSubjectIcon(pair.subject);
            html += `
                <div class="pair-item ${pair.changed ? 'pair-changed' : ''}">
                    <span class="pair-subject">
                        <span class="subject-icon">${icon}</span>
                        ${pair.subject}
                    </span>
                    <span class="pair-meta">
                        ${pair.teacher ? `<span class="teacher">👨‍🏫 ${pair.teacher}</span>` : ''}
                        ${pair.room ? `<span class="room">📍 ${pair.room}</span>` : ''}
                        ${pair.building ? `<span class="building">🏢 ${pair.building}</span>` : ''}
                        ${pair.changed ? '<span class="changed">🔄</span>' : ''}
                    </span>
                </div>
            `;
        }

        html += `</div>`;
    });

    html += '</div>';
    container.innerHTML = html;

    const viewText = viewName || `📅 ${dateStr}`;
    document.getElementById('currentView').textContent = viewText;
    document.getElementById('pairsCount').textContent = `Всего пар: ${schedule.length}`;
};

// ===== КОМАНДЫ ЗАГРУЗКИ =====
const showScheduleByDate = async (dateStr, viewName = '') => {
    const loaded = await loadSchedule();
    if (!loaded) return;
    const schedule = scheduleData[dateStr] || [];
    renderSchedule(dateStr, schedule, viewName || `📅 ${dateStr}`);
};

const loadToday = async () => {
    const today = new Date();
    const dateStr = formatDate(today);
    currentView = 'today';
    currentWeekOffset = 0;
    await showScheduleByDate(dateStr, '📅 Сегодня');
};

const loadTomorrow = async () => {
    const dateStr = formatDate(getTomorrow());
    currentView = 'tomorrow';
    currentWeekOffset = 0;
    await showScheduleByDate(dateStr, '📅 Завтра');
};

const loadWeek = async (offset = 0) => {
    if (offset < 0 || offset > 1) {
        offset = 0;
    }
    
    const loaded = await loadSchedule();
    if (!loaded) return;

    currentWeekOffset = offset;
    const container = document.getElementById('scheduleContainer');
    const weekDates = getWeekDates(offset);
    const todayStr = formatDate(new Date());
    const weekRange = getWeekRange(offset);

    let html = '';
    let foundAny = false;
    let totalPairs = 0;

    let weekLabel = 'Текущая неделя';
    if (offset === 1) weekLabel = 'Следующая неделя ➡️';

    html += `
        <div class="week-navigation">
            ${offset === 1 ? `<button class="btn btn-outline btn-sm" onclick="loadWeek(0)">⬅️ Текущая неделя</button>` : ''}
            ${offset === 0 ? `<button class="btn btn-primary btn-sm" onclick="loadWeek(1)">Следующая неделя ➡️</button>` : ''}
            <span class="week-label">📅 ${weekLabel} (${weekRange})</span>
            ${offset === 1 ? `<button class="btn btn-primary btn-sm" onclick="loadWeek(0)">📌 Сегодня</button>` : ''}
        </div>
    `;

    for (const dateStr of weekDates) {
        const schedule = scheduleData[dateStr] || [];
        const isTodayFlag = dateStr === todayStr && offset === 0;

        const weekday = getWeekday(dateStr);
        if (weekday === 'суббота' || weekday === 'воскресенье') continue;

        if (schedule.length > 0) {
            foundAny = true;
            totalPairs += schedule.length;
            const sorted = [...schedule].sort((a, b) => a.pair - b.pair);
            const hasChanges = sorted.some(p => p.changed === true);

            html += `
                <div class="day-schedule ${hasChanges ? 'has-changes' : ''} ${isTodayFlag ? 'today-highlight' : ''}">
                    <div class="day-title">
                        ${isTodayFlag ? '⭐ ' : '📅 '} ${dateStr}, ${weekday}
                        ${isTodayFlag ? '<span class="today-badge">СЕГОДНЯ</span>' : ''}
                        ${hasChanges ? '<span class="change-badge">🔄 Есть изменения</span>' : ''}
                    </div>
            `;

            const pairsByNumber = {};
            sorted.forEach(pair => {
                const key = pair.pair;
                if (!pairsByNumber[key]) {
                    pairsByNumber[key] = [];
                }
                pairsByNumber[key].push(pair);
            });

            Object.keys(pairsByNumber).sort((a, b) => a - b).forEach(pairNum => {
                const pairs = pairsByNumber[pairNum];
                const time = PAIR_TIMES[pairNum] || `${pairNum} пара`;
                const hasMultipleSubgroups = pairs.length > 1;
                const hasPairChanges = pairs.some(p => p.changed === true);

                html += `
                    <div class="pair-group ${hasPairChanges ? 'pair-group-changed' : ''}">
                        <div class="pair-group-header">
                            <span class="pair-number">📗 ${pairNum} пара</span>
                            <span class="pair-time">🕒 ${time}</span>
                            ${hasPairChanges ? '<span class="changed-badge">🔄 ИЗМЕНЕНИЕ</span>' : ''}
                        </div>
                `;

                if (hasMultipleSubgroups) {
                    pairs.forEach((pair, index) => {
                        const icon = getSubjectIcon(pair.subject);
                        const subgroupLabel = pair.subgroup ? `Подгруппа ${pair.subgroup}` : `Вариант ${index + 1}`;
                        html += `
                            <div class="pair-item ${pair.changed ? 'pair-changed' : ''}">
                                <span class="pair-subgroup">👥 ${subgroupLabel}</span>
                                <span class="pair-subject">
                                    <span class="subject-icon">${icon}</span>
                                    ${pair.subject}
                                </span>
                                <span class="pair-meta">
                                    ${pair.teacher ? `<span class="teacher">👨‍🏫 ${pair.teacher}</span>` : ''}
                                    ${pair.room ? `<span class="room">📍 ${pair.room}</span>` : ''}
                                    ${pair.building ? `<span class="building">🏢 ${pair.building}</span>` : ''}
                                    ${pair.changed ? '<span class="changed">🔄</span>' : ''}
                                </span>
                            </div>
                        `;
                    });
                } else {
                    const pair = pairs[0];
                    const icon = getSubjectIcon(pair.subject);
                    html += `
                        <div class="pair-item ${pair.changed ? 'pair-changed' : ''}">
                            <span class="pair-subject">
                                <span class="subject-icon">${icon}</span>
                                ${pair.subject}
                            </span>
                            <span class="pair-meta">
                                ${pair.teacher ? `<span class="teacher">👨‍🏫 ${pair.teacher}</span>` : ''}
                                ${pair.room ? `<span class="room">📍 ${pair.room}</span>` : ''}
                                ${pair.building ? `<span class="building">🏢 ${pair.building}</span>` : ''}
                                ${pair.changed ? '<span class="changed">🔄</span>' : ''}
                            </span>
                        </div>
                    `;
                }

                html += `</div>`;
            });

            html += '</div>';
        }
    }

    if (!foundAny) {
        html += `<div class="no-schedule">📭 Нет расписания на эту неделю</div>`;
    }

    container.innerHTML = html;
    currentView = 'week';
    document.getElementById('currentView').textContent = `📋 ${weekLabel}`;
    document.getElementById('pairsCount').textContent = `Всего пар: ${totalPairs}`;
};

const loadDate = async (dateValue) => {
    if (!dateValue) return;
    const parts = dateValue.split('-');
    const dateStr = `${parts[2]}.${parts[1]}.${parts[0]}`;
    currentView = 'date';
    currentWeekOffset = 0;
    await showScheduleByDate(dateStr, `📅 ${dateStr}`);
};

// ============================================
// PWA — РЕГИСТРАЦИЯ SERVICE WORKER
// ============================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/schedule-site/sw.js')
            .then(registration => {
                console.log('✅ Service Worker зарегистрирован:', registration);
            })
            .catch(error => {
                console.log('❌ Ошибка регистрации Service Worker:', error);
            });
    });
}

// ===== ПРОВЕРКА ОБНОВЛЕНИЙ =====
let newWorker;
navigator.serviceWorker.ready.then(registration => {
    registration.addEventListener('updatefound', () => {
        newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showNotification('🔄 Новая версия сайта доступна! Обновите страницу.');
            }
        });
    });
});

// ============================================
// СКРЫТАЯ КОМАНДА ДЛЯ АДМИНА
// ============================================
document.addEventListener('dblclick', (e) => {
    const target = e.target.closest('.header-icon, .header h1');
    if (target && userRole === 'admin') {
        window.location.href = 'login.html';
    }
});

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    checkUserRole();
    loadToday();
    renderCalls();
    fetchWeather();
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    document.getElementById('datePicker').value = `${year}-${month}-${day}`;
});