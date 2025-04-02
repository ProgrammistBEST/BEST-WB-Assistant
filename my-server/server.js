require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 3000;
const fs = require('fs');
const multer = require('multer');
const { processPDF } = require('./pdfProcessor.js');
require('mysql2/promise');
// Подключение к бд
const { pool, userPool } = require('./connectDB.js'); // Импортируем пулы из connect.js

// Получение честного знака из таблицы
const { getCategoryByModel } = require('./config/articles.js')

// Эндпоинт для формирования отчета
const ExcelJS = require('exceljs');

// Конфигурация multer для обработки загрузки файлов
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Обслуживание статических файлов
app.use(express.static(path.join(__dirname, 'public')));

// Для работы с сокетами
const http = require('http');
const socketIo = require('socket.io');
const server = http.createServer(app); // Используем один порт для Express и Socket.IO

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

const networkFolderPath = 'Z:\\Упаковка\\ARMBEST';

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

// Эндпоинт для получения API-токена по ID
app.get('/getApiById', async (req, res) => {
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

app.get('/kyz', async (req, res) => {
  const { size, brand, model } = req.query;

  // Логируем входные данные
  console.table([{ brand, size, model }]);

  // Валидация входных данных
  if (!size || !brand || !model) {
      return res.status(400).json({ error: 'Параметры size, brand и model обязательны.' });
  }

  try {
      // Получаем имя таблицы
      const tableName = await getCategoryByModel(model, brand, size);
      console.log(`Имя таблицы: ${tableName}`);

      // Проверка имени таблицы
      if (!tableName || typeof tableName !== 'string') {
          return res.status(500).json({ error: 'Некорректное имя таблицы.' });
      }

      // Запрос для статуса 'Comeback'
      const comebackQuery = `
          SELECT Crypto, Model, Size 
          FROM ${tableName} 
          WHERE Size = ? AND Brand = ? AND Status = 'Comeback' AND Model = ?
      `;

      // Запрос для статуса 'Waiting'
      const waitingQuery = `
          SELECT Crypto, Model, Size 
          FROM ${tableName} 
          WHERE Size = ? AND Brand = ? AND Status = 'Waiting' AND Model = ?
      `;

      // Выполняем оба запроса параллельно
      const [comebackRows] = await pool.execute(comebackQuery, [size, brand, model]);
      const [waitingRows] = await pool.execute(waitingQuery, [size, brand, model]);

      // Логирование результатов запросов
      console.log('Результаты запроса Comeback:', comebackRows);
      console.log('Результаты запроса Waiting:', waitingRows);

      // Объединяем результаты
      const allRows = [...comebackRows, ...waitingRows];
      res.json({ data: allRows });
  } catch (err) {
      console.error('Ошибка выполнения запроса:', err.message);
      console.error('Код ошибки:', err.code);
      console.error('Стек вызовов:', err.stack);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Маршрут для обновления статуса строки
app.post('/kyzComeback', async (req, res) => {
  const { crypto, size, brand } = req.body;

  // Валидация входных данных
  if (!crypto || !size || !brand) {
    return res.status(400).json({ error: 'Некорректные входные данные' });
  }

  try {
    // Получаем имя таблицы
    const tableName = await getCategoryByModel(model, brand);

    const query = `
          UPDATE ?? 
          SET Status = 'Comeback' 
          WHERE crypto = ? AND brand = ? AND size = ?
      `;
    const [result] = await pool.execute(query, [tableName, crypto, brand, size]);

    // Проверка, были ли затронуты строки
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }

    res.json({ message: 'Статус успешно обновлен' });
  } catch (err) {
    console.error('Ошибка при выполнении запроса:', err.message);
    res.status(500).json({ error: 'Ошибка при выполнении запроса' });
  }
});

// Получение ЧЗ для финального скачивания документов
app.post('/getLineToFinishDocument', async (req, res) => {
  const { kyz, size, brand, model } = req.body;

  // Валидация входных данных
  if (!kyz || !size || !brand || !model) {
    return res.status(400).json({ error: 'Некорректные входные данные' });
  }

  try {
    // Получение имени таблицы
    const tableName = await getCategoryByModel(model, brand);

    // Формирование запроса с использованием параметризации
    const sql = `
      SELECT data 
      FROM ?? 
      WHERE crypto = ? AND size = ? AND brand = ?
    `;
    const [rows] = await pool.execute(sql, [tableName, kyz, size, brand]);

    // Проверка, что данные найдены
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Данные не найдены' });
    }

    // Отправка PDF-файла
    const result = rows[0];
    res.setHeader('Content-Type', 'application/pdf');
    res.send(result.data);
  } catch (err) {
    console.error('Ошибка запроса:', err.message);
    res.status(500).json({ error: 'Ошибка запроса' });
  }
});

// Сохранение информации о поставке в базе данных SaveDataAboutDelivery
app.post('/SaveDataKyzToDB', async (req, res) => {
  const { date, delivery, quantity } = req.body;

  // Валидация входных данных
  if (!date || typeof delivery !== 'string' || typeof quantity !== 'number') {
    return res.status(400).json({ error: 'Некорректные входные данные' });
  }

  try {
    const query = `
            INSERT INTO DeliveryData (date, delivery, quantity) 
            VALUES (?, ?, ?)
        `;
    const [result] = await pool.execute(query, [date, delivery, quantity]);

    res.status(200).json({ message: 'Data added successfully', id: result.insertId });
  } catch (err) {
    console.error('Ошибка при выполнении запроса:', err.message);
    res.status(500).json({ error: 'Ошибка при выполнении запроса' });
  }
});

// Обновление статуса киза
app.put('/kyzUpdateStatus', async (req, res) => {
  const { model, brand, crypto, dateNow } = req.body;

  // Валидация входных данных
  if (!crypto || !dateNow || !model || !brand) {
    return res.status(400).json({ error: 'Некорректные входные данные' });
  }

  try {
    // Получение имени таблицы
    const tableName = await getCategoryByModel(model, brand);

    // Формирование запроса с использованием параметризации
    const query = `
            UPDATE ?? 
            SET Status = 'Used', created_at = ? 
            WHERE crypto = ?
        `;
    const [result] = await pool.execute(query, [tableName, dateNow, crypto]);

    // Проверка, были ли затронуты строки
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }

    res.json({ message: 'Статус успешно обновлен', changes: result.affectedRows });
  } catch (err) {
    console.error('Ошибка при выполнении запроса:', err.message);
    res.status(500).json({ error: 'Ошибка при выполнении запроса' });
  }
});

// Загрузка нового киза
app.post('/uploadNewKyz', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: 'Файл не загружен.' });
    }

    const fileName = req.file.originalname;
    const fileBuffer = req.file.buffer;
    const brandData = JSON.parse(req.body.brandData);

    // Генерируем уникальный ID для загрузки
    const uploadId = Date.now();
    const abortController = new AbortController();
    activeUploads.set(uploadId, abortController);

    // Начало транзакции
    await new Promise((resolve, reject) => {
      dbKYZ.run("BEGIN TRANSACTION;", (err) => {
        if (err) {
          console.error("Failed to start transaction:", err);
          return reject(err);
        }
        transactionStarted = true;
        resolve();
      });
    });

    // Уведомляем клиентов о начале загрузки
    io.emit("upload_status", { progress: 10, message: "Начинается загрузка..." });

    // Обработка PDF
    await processPDF(fileBuffer, fileName, brandData, abortController.signal, io);

    res.status(200).send({ message: 'Файл успешно обработан.' });
  } catch (err) {
    console.error('Ошибка при обработке файла:', err);
    res.status(500).send({ message: 'Ошибка при обработке файла.' });
  }
});

