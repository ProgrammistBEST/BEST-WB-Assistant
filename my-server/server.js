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

  // Валидация входных данных
  if (!size || !brand || !model) {
    return res.status(400).json({ error: 'Параметры size, brand и model обязательны.' });
  }

  try {
    // Получаем имя таблицы
    const tableName = await getCategoryByModel(model, brand, size);

    // Проверка имени таблицы
    if (!tableName || typeof tableName !== 'string') {
      return res.status(500).json({ error: 'Некорректное имя таблицы.' });
    }

    const sql = `
        SELECT Crypto, Model, Size 
        FROM ${tableName}
        WHERE Size = ? AND Brand = ? AND Model = ? AND Status IN ('Comeback', 'Waiting')
    `;

    const [rows] = await pool.execute(sql, [size, brand, model]);

    res.json({ data: rows });
  } catch (err) {
    console.error('Ошибка выполнения запроса:', err.message);
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
          WHERE Crypto = ? AND Brand = ? AND Size = ?
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
app.post('/getCryptoToFinishDocument', async (req, res) => {
  const { kyz, size, brand, model } = req.body;

  // ЛОГ: Входные данные
  console.log('Получены входные данные:');
  console.table([{ kyz, size, brand, model }]);

  // Валидация входных данных
  if (!kyz || !size || !brand || !model) {
    console.error('Ошибка валидации: Некорректные входные данные.');
    return res.status(400).json({ error: 'Некорректные входные данные' });
  }

  try {
    // Получение имени таблицы
    console.log('Выполняется запрос имени таблицы...');
    const tableName = await getCategoryByModel(model, brand, size);

    // ЛОГ: Имя таблицы
    // console.log(`Имя таблицы: ${tableName}`);

    // Проверка имени таблицы
    if (!tableName || typeof tableName !== 'string') {
      console.error('Ошибка: Некорректное имя таблицы.');
      return res.status(500).json({ error: 'Некорректное имя таблицы' });
    }

    // Формирование SQL-запроса
    const sql = `
      SELECT PDF 
      FROM ${tableName} 
      WHERE Crypto = ? AND Size = ? AND Brand = ?
    `;

    // ЛОГ: Выполнение SQL-запроса
    console.log('Выполняется SQL-запрос...');
    console.log('SQL:', sql);
    console.log('Параметры:', [tableName, kyz, size, brand]);

    const [rows] = await pool.execute(sql, [kyz, size, brand]);

    // ЛОГ: Результаты SQL-запроса
    console.log('Результаты SQL-запроса:', rows);

    // Проверка, что данные найдены
    if (rows.length === 0) {
      console.error('Ошибка: Данные не найдены.');
      return res.status(404).json({ error: 'Данные не найдены' });
    }

    // Отправка PDF-файла
    const result = rows[0];
    console.log('Отправка PDF-файла...');
    res.setHeader('Content-Type', 'application/pdf');
    res.send(result.PDF);
  } catch (err) {
    // ЛОГ: Ошибка выполнения запроса
    console.error('Ошибка запроса:', err.message);
    console.error('Код ошибки:', err.code);
    console.error('Стек вызовов:', err.stack);
    res.status(500).json({ error: 'Ошибка запроса' });
  }
});

// Обновление статуса киза
app.put('/kyzUpdateStatus', async (req, res) => {
  const { model, brand, crypto, dateNow, size } = req.body;

  // Валидация входных данных
  if (!crypto || !dateNow || !model || !brand || !size) {
    return res.status(400).json({ error: 'Некорректные входные данные' });
  }

  try {
    // Получение имени таблицы
    const tableName = await getCategoryByModel(model, brand, size);

    // Проверяем, что честный знак находится в состоянии Reserved
    const checkQuery = `
      SELECT Status 
      FROM ${tableName} 
      WHERE Crypto = ? AND Size = ? AND Brand = ? AND Model = ?
    `;
    const [rows] = await pool.execute(checkQuery, [crypto, size, brand, model]);

    if (rows.length === 0 || rows[0].Status !== 'Reserved') {
      return res.status(400).json({ error: 'Честный знак не зарезервирован или недоступен' });
    }

    // Обновляем статус до Used
    const updateQuery = `
      UPDATE ${tableName} 
      SET Status = 'Used', Date = ?, Locked = 1, \`user\` = 'Marketplace' 
      WHERE Crypto = ? AND Status = 'Reserved'
    `;
    const [result] = await pool.execute(updateQuery, [dateNow, crypto]);

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
app.get('/getWbSizeBestShoes', async (req, res) => {
  const skus = req.query.skus;

  // Проверяем, что SKU передан в запросе
  if (!skus) {
    return res.status(400).send('SKU не указан');
  }

  try {
    // Выполняем запрос к базе данных
    const [rows] = await pool.execute(
      'SELECT size FROM products WHERE company_name = ? AND sku = ?',
      ['BestShoes', skus]
    );

    // Если размер найден, формируем ответ
    if (rows.length > 0 && rows[0].size !== null) {
      const techSize = String(rows[0].size); // Преобразуем размер в строку
      return res.json({ tech_size: techSize }); // Отправляем данные в формате { tech_size: 'значение' }
    }

    // Если размер не найден
    res.status(404).send('Размер не найден');
  } catch (error) {
    console.error(`Ошибка при выполнении запроса для BestShoes SKU ${skus}:`, error.message);
    res.status(500).send('Ошибка сервера');
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