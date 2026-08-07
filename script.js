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
const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

let scheduleData = {};
let currentView = 'today';

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

// ============================================
// ЗАГРУЗКА ДАННЫХ
// ============================================
const loadSchedule = async () => {
    const container = document.getElementById('scheduleContainer');
    try {
        const response = await fetch(`${SCHEDULE_URL}?t=${Date.now()}`);
        if (!response.ok) throw new Error('Файл не найден');
        scheduleData = await response.json();

        // Обновляем время
        const now = new Date();
        document.getElementById('updateTime').textContent =
            `Обновлено: ${now.toLocaleDateString('ru-RU')} ${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;

        return true;
    } catch (e) {
        container.innerHTML = `
            <div class="no-schedule">
                📭 Расписание ещё не загружено
                <small>Администратор должен загрузить файл</small>
            </div>
        `;
        return false;
    }
};

// ============================================
// ОТОБРАЖЕНИЕ
// ============================================
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

    sorted.forEach(pair => {
        const time = PAIR_TIMES[pair.pair] || `${pair.pair} пара`;
        const subgroup = pair.subgroup ? `<span class="subgroup">подгр. ${pair.subgroup}</span>` : '';
        const room = pair.room ? `<span class="room">📍 ${pair.room}</span>` : '';
        const building = pair.building ? `<span class="building">🏢 ${pair.building}</span>` : '';
        const teacher = pair.teacher ? `<span class="teacher">👨‍🏫 ${pair.teacher}</span>` : '';
        const changed = pair.changed ? `<span class="changed">🔄 ИЗМЕНЕНИЕ</span>` : '';

        html += `
            <div class="pair ${pair.changed ? 'pair-changed' : ''}">
                <span class="pair-time">🕒 ${time}</span>
                <span class="pair-subject">${pair.subject}</span>
                <span class="pair-meta">
                    ${subgroup}
                    ${room}
                    ${building}
                    ${teacher}
                    ${changed}
                </span>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;

    const viewText = viewName || `📅 ${dateStr}`;
    document.getElementById('currentView').textContent = viewText;
    document.getElementById('pairsCount').textContent = `Всего пар: ${schedule.length}`;
};

// ============================================
// КОМАНДЫ ЗАГРУЗКИ
// ============================================
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
    await showScheduleByDate(dateStr, '📅 Сегодня');
};

const loadTomorrow = async () => {
    const dateStr = formatDate(getTomorrow());
    currentView = 'tomorrow';
    await showScheduleByDate(dateStr, '📅 Завтра');
};

const loadWeek = async () => {
    const loaded = await loadSchedule();
    if (!loaded) return;

    const container = document.getElementById('scheduleContainer');
    const today = new Date();
    const monday = new Date(today);
    const day = today.getDay();
    monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));

    let html = '';
    let foundAny = false;
    let totalPairs = 0;

    for (let i = 0; i < 5; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const dateStr = formatDate(date);
        const schedule = scheduleData[dateStr] || [];

        if (schedule.length > 0) {
            foundAny = true;
            totalPairs += schedule.length;
            const sorted = [...schedule].sort((a, b) => a.pair - b.pair);
            const hasChanges = sorted.some(p => p.changed === true);

            html += `
                <div class="day-schedule ${hasChanges ? 'has-changes' : ''}">
                    <div class="day-title">
                        📅 ${dateStr}, ${getWeekday(dateStr)}
                        ${hasChanges ? '<span class="change-badge">🔄 Есть изменения</span>' : ''}
                    </div>
            `;

            sorted.forEach(pair => {
                const time = PAIR_TIMES[pair.pair] || `${pair.pair} пара`;
                const subgroup = pair.subgroup ? `<span class="subgroup">подгр. ${pair.subgroup}</span>` : '';
                const room = pair.room ? `<span class="room">📍 ${pair.room}</span>` : '';
                const building = pair.building ? `<span class="building">🏢 ${pair.building}</span>` : '';
                const teacher = pair.teacher ? `<span class="teacher">👨‍🏫 ${pair.teacher}</span>` : '';
                const changed = pair.changed ? `<span class="changed">🔄 ИЗМЕНЕНИЕ</span>` : '';

                html += `
                    <div class="pair ${pair.changed ? 'pair-changed' : ''}">
                        <span class="pair-time">🕒 ${time}</span>
                        <span class="pair-subject">${pair.subject}</span>
                        <span class="pair-meta">
                            ${subgroup}
                            ${room}
                            ${building}
                            ${teacher}
                            ${changed}
                        </span>
                    </div>
                `;
            });

            html += '</div>';
        }
    }

    if (!foundAny) {
        html = `<div class="no-schedule">📭 Нет расписания на эту неделю</div>`;
    }

    container.innerHTML = html;
    currentView = 'week';
    document.getElementById('currentView').textContent = '📋 Вся неделя';
    document.getElementById('pairsCount').textContent = `Всего пар: ${totalPairs}`;
};

const loadDate = async (dateValue) => {
    if (!dateValue) return;
    const parts = dateValue.split('-');
    const dateStr = `${parts[2]}.${parts[1]}.${parts[0]}`;
    currentView = 'date';
    await showScheduleByDate(dateStr, `📅 ${dateStr}`);
};

// ============================================
// СКРЫТАЯ КОМАНДА ДЛЯ АДМИНА
// ============================================
document.addEventListener('dblclick', (e) => {
    const target = e.target.closest('.header-icon, .header h1');
    if (target) {
        window.location.href = 'login.html';
    }
});

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadToday();
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    document.getElementById('datePicker').value = `${year}-${month}-${day}`;
});