// Получение списка успешных доставок
app.get('/getdeliveryinfo/:id', async (req, res) => {
  const deliveryId = req.params.id;

  try {
    const query = `
            SELECT * 
            FROM DeliveryData 
            WHERE id = ?
        `;
    const [rows] = await pool.execute(query, [deliveryId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Доставка не найдена' });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Ошибка при выполнении запроса:', err.message);
    res.status(500).json({ error: 'Ошибка при выполнении запроса' });
  }
});

// Перенос KYZ, которые старше 3 дней, в таблицу DeleteKYZ
// const transferAndDeleteOldRecords = async () => {
//   const connection = await pool.getConnection();

//   try {
//     // Начало транзакции
//     await connection.beginTransaction();

//     // Вставка данных в таблицу DeleteKYZ
//     const insertQuery = `
//             INSERT INTO DeleteKYZ (id, crypto, Status, size, created_at, brand, data, model, color, page) 
//             SELECT id, crypto, Status, size, created_at, brand, data, model, color, page
//             FROM lines 
//             WHERE Status = 'Used' AND created_at <= DATE_SUB(NOW(), INTERVAL 3 DAY)
//         `;
//     await connection.execute(insertQuery);

//     // Удаление данных из таблицы lines
//     const deleteQuery = `
//             DELETE FROM lines 
//             WHERE Status = 'Used' AND created_at <= DATE_SUB(NOW(), INTERVAL 3 DAY)
//         `;
//     await connection.execute(deleteQuery);

//     // Фиксация транзакции
//     await connection.commit();
//     console.log('Транзакция успешно завершена.');
//   } catch (err) {
//     // Откат транзакции в случае ошибки
//     await connection.rollback();
//     console.error('Ошибка при выполнении транзакции:', err.message);
//   } finally {
//     // Освобождение соединения
//     connection.release();
//   }
// };

// // Запуск функции переноса старых записей
// transferAndDeleteOldRecords();

// Обработчик GET запроса на получение данных о моделях из разных таблиц
// app.get('/getModelArmbest', async (req, res) => {
//   try {
//     const query = 'SELECT * FROM product_sizesArmbest'; // Выборка всех записей из таблицы
//     const [rows] = await pool.execute(query);

//     res.json(rows); // Отправляем данные в формате JSON клиенту
//   } catch (err) {
//     console.error('Ошибка выполнения SQL запроса:', err.message);
//     res.status(500).json({ error: 'Ошибка выполнения запроса к базе данных' });
//   }
// });

// app.get('/getModelBest26', async (req, res) => {
//   try {
//     const query = 'SELECT * FROM product_sizesBest26'; // Выборка всех записей из таблицы
//     const [rows] = await pool.execute(query);

//     res.json(rows); // Отправляем данные в формате JSON клиенту
//   } catch (err) {
//     console.error('Ошибка выполнения SQL запроса:', err.message);
//     res.status(500).json({ error: 'Ошибка выполнения запроса к базе данных' });
//   }
// });

// app.get('/getModelBestshoes', async (req, res) => {
//   try {
//     const query = 'SELECT * FROM product_sizesBestshoes'; // Выборка всех записей из таблицы
//     const [rows] = await pool.execute(query);

//     res.json(rows); // Отправляем данные в формате JSON клиенту
//   } catch (err) {
//     console.error('Ошибка выполнения SQL запроса:', err.message);
//     res.status(500).json({ error: 'Ошибка выполнения запроса к базе данных' });
//   }
// });

// Маршрут для обновления базы данных
app.post('/update-element', async (req, res) => {
  const { vendorcode, wbsize, pair } = req.body;

  // Валидация входных данных
  if (typeof vendorcode === 'undefined' || typeof wbsize === 'undefined' || typeof pair === 'undefined') {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    const query = `
            UPDATE product_sizes 
            SET pair = ? 
            WHERE vendor_code = ? AND wb_size = ?
        `;
    const [result] = await pool.execute(query, [pair, vendorcode, wbsize]);

    // Проверка, были ли затронуты строки
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Запись не найдена' });
    }

    res.json({ success: true, message: 'Data updated successfully', changes: result.affectedRows });
  } catch (err) {
    console.error('Ошибка выполнения SQL запроса:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Маршрут для удаления элемента
app.post('/delete-element', async (req, res) => {
  const { vendorcode, wbsize, pair } = req.body;

  // Валидация входных данных
  if (!vendorcode || !wbsize || !pair) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    const query = `
            DELETE FROM product_sizes 
            WHERE vendor_code = ? AND wb_size = ? AND pair = ?
        `;
    const [result] = await pool.execute(query, [vendorcode, wbsize, pair]);

    // Проверка, были ли затронуты строки
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Element not found' });
    }

    res.json({ success: true, message: 'Element deleted successfully' });
  } catch (err) {
    console.error('Database delete error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Маршрут для добавления нового элемента
app.post('/add-element', async (req, res) => {
  const { vendorcode, wbsize, pair } = req.body;

  // Валидация входных данных
  if (!vendorcode || !wbsize || !pair) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    const query = `
            INSERT INTO product_sizes (vendor_code, wb_size, pair) 
            VALUES (?, ?, ?)
        `;
    const [result] = await pool.execute(query, [vendorcode, wbsize, pair]);

    res.json({ success: true, message: 'Element added successfully', id: result.insertId });
  } catch (err) {
    console.error('Database insert error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Получить размер для Armbest
app.get('/getWbSizeArmbest', async (req, res) => {
  const skus = req.query.skus;

  // Проверяем, что SKU передан в запросе
  if (!skus) {
    return res.status(400).send('SKU не указан');
  }

  try {
    // Выполняем запрос к базе данных
    const [rows] = await pool.execute(
      'SELECT size FROM products WHERE company_name = ? AND sku = ?',
      ['Armbest', skus]
    );

    // Если размер найден, формируем ответ в нужном формате
    if (rows.length > 0) {
      const size = rows[0].size;
      const techSize = String(size); // Преобразуем размер в строку
      res.json({ tech_size: techSize }); // Отправляем данные в формате { tech_size: 'значение' }
    } else {
      res.status(404).send('Размер не найден');
    }
  } catch (error) {
    console.error('Ошибка при выполнении запроса:', error.message);
    res.status(500).send('Ошибка сервера');
  }
});

// Получить размер для Best26
app.get('/getWbSizeBest26', async (req, res) => {
  const skus = req.query.skus;

  // Проверяем, что SKU передан в запросе
  if (!skus) {
    return res.status(400).send('SKU не указан');
  }

  try {
    // Выполняем запрос к базе данных
    const [rows] = await pool.execute(
      'SELECT size FROM products WHERE company_name = ? AND sku = ?',
      ['Best26', skus]
    );

    // Если размер найден, формируем ответ
    if (rows.length > 0 && rows[0].size !== null) {
      const techSize = String(rows[0].size); // Преобразуем размер в строку
      return res.json({ tech_size: techSize }); // Отправляем данные в формате { tech_size: 'значение' }
    }

    // Если размер не найден
    res.status(404).send('Размер не найден');
  } catch (error) {
    console.error(`Ошибка при выполнении запроса для Best26 SKU ${skus}:`, error.message);
    res.status(500).send('Ошибка сервера');
  }
});

// Получить размер для Bestshoes
app.get('/getWbSizeBestshoes', async (req, res) => {
  const skus = req.query.skus;

  // Проверяем, что SKU передан в запросе
  if (!skus) {
    return res.status(400).send('SKU не указан');
  }

  try {
    // Выполняем запрос к базе данных
    const [rows] = await pool.execute(
      'SELECT size FROM products WHERE company_name = ? AND sku = ?',
      ['Bestshoes', skus]
    );

    // Если размер найден, формируем ответ
    if (rows.length > 0 && rows[0].size !== null) {
      const techSize = String(rows[0].size); // Преобразуем размер в строку
      return res.json({ tech_size: techSize }); // Отправляем данные в формате { tech_size: 'значение' }
    }

    // Если размер не найден
    res.status(404).send('Размер не найден');
  } catch (error) {
    console.error(`Ошибка при выполнении запроса для Bestshoes SKU ${skus}:`, error.message);
    res.status(500).send('Ошибка сервера');
  }
});

// Функция для вывода информации о памяти
// function printMemoryUsage() {
//     const freeMemory = os.freemem();
//     console.log(`Свободная память: ${(freeMemory / 1024 / 1024).toFixed(2)} MB`);
// }

// setInterval(printMemoryUsage, 5000); // Вывод информации каждые 5 секунд

// app.get('/report_hs', async (req, res) => {
//   try {
//     const brand = req.query.brand;
//     if (!brand) {
//       return res.status(400).json({ error: 'Параметр brand обязателен' });
//     }

//     // Нормализация имени бренда (нижний регистр)
//     const normalizedBrand = brand.trim().toLowerCase();

//     // Запрос для получения данных из таблицы lines (MySQL)
//     const reportQuery = `
//             SELECT model, size, 
//                    COUNT(CASE WHEN Status = 'Waiting' THEN 1 ELSE NULL END) AS Quantity_Waiting,
//                    COUNT(CASE WHEN Status = 'Comeback' THEN 1 ELSE NULL END) AS Quantity_Comeback
//             FROM lines
//             WHERE LOWER(brand) = ?
//             GROUP BY model, size
//         `;
//     const [reportRows] = await pool.execute(reportQuery, [normalizedBrand]);
//     console.log("reportRows:", reportRows);

//     // Создаем карту для быстрого доступа к данным из таблицы lines
//     const reportMap = new Map(reportRows.map(row => [`${row.model}_${row.size}`, row.Quantity_Waiting + row.Quantity_Comeback]));
//     console.log("reportMap", reportMap);

//     // Запрос к таблице products (MySQL)
//     const [modelsRows] = await pool.execute(
//       `SELECT article AS model, size AS size
//              FROM products
//              WHERE company_name = ?`,
//       [normalizedBrand]
//     );
//     console.log('[INFO] Models from products:', modelsRows);

//     // Проверка на пустые данные
//     if (!modelsRows || modelsRows.length === 0) {
//       console.warn(`[WARNING] No data found in products for brand: ${brand}`);
//       return res.status(404).json({ error: `No data found for brand: ${brand}` });
//     }

//     // Логика для разных брендов
//     const available = [];
//     const shortage = [];

//     if (brand === 'Armbest' || brand === 'Bestshoes') {
//       // Для Armbest и Bestshoes берем только уникальные размеры
//       console.log(brand);
//       const uniqueSizes = [...new Set(modelsRows.map(row => row.size))];
//       uniqueSizes.forEach(size => {
//         const key = `Multimodel_${size}`;
//         const quantity = reportMap.get(key) || 0;
//         const targetArray = quantity > 10 ? available : shortage;
//         targetArray.push({ model: 'Multimodel', size: size, Quantity: quantity });
//       });
//     } else if (normalizedBrand === 'best26') {
//       // Для Best26 проверяем каждую модель и размер
//       modelsRows.forEach(modelRow => {
//         const key = `${modelRow.model}_${modelRow.size}`;
//         const quantity = reportMap.get(key) || 0;
//         if (quantity > 0) {
//           available.push({ model: modelRow.model, size: modelRow.size, Quantity: quantity });
//         } else {
//           shortage.push({ model: modelRow.model, size: modelRow.size, Quantity: 0 });
//         }
//       });
//     }

//     // Логирование результатов
//     console.log('[INFO] Available:', available);
//     console.log('[INFO] Shortage:', shortage);

//     // Создаем Excel-отчет
//     const workbook = createExcelReport(available, shortage);

//     // Отправляем файл пользователю
//     res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//     res.setHeader('Content-Disposition', `attachment; filename=${brand}_report.xlsx`);
//     await workbook.xlsx.write(res);
//     res.end();
//   } catch (error) {
//     console.error('[ERROR] Ошибка сервера:', error.message);
//     res.status(500).json({ error: error.message });
//   }
// });

// Функция для создания Excel-отчета
function createExcelReport(available, shortage) {
  const workbook = new ExcelJS.Workbook();

  const createSheet = (sheetName, data) => {
    const sheet = workbook.addWorksheet(sheetName);
    sheet.columns = [
      { header: 'Модель', key: 'model', width: 20 },
      { header: 'Размер', key: 'size', width: 20 },
      { header: 'Количество ЧЗ', key: 'Quantity', width: 20 },
    ];
    data.forEach(row => {
      const newRow = sheet.addRow(row);
      styleRow(newRow, row.Quantity);
    });
  };

  const styleRow = (row, quantity) => {
    let fillColor = 'FFFFFF';
    if (quantity < 5) fillColor = 'EE2028'; // Красный
    else if (quantity >= 5 && quantity <= 8) fillColor = 'F7941F'; // Оранжевый
    else if (quantity > 8) fillColor = '20B04B'; // Зеленый

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

// Добавление CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Запуск сервера
server.listen(port, () => {
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