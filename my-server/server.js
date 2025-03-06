const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const cors = require('cors');
const port = 3000;
const portSocket = 3002;
const fs = require('fs');
const os = require('os');
const multer = require('multer');
const { processPDF } = require('./pdfProcessor.js');
const mysql = require('mysql2/promise');

const dbApi = mysql.createPool({
    host: '192.168.100.170',
    user: 'root',
    password: 'root',
    database: 'bestserver',
    waitForConnections: true,
    connectionLimit: 10,
});

// Для работы с сокетами
const http = require('http');
const socketIo = require('socket.io');
const server = http.createServer();

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('Client connected');
});

app.use(cors()); // Разрешает все источники
app.use(bodyParser.json({ limit: '10mb' }));

// Проверка подключения к базе
dbApi.getConnection()
    .then((connection) => {
        if (connection) {
            console.log('Успешное подключение к базе данных bestserver');
            connection.release();
        }
    })
    .catch((err) => {
        console.error('Ошибка подключения к базе:', err.message);
    });
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

// Подключение к базе данных
const db = new sqlite3.Database('./database/products.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Ошибка при открытии базы данных', err.message);
    } else {
        console.log(' Успешное подключение к products');
    }
});

let dbKYZ = new sqlite3.Database('./database/honestsigndb.db', (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log(' Успешное подключение к honestsigndb');
    }
});

// const saveDataAboutDelivery = new sqlite3.Database('./database/SaveDataAboutDelivery.db', sqlite3.OPEN_READWRITE, (err) => {
//     if (err) {
//         console.error('Ошибка при открытии базы данных', err.message);
//     } else {
//         console.log(' Успешное подключение к SaveDataAboutDelivery');
//     }
// });

// Middleware для обработки JSON
app.use(bodyParser.json());

const networkFolderPath = 'Z:\\Упаковка\\ARMBEST';

// Добавление CORS, если необходимо
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Функция для рекурсивного получения списка файлов и директорий
function getFilesRecursively(directory) {
    let results = [];
    const list = fs.readdirSync(directory);
    list.forEach(file => {
        const filePath = path.join(directory, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFilesRecursively(filePath));
        } else {
            results.push(filePath);
        }
    });
    return results;
}

app.get('/getApiById', async (req, res) => {
    const { id, company_name, category } = req.query; // Извлечение параметров запроса

    try {
        const today = new Date(); // Текущая дата

        // Запрос для получения токена и даты истечения подписки
        const [rows] = await dbApi.query(
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

// KYZ
app.get('/kyzSizes', (req, res) => {
    const brand = req.query.brand;
    if (brand != 'Best26'){
        const query = `
            SELECT Size, COUNT(*) as Quantity
            FROM lines
            WHERE 
                (Status = 'Waiting' OR Status = 'Comeback')
                AND brand = ? 
            GROUP BY Size
            ORDER BY Size
        `;

        dbKYZ.all(query, [brand], (err, rows) => {
            if (err) {
                console.error(err); // Логирование ошибки
                res.status(500).json({ error: 'Internal Server Error' }); // Отправка ошибки клиенту
                return;
            }
            res.json(rows);
        });
    } else {
        const query = `
            SELECT Size, Model, COUNT(*) as Quantity
            FROM lines
            WHERE 
                (Status = 'Waiting' OR Status = 'Comeback')
                AND brand = ?
            GROUP BY Size, Model
            ORDER BY Size
        `;

        dbKYZ.all(query, [brand], (err, rows) => {
            if (err) {
                console.error(err); // Логирование ошибки
                res.status(500).json({ error: 'Internal Server Error' }); // Отправка ошибки клиенту
                return;
            }
            res.json(rows);
        });
    }
});

app.get('/kyz', (req, res) => {
    const size = req.query.Size;
    const brand = req.query.brand;
    const model = req.query.Model;
    console.log(req.query)
    if (size && brand && model) {
        // Запрос для статуса 'Comeback'
        const comebackPromise = new Promise((resolve, reject) => {
            dbKYZ.all('SELECT line, Model, Size, fullline FROM lines WHERE Size = ? AND brand = ? AND Status = "Comeback" AND Model = ?', [size, brand, model], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(rows)

                    resolve(rows);
                }
            });
        });

        // Запрос для статуса 'Waiting'
        const waitingPromise = new Promise((resolve, reject) => {
            dbKYZ.all('SELECT line, Model, Size, fullline FROM lines WHERE Size = ? AND brand = ? AND Status = "Waiting" AND Model = ?', [size, brand, model], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(rows)
                    resolve(rows);
                }
            });
        });

        // Выполняем оба запроса параллельно
        Promise.all([comebackPromise, waitingPromise])
            .then(results => {
                const [comebackRows, waitingRows] = results;
                const allRows = [...comebackRows, ...waitingRows];
                res.json({ data: allRows });
            })
            .catch(err => {
                res.status(500).json({ error: err.message });
            });
    } else {
        res.status(400).json({ error: 'Size and brand and model parameters are required' });
    }
});

