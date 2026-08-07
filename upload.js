const GROUP = "И-24-1";

const PAIR_TIMES = {
    1: "08:00-09:30",
    2: "09:50-11:20",
    3: "11:50-13:20",
    4: "13:30-15:00",
    5: "15:10-16:40",
    6: "16:50-18:20",
    7: "18:30-20:00"
};

async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const status = document.getElementById('status');
    const file = fileInput.files[0];

    if (!file) {
        status.innerHTML = '⚠️ Выберите файл';
        return;
    }

    status.innerHTML = '⏳ Обработка файла...';

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            const schedule = parseSchedule(json);

            if (Object.keys(schedule).length === 0) {
                status.innerHTML = '❌ Не найдено расписание для группы ' + GROUP;
                return;
            }

            // Скачиваем JSON
            const blob = new Blob([JSON.stringify(schedule, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'schedule.json';
            a.click();
            URL.revokeObjectURL(url);

            status.innerHTML = `
                ✅ Файл обработан!<br>
                📅 Найдено дней: ${Object.keys(schedule).length}<br><br>
                <span style="color: #4a6cf7;">💾 Файл schedule.json скачан.</span><br>
                <span style="color: #666; font-size: 14px;">
                    Загрузите его в репозиторий GitHub Pages
                </span>
            `;

        } catch (error) {
            status.innerHTML = `❌ Ошибка: ${error.message}`;
        }
    };
    reader.readAsArrayBuffer(file);
}

function parseSchedule(data) {
    const schedule = {};
    let currentDate = '';
    let readingGroup = false;
    let foundGroup = false;

    for (let row of data) {
        // Ищем дату
        if (row[0] && typeof row[0] === 'string' && row[0].includes('Дата расписания:')) {
            const match = row[0].match(/(\d{2}\.\d{2}\.\d{4})/);
            if (match) {
                currentDate = match[1];
                if (!schedule[currentDate]) schedule[currentDate] = [];
            }
        }

        // Ищем группу
        if (row[0] && typeof row[0] === 'string' && row[0].trim() === GROUP) {
            readingGroup = true;
            foundGroup = true;
            continue;
        }

        // Следующая группа — выходим
        if (readingGroup && row[0] && typeof row[0] === 'string') {
            if (row[0].trim().match(/^[А-Я]-\d{2}-\d$/)) {
                readingGroup = false;
                continue;
            }
        }

        // Читаем пары
        if (readingGroup && row[0] && typeof row[0] === 'number') {
            const pairNum = row[0];
            const subject = row[4] ? String(row[4]).trim() : '';
            const teacher = row[7] ? String(row[7]).trim() : '';
            const room = row[8] ? String(row[8]).trim() : '';

            if (subject && subject !== '') {
                schedule[currentDate].push({
                    pair: pairNum,
                    time: PAIR_TIMES[pairNum] || '',
                    subject: subject,
                    teacher: teacher,
                    room: room
                });
            }
        }
    }

    if (!foundGroup) {
        alert('Группа ' + GROUP + ' не найдена в файле!');
        return {};
    }

    return schedule;
}