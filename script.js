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

// ===== РАСПИСАНИЕ ЗВОНКОВ =====
const CALLS_SCHEDULE = [
    { pair: 1, start: '08:00', end: '09:30', break: '10 мин' },
    { pair: 2, start: '09:50', end: '11:20', break: '10 мин' },
    { pair: 3, start: '11:50', end: '13:20', break: '10 мин' },
    { pair: 4, start: '13:30', end: '15:00', break: '10 мин' },
    { pair: 5, start: '15:10', end: '16:40', break: '10 мин' },
    { pair: 6, start: '16:50', end: '18:20', break: '10 мин' },
    { pair: 7, start: '18:30', end: '20:00', break: '—' }
];

// ===== РАСПИСАНИЕ СЕССИИ (можно редактировать в админке) =====
let sessionData = {
    exams: [
        { date: '15.06.2026', subject: 'Технология разработки ПО', time: '10:00', room: 'каб. 207' },
        { date: '18.06.2026', subject: 'Инструментальные средства разработки ПО', time: '10:00', room: 'каб. 203' },
        { date: '22.06.2026', subject: 'Математическое моделирование', time: '10:00', room: 'каб. 418' }
    ],
    credits: [
        { date: '10.06.2026', subject: 'Основы финансовой грамотности', teacher: 'Сидоров А.А.' },
        { date: '12.06.2026', subject: 'Иностранный язык', teacher: 'Смирнова И.П.' }
    ],
    sessionStart: '10.06.2026',
    sessionEnd: '25.06.2026'
};

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
let userRole = 'student'; // 'student' или 'admin'

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
    currentTab = tab;
    
    // Скрываем все вкладки
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
    
    // Показываем выбранную
    document.getElementById(`tab-${tab}`).classList.add('active');
    document.querySelector(`.tab[data-tab="${tab}"]`).classList.add('active');
    
    // Загружаем данные
    if (tab === 'calls') renderCalls();
    else if (tab === 'session') renderSession();
}

// ============================================
// РАСПИСАНИЕ ЗВОНКОВ
// ============================================
function renderCalls() {
    const container = document.getElementById('callsContainer');
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    let html = `
        <div class="calls-schedule">
            <div class="calls-header">
                <span>🔢 Пара</span>
                <span>⏰ Начало</span>
                <span>⏰ Конец</span>
                <span>☕ Перемена</span>
                <span>📌 Статус</span>
            </div>
    `;
    
    CALLS_SCHEDULE.forEach(call => {
        const startMinutes = parseInt(call.start.split(':')[0]) * 60 + parseInt(call.start.split(':')[1]);
        const endMinutes = parseInt(call.end.split(':')[0]) * 60 + parseInt(call.end.split(':')[1]);
        let status = '🟢 Ожидание';
        
        if (currentTime >= startMinutes && currentTime <= endMinutes) {
            status = '🟡 ИДЁТ';
        } else if (currentTime > endMinutes) {
            status = '🔴 Завершена';
        }
        
        html += `
            <div class="calls-row ${status === '🟡 ИДЁТ' ? 'active' : ''}">
                <span><strong>${call.pair}</strong></span>
                <span>${call.start}</span>
                <span>${call.end}</span>
                <span>${call.break}</span>
                <span>${status}</span>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// ============================================
// РАСПИСАНИЕ СЕССИИ
// ============================================
function renderSession() {
    const container = document.getElementById('sessionContainer');
    const countdownEl = document.getElementById('daysUntilSession');
    
    // Считаем дни до сессии
    const now = new Date();
    const sessionStartParts = sessionData.sessionStart.split('.');
    const sessionStart = new Date(sessionStartParts[2], sessionStartParts[1] - 1, sessionStartParts[0]);
    const diffDays = Math.ceil((sessionStart - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
        countdownEl.textContent = `${diffDays} ${getDaysWord(diffDays)}`;
    } else if (diffDays === 0) {
        countdownEl.textContent = 'СЕГОДНЯ!';
    } else {
        countdownEl.textContent = 'Сессия идёт или завершена';
    }
    
    let html = '';
    
    // Экзамены
    if (sessionData.exams && sessionData.exams.length > 0) {
        html += `
            <div class="session-section">
                <h3>📚 Экзамены</h3>
                <div class="session-grid">
                    <div class="session-header">
                        <span>📅 Дата</span>
                        <span>📖 Предмет</span>
                        <span>⏰ Время</span>
                        <span>📍 Аудитория</span>
                    </div>
        `;
        
        sessionData.exams.forEach(exam => {
            html += `
                <div class="session-row">
                    <span>${exam.date}</span>
                    <span><strong>${exam.subject}</strong></span>
                    <span>${exam.time || '—'}</span>
                    <span>${exam.room || '—'}</span>
                </div>
            `;
        });
        
        html += '</div></div>';
    }
    
    // Зачёты
    if (sessionData.credits && sessionData.credits.length > 0) {
        html += `
            <div class="session-section">
                <h3>✅ Зачёты</h3>
                <div class="session-grid">
                    <div class="session-header">
                        <span>📅 Дата</span>
                        <span>📖 Предмет</span>
                        <span>👨‍🏫 Преподаватель</span>
                    </div>
        `;
        
        sessionData.credits.forEach(credit => {
            html += `
                <div class="session-row">
                    <span>${credit.date}</span>
                    <span><strong>${credit.subject}</strong></span>
                    <span>${credit.teacher || '—'}</span>
                </div>
            `;
        });
        
        html += '</div></div>';
    }
    
    if (!html) {
        html = '<div class="no-schedule">📭 Расписание сессии пока не загружено</div>';
    }
    
    container.innerHTML = html;
}

function getDaysWord(days) {
    if (days % 10 === 1 && days % 100 !== 11) return 'день';
    if (days % 10 >= 2 && days % 10 <= 4 && (days % 100 < 10 || days % 100 >= 20)) return 'дня';
    return 'дней';
}

// ============================================
// ОСТАЛЬНЫЕ ФУНКЦИИ (БЕЗ ИЗМЕНЕНИЙ)
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

// ===== ЗАГРУЗКА ДАННЫХ =====
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
    renderSession();
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    document.getElementById('datePicker').value = `${year}-${month}-${day}`;
});