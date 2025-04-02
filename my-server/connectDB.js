const mysql = require('mysql2/promise');
require('dotenv').config();

// Логирование переменных окружения для отладки
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);

console.log('USER_DB_HOST:', process.env.USER_DB_HOST);
console.log('USER_DB_USER:', process.env.USER_DB_USER);
console.log('USER_DB_PASSWORD:', process.env.USER_DB_PASSWORD);
console.log('USER_DB_NAME:', process.env.USER_DB_NAME);

// Настройки для подключения к базе данных
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const userPool = mysql.createPool({
    host: process.env.USER_DB_HOST,
    user: process.env.USER_DB_USER,
    password: process.env.USER_DB_PASSWORD,
    database: process.env.USER_DB_NAME
});

// Проверка подключения к базе данных storagesigns
pool.getConnection()
    .then((connection) => {
        console.log('connectdb - Успешное подключение к базе данных MySQL: storagesigns');
        connection.release();
    })
    .catch((err) => {
        console.error('Ошибка при подключении к базе данных storagesigns:', err.message);
        console.error('Код ошибки:', err.code);
        console.error('Стек вызовов:', err.stack);
    });

// Проверка подключения к базе данных bestserver
userPool.getConnection()
    .then((connection) => {
        console.log('Успешное подключение к базе данных MySQL: bestserver');
        connection.release();
    })
    .catch((err) => {
        console.error('Ошибка при подключении к базе данных bestserver:', err.message);
        console.error('Код ошибки:', err.code);
        console.error('Стек вызовов:', err.stack);
    });

// Тестовые запросы
pool.query('SELECT 1 + 1 AS result')
    .then(([rows]) => {
        console.log('Тестовый запрос к test успешен:', rows[0].result);
    })
    .catch((err) => {
        console.error('Ошибка при выполнении тестового запроса к test:', err.message);
    });

userPool.query('SELECT 1 + 1 AS result')
    .then(([rows]) => {
        console.log('Тестовый запрос к bestserver успешен:', rows[0].result);
    })
    .catch((err) => {
        console.error('Ошибка при выполнении тестового запроса к bestserver:', err.message);
    });

// Экспорт пулов
module.exports = {
    pool,
    userPool
};