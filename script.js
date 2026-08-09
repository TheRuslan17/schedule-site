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

// ============================================
// РАСПИСАНИЕ ЗВОНКОВ (СТИЛЬНАЯ ВЕРСИЯ)
// ============================================
function renderCalls() {
    const container = document.getElementById('callsContainer');
    
    // Группируем пары по времени суток
    const morning = CALLS_SCHEDULE.slice(0, 2);   // 1-2 пара
    const day = CALLS_SCHEDULE.slice(2, 5);       // 3-5 пара
    const evening = CALLS_SCHEDULE.slice(5, 7);   // 6-7 пара
    
    const timeLabels = [
        { key: 'morning', label: '🌅 Утро', icon: '☀️', pairs: morning },
        { key: 'day', label: '☀️ День', icon: '🌤️', pairs: day },
        { key: 'evening', label: '🌙 Вечер', icon: '🌆', pairs: evening }
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
        // Пропускаем пустые секции
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
    
    // Информационная строка
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
    
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`tab-${tab}`).classList.add('active');
    document.querySelector(`.tab[data-tab="${tab}"]`).classList.add('active');
    
    if (tab === 'calls') renderCalls();
}

// ============================================
// РАСПИСАНИЕ ЗВОНКОВ (БЕЗ СТАТУСОВ)
// ============================================
function renderCalls() {
    const container = document.getElementById('callsContainer');
    
    let html = `
        <div class="calls-schedule">
            <div class="calls-header">
                <span>🔢 Пара</span>
                <span>⏰ Начало</span>
                <span>⏰ Конец</span>
                <span>☕ Перемена</span>
            </div>
    `;
    
    CALLS_SCHEDULE.forEach(call => {
        html += `
            <div class="calls-row">
                <span><strong>${call.pair}</strong></span>
                <span>${call.start}</span>
                <span>${call.end}</span>
                <span>${call.break}</span>
            </div>
        `;
    });
    
    html += '</div>';
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
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    document.getElementById('datePicker').value = `${year}-${month}-${day}`;
});