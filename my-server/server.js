require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const fs = require('fs').promises;
const { pool, userPool } = require('./connectDB.js');
const { getCategoryByModel } = require('./config/articles.js');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Проверка подключения к базам данных
async function checkDatabaseConnection(poolName, pool) {
    try {
        const connection = await pool.getConnection();
        console.log(`Успешное подключение к базе данных ${poolName}`);
        connection.release();
    } catch (error) {
        console.error(`Ошибка подключения к базе данных ${poolName}:`, error.message);
    }
}

checkDatabaseConnection('bestserver', userPool);
checkDatabaseConnection('storagesigns', pool);

// Получение API-токена по ID
app.get('/api/getApiById', async (req, res) => {
    const { id, company_name, category } = req.query;

    if (!id || !company_name || !category) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const [rows] = await userPool.query(
            `SELECT token, expiration_date FROM api_data 
             WHERE id = ? AND company_name = ? AND category = ?`,
            [id, company_name, category]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Information not found' });
        }

        const { token, expiration_date } = rows[0];
        const isSubscriptionValid = !expiration_date || new Date(expiration_date) > new Date();

        return isSubscriptionValid
            ? res.json({ token })
            : res.status(404).json({ error: 'Subscription expired' });
    } catch (error) {
        console.error('Error executing query:', error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Получение размеров из базы данных
app.get('/getWBSize', async (req, res) => {
    const { skus, brand } = req.query;
    if (!skus || !brand) {
        return res.status(400).send('SKU и/или компания не указаны')
    }

    try {
        const [rows] = await pool.execute(
            `SELECT s.size 
            FROM models m
            JOIN sizes s ON s.size_id = m.size_id
            JOIN brands b ON b.brand_id = m.brand_id
            WHERE m.sku = ? AND b.brand = ?`,
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

// Обработка запроса KYZ
async function fetchAndReserveKyzRecords(pool, tableName, size, brand, model, count) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const selectQuery = `
            SELECT id, crypto, model, size 
            FROM ${connection.escapeId(tableName)}
            WHERE size = ? AND brand = ? AND model = ? AND status IN ('Comeback', 'Waiting')
            LIMIT ?
        `;

        const [rows] = await connection.execute(selectQuery, [size, brand, model, count]);

        if (rows.length < count) {
            await connection.rollback();
            return { success: false, error: `Не хватает записей: требуется ${count}, найдено ${rows.length}` };
        }

        const ids = rows.map(r => r.id);

        const updateQuery = `
            UPDATE ${connection.escapeId(tableName)}
            SET status = 'Reserved', user = 'Marketplace', date_used = NOW()
            WHERE id IN (${ids.map(() => '?').join(',')})
        `;

        const [result] = await connection.execute(updateQuery, ids);

        if (result.affectedRows !== ids.length) {
            await connection.rollback();
            return { success: false, error: `Не все записи были обновлены: ${result.affectedRows}/${ids.length}` };
        }

        await connection.commit();
        return { success: true, data: rows };

    } catch (err) {
        await connection.rollback();
        return { success: false, error: err.message };
    } finally {
        connection.release();
    }
}

app.get('/kyz', async (req, res) => {
    const { size, brand, model, count } = req.query;

    if (!size || !brand || !model || isNaN(count) || count <= 0) {
        return res.status(400).json({ error: 'Invalid parameters' });
    }

    try {
        const tableName = await getCategoryByModel(model, brand, size);
        console.log(`KYZ Request: size=${size}, brand=${brand}, model=${model}, count=${count}`);
        console.log(`KYZ Table: ${tableName}`);

        const result = await fetchAndReserveKyzRecords(pool, tableName, size, brand, model, count);

        if (!result.success) {
            console.error("Ошибка при резервировании:", result.error);
            return res.status(500).json({ error: result.error });
        }

        const { data } = result;
        console.log(`Статус успешно обновлен для записей: ${data.map(r => r.id)}`);

        res.json({
            data: data.map(row => ({
                Crypto: row.crypto,
                Model: row.model,
                Size: row.size,
                id: row.id,
                tableName
            }))
        });

    } catch (error) {
        console.error('Error processing KYZ request:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Маршрут для обновления статуса строки
app.post('/kyzComeback', async (req, res) => {
    const tableName = req.body.tableName;
    const id = req.body.id;

    console.log('KYZ comeback:', tableName, id);

    // Валидация входных данных
    if (tableName == null && id == null) {
        return res.json({ message: 'Статус успешно обновлен (ни tableName, ни id не переданы).' });
    }

    const query = `
        UPDATE ${tableName}
        SET status = 'Comeback'
        WHERE id = ?
    `;

    try {
        await pool.execute(query, [id]);
        return res.status(200).json({ message: 'Статус успешно обновлен на Comeback.' });
    } catch (err) {
        console.error(`Ошибка при обновлении статуса записи с id=${id}:`, err.message);
        return res.status(500).json({ error: 'Ошибка сервера при обновлении статуса.' });
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

// Основная функция
app.post('/getCryptoToFinishDocument', async (req, res) => {
    const { id, tableName, Crypto } = req.body;

    // Валидация входных данных
    if (!id || !tableName || !Crypto) {
        // console.log('Ошибка валидации:', { id, tableName, Crypto });
        return res.status(400).json({ error: 'ID, имя таблицы и Crypto обязательны.' });
    }

    try {
        // Проверяем существование записи
        const record = await validateRecordExistence(tableName, id, Crypto);
        if (!record) {
            console.log('Запись не найдена:', { id, tableName, Crypto });
            return res.status(404).json({ error: 'Запись не найдена.' });
        }

        // Получаем PDF
        const pdf = fetchPDF(record);

        // Отправляем PDF клиенту
        res.setHeader('Content-Type', 'application/pdf');
        res.send(pdf);
    } catch (err) {
        console.log('Ошибка выполнения запроса:', err.message);
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

        // Обновляем статус на Used в базе данных
        const updateSql = `
            UPDATE ${tableName} 
            SET status = 'Used', date_used = ?, locked = 1, \`user\` = 'Marketplace' 
            WHERE id = ?
        `;
        await pool.execute(updateSql, [dateNow, id]);
        res.json({ message: 'Статус успешно обновлен на Used.' });
    } catch (err) {
        console.error('Ошибка выполнения запроса:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
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
app.get('/file', async (req, res) => {
    const fileName = req.query.name;
    if (!fileName) {
        return res.status(400).json({ error: 'File name is required' });
    }

    const filePath = path.join(networkFolderPath, fileName);

    // Проверяем, существует ли файл
    fs.stat(filePath, async (err, stat) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // Файл не найден (ошибка 404)
                try {
                    // Создаем пустой PDF
                    const pdfDoc = await PDFDocument.create();
                    const pdfBytes = await pdfDoc.save();

                    // Отправляем пустой PDF в ответе
                    res.contentType('application/pdf');
                    res.send(pdfBytes);
                } catch (error) {
                    console.error('Error creating empty PDF:', error);
                    return res.status(500).json({ error: 'Failed to create empty PDF' });
                }
            } else {
                // Другая ошибка
                return res.status(500).json({ error: err.message });
            }
        }

        // Если файл существует, проверяем, является ли он директорией
        if (stat.isDirectory()) {
            return res.status(400).json({ error: 'Requested path is a directory' });
        }

        // Читаем и отправляем содержимое файла
        fs.readFile(filePath, (err, data) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.contentType('application/pdf');
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
    console.log(fileBrand, generalArticle, article, size)
    const filePath = path.join('\\\\WIN-SERVER\\bestfiles\\Упаковка', fileBrand, generalArticle, article, `${size}.pdf`);

    res.download(filePath, `${size}.pdf`, (err) => {
        if (err) {
            console.error('Error downloading the file:', err);
        }
    });
});

app.get("/removeKYZReserves", async (req, res) => {
  const brand = req.query.brand?.toLowerCase();
  if (!brand) {
    return res.status(400).json({ error: "Не передан параметр brand" });
  }

  let successCount = 0;
  let failCount = 0;
  let errors = [];

  try {
    const [categories] = await pool.query(
      "SELECT DISTINCT category FROM model_categories"
    );

    const results = await Promise.allSettled(
      categories.map(row => {
        const tableName = `${brand}_${row.category}`;
        return pool.query(
          `UPDATE \`${tableName}\`
           SET status = 'Comeback', locked = 0, date_used = NOW()
           WHERE status = 'Reserved'`
        ).then(([result]) => ({
          table: tableName,
          count: result.affectedRows
        }));
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled") {
        successCount += r.value.count;
      } else {
        failCount++;
        errors.push({
          table: r.reason?.table || "unknown",
          error: r.reason.message
        });
      }
    }

    res.json({
      brand,
      successCount,
      failCount,
      errors
    });
  } catch (err) {
    res.status(500).json({ error: "Ошибка при обработке", details: err.message });
  }
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