app.post('/kyzComeback', (req, res) => {
    const line = req.body.line;
    const size = req.body.size;
    const brand = req.body.brand;

    const query = `UPDATE lines SET Status = 'Comeback' WHERE line = ?  AND brand = ? AND Size= ?`;
    console.log(req.body)
    dbKYZ.run(query, [line, brand, size], function(err) {
        if (err) {
            console.error('Ошибка при выполнении запроса', err);
            res.status(500).json({ error: 'Ошибка при выполнении запроса' });
        } else {
            res.json({ message: 'Статус успешно обновлен' });
        }
    });
});

// Получение ЧЗ для финального скачивания документов
app.post('/getlineToFinishDocument', (req, res) => {
    const { kyz, size, brand } = req.body;
    // Валидация входных данных
    if (!kyz || !size || !brand) {
        return res.status(400).json({ error: 'Некорректные входные данные' });
    }
    const sql = 'SELECT data FROM lines WHERE line = ? AND size = ? AND brand = ?';
    dbKYZ.get(sql, [kyz, size, brand], (error, result) => {
        if (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({ error: 'Ошибка запроса' });
            return;
        }

        if (!result) {
            return res.status(404).json({ error: 'Данные не найдены' });
        }
       
        res.setHeader('Content-Type', 'application/pdf');
        res.send(result.data);
    });
});

// Сохранение информации о поставке в базе данных SaveDataAboutDelivery
app.post('/SaveDataKyzToDB', (req, res) => {
    const { date, delivery, quantity } = req.body;
    if (typeof delivery !== 'string') {
        return res.status(400).json({ error: 'Delivery must be a string' });
      }    
    const stmt = saveDataAboutDelivery.prepare('INSERT INTO DeliveryData (date, delivery, quantity) VALUES (?, ?, ?)');
    stmt.run(date,delivery,quantity, function(err) {
        if (err) {
            console.error('Ошибка при выполнении запроса', err);
            res.status(500).json({ error: 'Ошибка при выполнении запроса' });
        } else {
            res.status(200).json({ message: 'Data added successfully', id: this.lastID });
        }
    });
    stmt.finalize();
});

// Обновление статуса киза
app.put('/kyzUpdatestatus', (req, res) => {
    const { line, dateNow  } = req.body;
    const stmt = dbKYZ.prepare("UPDATE lines SET Status = 'Used', created_at = ? WHERE line = ?");
    stmt.run(dateNow, line, function(err) {
        if (err) {
            console.error('Error during update:', err); 
            res.status(500).json({ message: 'Database error', error: err });
        } else {
            res.json({ message: 'Status updated successfully', changes: this.changes });
        }
    });
    stmt.finalize();
});

// Конфигурация multer для обработки загрузки файлов
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Загрузка нового киза
app.post('/uploadNewKyz', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ message: 'No file uploaded.' });
        }

        const fileName = req.file.originalname;
        const fileBuffer = req.file.buffer;
        const brandData = JSON.parse(req.body.brandData);

        // Обработка PDF
        await processPDF(fileBuffer, fileName, brandData, io);
        
        res.status(200).send({ message: 'File processed successfully.' });
    } catch (err) {
        console.error('Error processing file:', err);
        res.status(500).send({ message: 'Error processing file.' });
    }
});

// Получение списка успешных доставок
app.get('/getdeliveryinfo/:id', (req, res) => {
    const deliveryId = req.params.id;
    saveDataAboutDelivery.get('SELECT * FROM DeliveryData WHERE id = ?', [deliveryId], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Delivery not found' });
      }
      res.status(200).json(row);
    });
});

// Перенос KYZ, которые старше 1 минуты в таблицу DeleteKYZ
const transferAndDeleteOldRecords = () => {
    dbKYZ.serialize(() => {
        // Начало транзакции
        dbKYZ.run("BEGIN TRANSACTION");
        // Подготовка SQL-запроса для вставки данных в таблицу DeleteKYZ
        const insertStmt = `
            INSERT INTO DeleteKYZ (id, line, Status, Size, created_at, brand, data, Model, color, page) 
            SELECT id, line, Status, Size, created_at, brand, data, Model, color, page
            FROM lines 
            WHERE Status = 'Used' AND created_at <= datetime('now', '-3 day')
        `;
        dbKYZ.run(insertStmt, function(err) {
            if (err) {
                console.error('Error during transferring old records:', err);
                dbKYZ.run("ROLLBACK"); // Откат транзакции в случае ошибки
                return;
            }
            // Подготовка SQL-запроса для удаления данных из таблицы lines
            const deleteStmt = `
                DELETE FROM lines 
                WHERE Status = 'Used' AND created_at <= datetime('now', '-3 day')
            `;

            dbKYZ.run(deleteStmt, function(err) {
                if (err) {
                    console.error('Error during deleting old records:', err);
                    dbKYZ.run("ROLLBACK"); // Откат транзакции в случае ошибки
                } else {
                    dbKYZ.run("COMMIT"); // Фиксация транзакции в случае успеха
                }
            });
        });
    });
};
transferAndDeleteOldRecords();

