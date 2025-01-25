const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Путь к вашему JSON файлу
const jsonFilePath = '../json/BestShoes.json';

// Функция для чтения JSON файла
function readJsonFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.parse(data));
            }
        });
    });
}

// Функция для создания таблицы в базе данных
function createTable(db) {
    return new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS product_sizesBestShoes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vendor_code TEXT,
                nm_id INTEGER,
                size_key TEXT,
                chrt_id INTEGER,
                tech_size TEXT,
                wb_size TEXT,
                skus TEXT,
                brand TEXT
            )
        `, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

// Функция для вставки данных в таблицу
function insertData(db, data) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`
            INSERT INTO product_sizesBestShoes (vendor_code, nm_id, size_key, chrt_id, tech_size, wb_size, skus, brand)
            VALUES (?, ?, ?, ?, ?, ?, ?,?)
        `);

        data.cards.forEach(entry => {
            const vendorCode = entry.vendorCode;
            const brand = entry.brand;
            const nmID = entry.nmID;
            const sizes = entry.sizes;

            sizes.forEach(size => {
                const sizeKey = `${size.techSize}-${size.wbSize}`; // Создаем size_key как комбинацию techSize и wbSize
                const chrtID = size.chrtID;
                const techSize = size.techSize;
                const wbSize = size.wbSize;
                const skus = size.skus.join(',');
                stmt.run(vendorCode, nmID, sizeKey, chrtID, techSize, wbSize, skus,brand);
            });
        });

        stmt.finalize((err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

// Основной блок для выполнения всех операций
async function main() {
    try {
        // Чтение данных из JSON файла
        const data = await readJsonFile(jsonFilePath);

        // Подключение к базе данных SQLite
        const db = new sqlite3.Database('productsBestShoes.db');

        // Создание таблицы
        await createTable(db);

        // Вставка данных в таблицу
        await insertData(db, data);

        // Закрытие подключения к базе данных
        db.close((err) => {
            if (err) {
                console.error('Error closing the database', err.message);
            }
        });

        console.log('Data has been successfully inserted into the database.');
    } catch (err) {
        console.error('An error occurred:', err.message);
    }
}

main();
