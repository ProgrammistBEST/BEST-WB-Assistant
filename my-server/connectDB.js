const mysql = require('mysql2/promise');
require('dotenv').config();

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
        console.log('connectdb - Успешное подключение к базе данных MySQL: bestserver');
        connection.release();
    })
    .catch((err) => {
        console.error('Ошибка при подключении к базе данных bestserver:', err.message);
        console.error('Код ошибки:', err.code);
        console.error('Стек вызовов:', err.stack);
    });

// Экспорт пулов
module.exports = {
    pool,
    userPool
};