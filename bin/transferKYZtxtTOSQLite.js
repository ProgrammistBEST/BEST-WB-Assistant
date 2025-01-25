const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// Функция для чтения текстового файла
function readTextFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

// Функция для инициализации базы данных и вставки данных
function initializeDatabase(data) {
    const db = new sqlite3.Database('honestsigndb.db');

    db.serialize(() => {
        // Создаем таблицу, если ее нет
        db.run("CREATE TABLE IF NOT EXISTS lines (id INTEGER PRIMARY KEY AUTOINCREMENT, line TEXT, KYZ TEXT)");

        const stmt = db.prepare("INSERT INTO lines (line, KYZ) VALUES (?, ?)");

        // Разделяем данные на строки и вставляем их в таблицу
        const lines = data.split('\n');
        lines.forEach((line, index) => {
            if (line.trim() !== '') {
                stmt.run(line.trim(), `KYZ_${index}`);
            }
        });

        stmt.finalize();

        // Выводим содержимое таблицы в консоль для проверки
        db.each("SELECT id, line, KYZ FROM lines", (err, row) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log(row.id + ": " + row.line + " - " + row.KYZ);
            }
        });

        db.close();
    });
}

// Основная функция
async function main() {
    try {
        const filePath = 'KYZ.txt'; // Замените на путь к вашему файлу
        const data = await readTextFile(filePath);
        initializeDatabase(data);
    } catch (err) {
        console.error(err);
    }
}

main();

// const fs = require('fs');
// const sqlite3 = require('sqlite3').verbose();

// // Функция для чтения текстового файла
// function readTextFile(filePath) {
//     return new Promise((resolve, reject) => {
//         fs.readFile(filePath, 'utf8', (err, data) => {
//             if (err) {
//                 reject(err);
//             } else {
//                 resolve(data);
//             }
//         });
//     });
// }

// // Функция для инициализации базы данных и вставки данных
// function initializeDatabase(data) {
//     const db = new sqlite3.Database('data.db');

//     db.serialize(() => {
//         // Создаем таблицу, если ее нет
//         db.run("CREATE TABLE IF NOT EXISTS lines (id INTEGER PRIMARY KEY AUTOINCREMENT, line TEXT, unique_data TEXT)");

//         // Проверяем, существует ли столбец size
//         db.get("PRAGMA table_info(lines)", (err, row) => {
//             if (err) {
//                 console.error(err.message);
//                 return;
//             }

//             if (!row) {
//                 // Добавляем столбец size
//                 db.run("ALTER TABLE lines ADD COLUMN size INTEGER");
//             }

//             // Вставляем данные
//             const stmt = db.prepare("INSERT INTO lines (line, unique_data, size) VALUES (?, ?, ?)");
//             const lines = data.split('\n');
//             lines.forEach((line, index) => {
//                 if (line.trim() !== '') {
//                     stmt.run(line.trim(), `unique_data_${index}`, 28);
//                 }
//             });

//             stmt.finalize();

//             // Обновляем существующие записи, добавляя значение 28 в столбец size
//             db.run("UPDATE lines SET size = 28 WHERE size IS NULL");

//             // Выводим содержимое таблицы в консоль для проверки
//             db.each("SELECT id, line, unique_data, size FROM lines", (err, row) => {
//                 if (err) {
//                     console.error(err.message);
//                 } else {
//                     console.log(row.id + ": " + row.line + " - " + row.unique_data + " - " + row.size);
//                 }
//             });

//             db.close();
//         });
//     });
// }

// // Основная функция
// async function main() {
//     try {
//         const filePath = '28.txt'; // Замените на путь к вашему файлу
//         const data = await readTextFile(filePath);
//         initializeDatabase(data);
//     } catch (err) {
//         console.error(err);
//     }
// }

// main();