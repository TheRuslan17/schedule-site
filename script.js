// ============================================
// КОНСТАНТЫ
// ============================================
const SCHEDULE_URL = 'schedule.json';

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

let scheduleData = {};
let currentView = 'today';
let currentTab = 'schedule';
let userRole = 'student';
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
// ОПРЕДЕЛЕНИЕ НЕДЕЛИ (А или Б)
// ============================================
function getCurrentWeekType() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const diff = (now - startOfYear) / 86400000;
    const weekNumber = Math.ceil((diff + startOfYear.getDay() + 1) / 7);
    return weekNumber % 2 === 0 ? 'A' : 'B';
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
// ОТОБРАЖЕНИЕ РАСПИСАНИЯ ПО ДНЮ НЕДЕЛИ
// ============================================
function renderScheduleByDay(dayName, viewName) {
    const container = document.getElementById('scheduleContainer');
    const daySchedule = scheduleData[dayName] || {};
    const weekType = getCurrentWeekType();

    const pairKeys = Object.keys(daySchedule)
        .filter(key => daySchedule[key].week === 'both' || daySchedule[key].week === weekType)
        .sort((a, b) => parseInt(a) - parseInt(b));

    if (pairKeys.length === 0) {
        container.innerHTML = `<div class="no-schedule">📭 Расписания на ${dayName} нет</div>`;
        document.getElementById('currentView').textContent = viewName || `📅 ${dayName}`;
        document.getElementById('pairsCount').textContent = 'Всего пар: 0';
        return;
    }

    const dateStr = getDateByDayName(dayName);
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
                </span>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;

    document.getElementById('currentView').textContent = viewName || `📅 ${dayName}`;
    document.getElementById('pairsCount').textContent = `Всего пар: ${pairKeys.length}`;
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
                <small>Администратор должен загрузить файл</small>
            </div>
        `;
        return false;
    }
}

// ============================================
// ПОЛУЧЕНИЕ ДАТЫ ПО ДНЮ НЕДЕЛИ
// ============================================
function getDateByDayName(dayName) {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const now = new Date();
    const todayIndex = now.getDay();
    const targetIndex = days.indexOf(dayName);
    
    // Вычисляем разницу между сегодня и нужным днём
    let diff = targetIndex - todayIndex;
    // Если сегодня воскресенье (0), а нужен понедельник (1) — diff будет 1, всё верно
    // Если нужный день уже прошёл на этой неделе — берём следующую неделю
    if (diff < 0) diff += 7;
    
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + diff);
    return formatDate(targetDate);
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

        console.log(`📅 ${dayName}: ${pairKeys.length} пар`);

        if (pairKeys.length > 0) {
            foundAny = true;
            totalPairs += pairKeys.length;
            
            // ===== ПОЛУЧАЕМ ДАТУ ДЛЯ ЭТОГО ДНЯ =====
            const dateStr = getDateByDayName(dayName);
            
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
    document.getElementById('pairsCount').textContent = `Всего пар: ${totalPairs}`;
    updateDateAndWeek();
}

async function loadDate(dateValue) {
    if (!dateValue) return;
    const loaded = await loadSchedule();
    if (!loaded) return;
    const parts = dateValue.split('-');
    const dateStr = `${parts[2]}.${parts[1]}.${parts[0]}`;
    
    // Пытаемся найти день недели по дате (если в файле есть даты)
    if (scheduleData[dateStr]) {
        renderScheduleByDay(dateStr, `📅 ${dateStr}`);
    } else {
        // Иначе пробуем найти по дню недели
        const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
        const days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
        const dayName = days[dateObj.getDay()];
        if (scheduleData[dayName]) {
            renderScheduleByDay(dayName, `📅 ${dateStr} (${dayName})`);
        } else {
            document.getElementById('scheduleContainer').innerHTML = 
                `<div class="no-schedule">📭 Расписания на ${dateStr} нет</div>`;
        }
    }
    updateDateAndWeek();
}

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
    checkUserRole();
    loadToday();
    renderCalls();
    fetchWeather();
    updateDateAndWeek();

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    document.getElementById('datePicker').value = `${year}-${month}-${day}`;
});