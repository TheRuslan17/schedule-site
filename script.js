const GROUP_NAME = "И-24-1";
const SCHEDULE_URL = "schedule.json";
let scheduleData = {};

async function loadSchedule() {
    try {
        const response = await fetch(SCHEDULE_URL + '?t=' + Date.now());
        if (!response.ok) throw new Error('Файл не найден');
        scheduleData = await response.json();
        return true;
    } catch (e) {
        document.getElementById('scheduleContainer').innerHTML = `
            <div class="no-schedule">
                📭 Расписание ещё не загружено<br>
                <small>Администратор должен загрузить файл</small>
            </div>
        `;
        return false;
    }
}

const weekdays = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const PAIR_TIMES = {
    1: "08:00-09:30",
    2: "09:50-11:20",
    3: "11:50-13:20",
    4: "13:30-15:00",
    5: "15:10-16:40",
    6: "16:50-18:20",
    7: "18:30-20:00"
};

function getWeekday(dateStr) {
    const parts = dateStr.split('.');
    const d = new Date(parts[2], parts[1] - 1, parts[0]);
    return weekdays[d.getDay()];
}

function renderSchedule(dateStr, schedule) {
    const container = document.getElementById('scheduleContainer');
    if (!schedule || schedule.length === 0) {
        container.innerHTML = `<div class="no-schedule">📭 Расписания на ${dateStr} нет</div>`;
        return;
    }
    let html = `<div class="day-schedule"><div class="day-title">📅 ${dateStr}, ${getWeekday(dateStr)}</div>`;
    schedule.sort((a, b) => a.pair - b.pair);
    schedule.forEach(pair => {
        const time = PAIR_TIMES[pair.pair] || `${pair.pair} пара`;
        const subgroup = pair.subgroup ? `(подгр. ${pair.subgroup})` : '';
        const teacher = pair.teacher ? `👨‍🏫 ${pair.teacher}` : '';
        const room = pair.room ? `📍 ${pair.room}` : '';
        const building = pair.building ? `🏢 ${pair.building}` : '';
        html += `
            <div class="pair">
                <span class="pair-time">🕒 ${time}</span>
                <span class="pair-subject">${pair.subject} ${subgroup}</span>
                <span class="pair-teacher">${teacher}</span>
                <span class="pair-room">${room} ${building}</span>
            </div>
        `;
    });
    html += `</div>`;
    container.innerHTML = html;
}

async function loadToday() {
    const loaded = await loadSchedule();
    if (!loaded) return;
    const today = new Date();
    const dateStr = today.toLocaleDateString('ru-RU');
    renderSchedule(dateStr, scheduleData[dateStr] || []);
}

async function loadTomorrow() {
    const loaded = await loadSchedule();
    if (!loaded) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toLocaleDateString('ru-RU');
    renderSchedule(dateStr, scheduleData[dateStr] || []);
}

async function loadWeek() {
    const loaded = await loadSchedule();
    if (!loaded) return;
    const container = document.getElementById('scheduleContainer');
    let html = '';
    const today = new Date();
    const monday = new Date(today);
    const day = today.getDay();
    monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
    let foundAny = false;
    for (let i = 0; i < 5; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const dateStr = date.toLocaleDateString('ru-RU');
        const schedule = scheduleData[dateStr] || [];
        if (schedule.length > 0) {
            foundAny = true;
            html += `<div class="day-schedule"><div class="day-title">📅 ${dateStr}, ${getWeekday(dateStr)}</div>`;
            schedule.sort((a, b) => a.pair - b.pair);
            schedule.forEach(pair => {
                const time = PAIR_TIMES[pair.pair] || `${pair.pair} пара`;
                const subgroup = pair.subgroup ? `(подгр. ${pair.subgroup})` : '';
                const teacher = pair.teacher ? `👨‍🏫 ${pair.teacher}` : '';
                const room = pair.room ? `📍 ${pair.room}` : '';
                const building = pair.building ? `🏢 ${pair.building}` : '';
                html += `
                    <div class="pair">
                        <span class="pair-time">🕒 ${time}</span>
                        <span class="pair-subject">${pair.subject} ${subgroup}</span>
                        <span class="pair-teacher">${teacher}</span>
                        <span class="pair-room">${room} ${building}</span>
                    </div>
                `;
            });
            html += `</div>`;
        }
    }
    if (!foundAny) html = `<div class="no-schedule">📭 Нет расписания на эту неделю</div>`;
    container.innerHTML = html;
}

async function loadDate(dateValue) {
    const loaded = await loadSchedule();
    if (!loaded) return;
    const parts = dateValue.split('-');
    const dateStr = `${parts[2]}.${parts[1]}.${parts[0]}`;
    renderSchedule(dateStr, scheduleData[dateStr] || []);
}

loadToday();