// Обработчик GET запроса на получение данных о моделях из разных таблиц
app.get('/getModelArmbest', (req, res) => {
    const sql = 'SELECT * FROM product_sizesArmbest'; // Выборка всех записей из таблицы
    // Выполнение SQL запроса к базе данных
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Ошибка выполнения SQL запроса', err.message);
            res.status(500).send('Ошибка выполнения запроса к базе данных');
        } else {
            res.json(rows); // Отправляем данные в формате JSON клиенту
        }
    });
});
app.get('/getModelBest26', (req, res) => {
    const sql = 'SELECT * FROM product_sizesBest26'; // Выборка всех записей из таблицы
    // Выполнение SQL запроса к базе данных
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Ошибка выполнения SQL запроса', err.message);
            res.status(500).send('Ошибка выполнения запроса к базе данных');
        } else {
            res.json(rows); // Отправляем данные в формате JSON клиенту
        }
    });
});
app.get('/getModelBestShoes', (req, res) => {
    const sql = 'SELECT * FROM product_sizesBestShoes'; // Выборка всех записей из таблицы
    // Выполнение SQL запроса к базе данных
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Ошибка выполнения SQL запроса', err.message);
            res.status(500).send('Ошибка выполнения запроса к базе данных');
        } else {
            res.json(rows); // Отправляем данные в формате JSON клиенту
        }
    });
});

// Обслуживание статических файлов! 
app.use(express.static(path.join(__dirname, 'public')));

// Маршрут для обновления базы данных
app.post('/update-element', (req, res) => {
    const { vendorcode, wbsize , pair} = req.body;

    if (typeof vendorcode === 'undefined' || typeof wbsize === 'undefined' || typeof pair === 'undefined') {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const query = `UPDATE product_sizes SET pair = ? WHERE vendor_code = ? AND wb_size = ?`;
    db.run(query, [pair, vendorcode, wbsize], function(err) {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, message: 'Data updated successfully', changes: this.changes });
    });
});

