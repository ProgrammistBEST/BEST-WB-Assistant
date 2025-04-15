require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 3000;
const fs = require('fs');
require('mysql2/promise');

// Подключение к бд
const { pool, userPool } = require('./connectDB.js'); // Импортируем пулы из connect.js

// Получение честного знака из таблицы
const { getCategoryByModel } = require('./config/articles.js')

// Обслуживание статических файлов
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors()); // Разрешает все источники
app.use(bodyParser.json({ limit: '10mb' }));

// Проверка подключения к базе данных bestserver
userPool.getConnection()
	.then((connection) => {
		if (connection) {
			console.log('Успешное подключение к базе данных bestserver');
			connection.release();
		}
	})
	.catch((err) => {
		console.error('Ошибка подключения к базе:', err.message);
	});

// Проверка подключения к базе данных storagesigns
pool.getConnection()
	.then((connection) => {
		if (connection) {
			console.log('Успешное подключение к базе данных storagesigns');
			connection.release();
		}
	})
	.catch((err) => {
		console.error('Ошибка подключения к базе:', err.message);
	});

const networkFolderPath = 'Z:\\Упаковка\\ARMBEST';

// Функция для рекурсивного получения списка файлов и директорий
async function getFilesRecursively(directory) {
    const results = [];
    const entries = await fs.promises.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            results.push(...await getFilesRecursively(fullPath));
        } else {
            results.push(fullPath);
        }
    }

    return results;
}

// Эндпоинт для получения API-токена по ID
app.get('/api/getApiById', async (req, res) => {
	const { id, company_name, category } = req.query; // Извлечение параметров запроса

	try {
		const today = new Date(); // Текущая дата

		// Запрос для получения токена и даты истечения подписки из базы данных bestserver
		const [rows] = await userPool.query(
			`SELECT token, expiration_date FROM api_data 
             WHERE id = ? AND company_name = ? AND category = ?`,
			[id, company_name, category]
		);

		if (rows.length > 0) {
			const { token, expiration_date } = rows[0];

			// Если expiration_date равно null, считаем подписку неограниченной
			if (expiration_date === null) {
				res.json({ token });
			} else {
				// Преобразуем expiration_date в объект Date
				const expirationDate = new Date(expiration_date);

				// Проверяем дату истечения подписки
				if (expirationDate > today) {
					res.json({ token });
				} else {
					res.status(404).json({ error: 'Подписка истекла' });
				}
			}
		} else {
			res.status(404).json({ error: 'Информация не найдена' });
		}
	} catch (err) {
		console.error('Ошибка выполнения запроса:', err.message);
		res.status(500).json({ error: 'Ошибка выполнения запроса' });
	}
});