// Маршрут для удаления элемента
app.post('/delete-element', (req, res) => {
    const { vendorcode, wbsize , pair} = req.body;
    // SQL-запрос на удаление элемента из базы данных
    const query = `DELETE FROM product_sizes WHERE vendor_code = ? AND wb_size = ? AND pair = ?`;
    db.run(query, [vendorcode, wbsize, pair], function(err) {
        if (err) {
            console.error('Database delete error:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: 'Element not found' });
        }
        res.json({ success: true, message: 'Element deleted successfully' });
    });
});

// Маршрут для добавления нового элемента
app.post('/add-element', (req, res) => {
    const { vendorcode, wbsize, pair } = req.body;
    // SQL-запрос на добавление нового элемента в базу данных
    const query = `INSERT INTO product_sizes (vendor_code, wb_size, pair) VALUES (?, ?, ?)`;
    db.run(query, [vendorcode, wbsize, pair], function(err) {
        if (err) {
            console.error('Database insert error:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, message: 'Element added successfully' });
    });
});

// Получить размер
app.get('/getWbSizeArmbest', (req, res) => {
    const skus = req.query.skus;
    db.get(`SELECT tech_size FROM product_sizesArmbest WHERE skus = ?`, [skus], (err, row) => {
        if (err) {
            res.status(500).send(err);
        } else if (row) {
            res.json({ tech_size: row.tech_size });
        } else {
            res.status(404).send('Размер не найден');
        }
    });
});
app.get('/getWbSizeBest26', (req, res) => {
    const skus = req.query.skus;
    db.get(`SELECT tech_size FROM product_sizesBest26 WHERE skus = ?`, [skus], (err, row) => {
        if (err) {
            res.status(500).send(err);
        } else if (row) {
            res.json({ tech_size: row.tech_size });
        } else {
            res.status(404).send('Размер не найден');
        }
    });
});
app.get('/getWbSizeBestShoes', (req, res) => {
    const skus = req.query.skus;
    db.get(`SELECT tech_size FROM product_sizesBestShoes WHERE skus = ?`, [skus], (err, row) => {
        if (err) {
            res.status(500).send(err);
        } else if (row) {
            res.json({ tech_size: row.tech_size });
        } else {
            res.status(404).send('Размер не найден');
        }
    });
});

// // Функция для вывода информации о памяти
// function printMemoryUsage() {
//     const freeMemory = os.freemem();
//     console.log(`Свободная память: ${(freeMemory / 1024 / 1024).toFixed(2)} MB`);
// }

// setInterval(printMemoryUsage, 5000); // Вывод информации каждые 5 секунд

// Функция для нормализации размеров (удаление повторяющихся значений)
const normalizeSize = (sizeString) => {
    // Разделяем строку на массив размеров
    const sizes = sizeString.split('-').map(size => size.trim());
    // Убираем дублирующиеся размеры
    const uniqueSizes = [...new Set(sizes)];
    // Возвращаем нормализованный размер в виде строки
    return uniqueSizes.join('-');
};

// Функция для добавления недостающих моделей с размером в отчет
const addMissingSizes = (modelsRows, reportMap, shortage) => {
    modelsRows.forEach(modelRow => {
        const key = `${modelRow.Model}_${modelRow.Size}`;
        const quantity = reportMap.get(key); // Проверяем, есть ли модель и размер в отчете

        if (quantity === undefined) {
            // Если модели и размера нет в отчете, добавляем их в нехватку с количеством 0
            shortage.push({
                Model: modelRow.Model,
                Size: modelRow.Size,
                Quantity: 0
            });
        }
    });
};

// Эндпоинт для формирования отчета
const ExcelJS = require('exceljs');

app.get('/report_hs', async (req, res) => {
    try {
        const brand = req.query.brand;
        if (!brand) return res.status(400).json({ error: 'Параметр brand обязателен' });

        const reportQuery = `
            SELECT Model, Size, COUNT(CASE WHEN Status = 'Waiting' THEN 1 ELSE NULL END) AS Quantity
            FROM lines
            WHERE brand = ?
            GROUP BY Model, Size
        `;

        const modelsQuery = `
            SELECT vendor_code AS Model, size_key AS Size 
            FROM product_sizes${brand}
        `;

        const reportQuerySize = `
            SELECT Model, Size, COUNT(CASE WHEN Status = 'Used' THEN 1 ELSE NULL END) AS Quantity
            FROM DeleteKYZ
            WHERE brand = ?
            GROUP BY Model, Size
        `;

        const reportRows = await queryDatabase(dbKYZ, reportQuery, [brand]);
        const modelsRows = await queryDatabase(db, modelsQuery, []);

        const reportMap = new Map(reportRows.map(row => [`${row.Model}_${row.Size}`, row.Quantity]));

        const available = [];
        const shortage = [];

        reportRows.forEach(row => {
            const quantity = row.Quantity;
            const targetArray = quantity > 10 ? available : shortage;
            targetArray.push({ Model: row.Model, Size: row.Size, Quantity: quantity });
        });

        if (brand === 'Best26') {
            modelsRows.forEach(modelRow => {
                const key = `${modelRow.Model}_${modelRow.Size}`;
                if (!reportMap.has(key)) {
                    shortage.push({ Model: modelRow.Model, Size: modelRow.Size, Quantity: 0 });
                }
            });
        } else {
            const deleteKYZRows = await queryDatabase(dbKYZ, reportQuerySize, [brand]);
            deleteKYZRows.forEach(row => {
                const key = `${row.Model}_${row.Size}`;
                if (!reportMap.has(key)) {
                    shortage.push({ Model: row.Model, Size: row.Size, Quantity: 0 });
                }
            });
        }

        const workbook = createExcelReport(available, shortage);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${brand}_report.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

function queryDatabase(db, query, params) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => (err ? reject(err) : resolve(rows)));
    });
}

function createExcelReport(available, shortage) {
    const workbook = new ExcelJS.Workbook();
    
    const createSheet = (sheetName, data) => {
        const sheet = workbook.addWorksheet(sheetName);
        sheet.columns = [
            { header: 'Модель', key: 'Model', width: 20 },
            { header: 'Размер', key: 'Size', width: 20 },
            { header: 'Количество ЧЗ', key: 'Quantity', width: 20 },
        ];
        data.forEach(row => {
            const newRow = sheet.addRow(row);
            styleRow(newRow, row.Quantity);
        });
    };
    
    const styleRow = (row, quantity) => {
        let fillColor = 'FFFFFF';
        if (quantity < 5) fillColor = 'EE2028';
        else if (quantity >= 5 && quantity <= 8) fillColor = 'F7941F';
        else if (quantity > 8) fillColor = '20B04B';
        
        row.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
            cell.font = { bold: quantity <= 10 };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
    };

    createSheet('Есть в наличии', available);
    createSheet('Нехватка', shortage);
    return workbook;
}

// Запуск сервера
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
// Запуск сервера сокетов
server.listen(portSocket, () => {
    console.log(`WebSocket is running on port https://localhost:${portSocket}`);
  });
// Закрытие подключения к базе данных при завершении работы сервера
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Closed the database connection.');
        process.exit(0);
    });
});