// Основная функция
app.get('/kyz', async (req, res) => {
    const { size, brand, model, count } = req.query;

    // Проверка параметров
    if (!size || !brand || !model || isNaN(count) || count <= 0) {
        return res.status(400).json({ error: 'Invalid parameters' });
    }

    // Получение имени таблицы
    const tableName = await getCategoryByModel(model, brand, size);

    console.log(`KYZ Запрос: size=${size}, brand=${brand}, model=${model}, count=${count}`);
    console.log(`KYZ Таблица: ${tableName}`);

    // SQL-запросы
    const query = `
        SELECT id, crypto, model, size 
        FROM ${tableName}
        WHERE size = ? AND brand = ? AND model = ? AND status IN ('Comeback', 'Waiting')
        LIMIT ?
    `;
    const queryUpdate = `
        UPDATE ${tableName} 
        SET status = 'Reserved', user = 'Marketplace', date_used = NOW()
        WHERE id = ? AND status IN ('Comeback', 'Waiting')
    `;

    try {
        // Выборка данных
        const [rows] = await pool.execute(query, [size, brand, model, count], tableName);
        console.log(`KYZ Найдено записей: ${rows.length}`);

        // Обновление статуса
        for (const row of rows) {
            await pool.execute(queryUpdate, [row.id]);
        }

        // Возвращаем данные клиенту
        res.json({
            data: rows.map(row => ({
                Crypto: row.crypto,
                Model: row.model,
                Size: row.size,
                id: row.id,
                tableName: tableName
            }))
        });
    } catch (err) {
        console.error('Ошибка выполнения запроса:', { message: err.message, stack: err.stack });
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Функция для обновления статуса в базе данных
async function updateStatusInDatabase(tableName, id, newStatus) {
    const query = `
        UPDATE ${tableName}
        SET status = ?
        WHERE id = ?
    `;
    try {
        await pool.execute(query, [newStatus, id]);
        console.log(`Статус записи с id=${id} успешно обновлен на "${newStatus}".`);
    } catch (err) {
        console.error(`Ошибка при обновлении статуса записи с id=${id}:`, err.message);
    }
}

// Маршрут для обновления статуса строки
app.post('/kyzComeback', async (req, res) => {
    // const { tableName, id } = req.body;
    const tableName = req.body.tableName;
    const id = req.body.id;

    // Валидация входных данных
    if (!tableName || !id) {
        console.error('Ошибка валидации: tableName и ID обязательны.');
        return res.json({ message: 'Статус успешно обновлен (ни tableName, ни id не переданы).' });
    }

    console.log(`Получен запрос: tableName=${tableName}, id=${id}`);
    console.log('Тип данных id в запросе:', typeof id);

    // Логирование содержимого reservedKyz
    console.log('Содержимое reservedKyz:', [...reservedKyz.entries()]);

    let connection;
    try {
        // Проверяем, существует ли запись в reservedKyz
        const reservedData = reservedKyz.get(Number(id)); // Преобразуем id к числу

        if (!reservedData) {
            console.error(`Запись с id=${id} не найдена в reservedKyz.`);
            console.log('Все записи в reservedKyz:', [...reservedKyz.entries()]);
            return res.status(404).json({ error: 'Честный знак не найден в резерве.' });
        }

        if (reservedData.tableName !== tableName) {
            console.error(`Запись с id=${id} найдена в reservedKyz, но tableName не совпадает. Ожидалось: ${reservedData.tableName}, получено: ${tableName}`);
            return res.status(404).json({ error: 'Честный знак не соответствует таблице.' });
        }

        console.log(`Запись с id=${id} найдена в reservedKyz. tableName=${tableName}`);

        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Проверяем существование записи в базе данных
        const checkSql = `
            SELECT * 
            FROM ${tableName}
            WHERE id = ?
        `;
        const [rows] = await connection.execute(checkSql, [id]);

        if (rows.length === 0) {
            console.error(`Запись с id=${id} не найдена в таблице ${tableName}.`);
            await connection.rollback();
            return res.status(404).json({ error: 'Запись не найдена в базе данных.' });
        }

        console.log(`Запись с id=${id} найдена в таблице ${tableName}.`);

        // Обновляем статус в исходной таблице
        const updateSql = `
            UPDATE ${tableName}
            SET status = 'Comeback'
            WHERE id = ?
        `;
        await connection.execute(updateSql, [id]);

        console.log(`Статус записи с id=${id} успешно обновлен на Comeback.`);

        // Удаляем запись из in-memory хранилища
        reservedKyz.delete(Number(id)); // Преобразуем id к числу

        await connection.commit();

        res.json({ message: 'Статус успешно обновлен на Comeback.' });
    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Ошибка выполнения запроса:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Проверка существования записи в базе данных
async function validateRecordExistence(tableName, id, crypto) {
    const query = `
        SELECT pdf 
        FROM ${tableName}
        WHERE id = ? AND crypto = ?
    `;
    const [rows] = await pool.execute(query, [id, crypto]);
    return rows.length > 0 ? rows[0] : null;
}

// Получение PDF из записи
function fetchPDF(record) {
    const pdf = record.pdf;
    if (!pdf) {
        throw new Error('PDF not found for the given record.');
    }
    return pdf;
}

// Логирование ошибок
function logError(message, details) {
    console.error(message, details);
}

// Основная функция
app.post('/getCryptoToFinishDocument', async (req, res) => {
    const { id, tableName, Crypto } = req.body;

    // Валидация входных данных
    if (!id || !tableName || !Crypto) {
        logError('Ошибка валидации:', { id, tableName, Crypto });
        return res.status(400).json({ error: 'ID, имя таблицы и Crypto обязательны.' });
    }

    try {
        // Проверяем существование записи
        const record = await validateRecordExistence(tableName, id, Crypto);
        if (!record) {
            logError('Запись не найдена:', { id, tableName, Crypto });
            return res.status(404).json({ error: 'Запись не найдена.' });
        }

        // Получаем PDF
        const pdf = fetchPDF(record);

        // Отправляем PDF клиенту
        res.setHeader('Content-Type', 'application/pdf');
        res.send(pdf);
    } catch (err) {
        logError('Ошибка выполнения запроса:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Обновление статуса киза
app.put('/kyzUpdateStatus', async (req, res) => {
    const { id, tableName, dateNow } = req.body;

    // Валидация входных данных
    if (!id || !tableName || !dateNow) {
        return res.status(400).json({ error: 'ID, имя таблицы и дата обязательны.' });
    }

    try {
        // Подключаемся к базе данных
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        // Обновляем статус на Used в базе данных
        const updateSql = `
            UPDATE ${tableName} 
            SET status = 'Used', date_used = ?, locked = 1, \`user\` = 'Marketplace' 
            WHERE id = ?
        `;
        await connection.execute(updateSql, [dateNow, id]);

        await connection.commit();

        // Проверка и обновление статуса в reservedKyz
        handleReservedKyzAfterUpdate();

        res.json({ message: 'Статус успешно обновлен на Used.' });
    } catch (err) {
        console.error('Ошибка выполнения запроса:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Функция для проверки и обновления статуса после /kyzUpdateStatus
function handleReservedKyzAfterUpdate() {
    for (const [id, record] of reservedKyz.entries()) {
        if (record.status === 'Reserved') {
            // Изменяем статус на "Waiting"
            updateStatusInDatabase(record.tableName, id, 'Waiting');
            reservedKyz.delete(id); // Удаляем запись из хранилища
            console.log(`Статус записи с id=${id} изменен на "Waiting".`);
        }
    }
    // Очищаем массив полностью
    reservedKyz.clear();
    console.log('Массив reservedKyz очищен.');
}

// Получение размеров
app.get('/getWBSize', async (req, res) => {
	const { skus, brand } = req.query;
	if (!skus || !brand) {
		return res.status(400).send('SKU и/или компания не указаны')
	}

	try {
		const [rows] = await pool.execute(
			`SELECT size FROM products WHERE sku = ? AND company_name = ?`,
			[skus, brand]
		);
		if (rows.length > 0) {
			const size = rows[0].size;
			const techSize = String(size);
			res.json({ techSize: techSize })
		} else {
			res.status(404).send('Размер не найден')
		}
	} catch (error) {
		console.error('Ошибка при выполнении запроса:', error.message)
		res.status(500).send('Ошибка сервера.')
	}
});


// Эндпоинт для получения списка файлов
app.get('/files', (req, res) => {
	try {
		const files = getFilesRecursively(networkFolderPath);
		res.json({ files });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Эндпоинт для получения содержимого файла
app.get('/file', (req, res) => {
	const fileName = req.query.name;
	if (!fileName) {
		return res.status(400).json({ error: 'File name is required' });
	}
	const filePath = path.join(networkFolderPath, fileName);
	fs.stat(filePath, (err, stat) => {
		if (err) {
			return res.status(500).json({ error: err.message });
		}
		if (stat.isDirectory()) {
			return res.status(400).json({ error: 'Requested path is a directory' });
		}
		fs.readFile(filePath, (err, data) => {
			if (err) {
				return res.status(500).json({ error: err.message });
			}
			res.contentType("application/pdf");
			res.send(data);
		});
	});
});


// Маршрут для скачивания файла
app.get('/download', (req, res) => {
	const { fileBrand, generalArticle, article, size } = req.query;
	if (!fileBrand || !generalArticle || !article || !size) {
		return res.status(400).send('Missing required query parameters');
	}

	// Путь
	const filePath = path.join('\\\\WIN-SERVER\\bestfiles\\Упаковка', fileBrand, generalArticle, article, `${size}.pdf`);

	res.download(filePath, `${size}.pdf`, (err) => {
		if (err) {
			console.error('Error downloading the file:', err);
		}
	});
});

// Запуск сервера
app.listen(port, () => {
	console.log(`Сервер запущен на порту http://localhost:${port}/`);
});

// Закрытие подключения к базе данных при завершении работы сервера
process.on('SIGINT', async () => {
	try {
		await pool.end();
		console.log('Closed the database connection.');
		process.exit(0);
	} catch (err) {
		console.error(err.message);
		process.exit(1);
	}
});