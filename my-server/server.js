const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const app = express();
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");
const { processPDF } = require('./pdfProcessor');
const mysql = require("mysql2/promise");
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 60 }); // Кэш с временем жизни 60 секунд
const { startQRdecoder } = require("./node-zxing-master/example/test");

// Для работы с сокетами
const http = require("http");
const socketIo = require("socket.io");
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const dbApi = mysql.createPool({
  host: "192.168.100.170",
  user: "root",
  password: "root",
  database: "bestserver",
  waitForConnections: true,
  connectionLimit: 10,
});
// Настройки подключения к базе данных
const dbConfig = {
  host: "192.168.100.170",
  user: "root",
  password: "root",
  database: "test",
  waitForConnections: true,
  connectionLimit: 10,
};

// Создаем пул соединений с базой данных
const pool = mysql.createPool(dbConfig);

// Глобальный объект для управления загрузками
const activeUploads = new Map(); // Хранит AbortController для каждой загрузки

// Конфигурация multer для обработки загрузки файлов
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Обработка событий WebSocket
io.on("connection", (socket) => {
  console.log("A user connected");

  // Обработка команды отмены
  socket.on("cancel_upload", async ({ uploadId }) => {
    try {
      const abortController = activeUploads.get(uploadId);
      if (!abortController) {
        console.log(`Загрузка с ID ${uploadId} не найдена.`);
        socket.emit("upload_status", { progress: 0, message: "Нет активных загрузок для отмены." });
        return;
      }

      // Отменяем загрузку
      abortController.abort();
      activeUploads.delete(uploadId);

      console.log(`Загрузка с ID ${uploadId} отменена.`);
      socket.emit("upload_status", { progress: 0, message: "Загрузка отменена пользователем." });
    } catch (err) {
      console.error("Ошибка при отмене загрузки:", err);
      socket.emit("upload_status", { progress: 0, message: "Ошибка при отмене загрузки." });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

app.use(cors()); // Разрешает все источники
app.use(bodyParser.json({ limit: "10mb" }));

// Проверка подключения к базе
dbApi
  .getConnection()
  .then((connection) => {
    if (connection) {
      console.log("Успешное подключение к базе данных bestserver");
      connection.release();
    }
  })
  .catch((err) => {
    console.error("Ошибка подключения к базе:", err.message);
  });
app.get("/download", (req, res) => {
  const { fileBrand, generalArticle, article, size } = req.query;
  if (!fileBrand || !generalArticle || !article || !size) {
    return res.status(400).send("Missing required query parameters");
  }

  // Путь
  const filePath = path.join(
    "\\\\WIN-SERVER\\bestfiles\\Упаковка",
    fileBrand,
    generalArticle,
    article,
    `${size}.pdf`,
  );

  res.download(filePath, `${size}.pdf`, (err) => {
    if (err) {
      console.error("Error downloading the file:", err);
    }
  });
});

// Подключение к базе данных
const db = new sqlite3.Database(
  "./database/products.db",
  sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) {
      console.error("Ошибка при открытии базы данных", err.message);
    } else {
      console.log(" Успешное подключение к products");
    }
  },
);

let dbKYZ = new sqlite3.Database("./database/honestsigndb.db", (err) => {
  if (err) {
    console.error("Could not connect to database", err);
  } else {
    console.log(" Успешное подключение к honestsigndb");
  }
});

const saveDataAboutDelivery = new sqlite3.Database(
  "./database/SaveDataAboutDelivery.db",
  sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) {
      console.error("Ошибка при открытии базы данных", err.message);
    } else {
      console.log(" Успешное подключение к SaveDataAboutDelivery");
    }
  },
);

// Middleware для обработки JSON
app.use(bodyParser.json());

const networkFolderPath = "Z:\\Упаковка\\ARMBEST";

// Добавление CORS, если необходимо
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );
  next();
});

// Функция для рекурсивного получения списка файлов и директорий
function getFilesRecursively(directory) {
  let results = [];
  const list = fs.readdirSync(directory);
  list.forEach((file) => {
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

app.get("/getApiById", async (req, res) => {
  const { id, company_name, category } = req.query; // Извлечение параметров запроса

  try {
    const today = new Date(); // Текущая дата

    // Запрос для получения токена и даты истечения подписки
    const [rows] = await dbApi.query(
      `SELECT token, expiration_date FROM api_data 
             WHERE id = ? AND company_name = ? AND category = ?`,
      [id, company_name, category],
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
          res.status(404).json({ error: "Подписка истекла" });
        }
      }
    } else {
      res.status(404).json({ error: "Информация не найдена" });
    }
  } catch (err) {
    console.error("Ошибка выполнения запроса:", err.message);
    res.status(500).json({ error: "Ошибка выполнения запроса" });
  }
});
// Эндпоинт для получения списка файлов
app.get("/files", (req, res) => {
  try {
    const files = getFilesRecursively(networkFolderPath);
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Эндпоинт для получения содержимого файла
app.get("/file", (req, res) => {
  const fileName = req.query.name;
  if (!fileName) {
    return res.status(400).json({ error: "File name is required" });
  }
  const filePath = path.join(networkFolderPath, fileName);
  fs.stat(filePath, (err, stat) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (stat.isDirectory()) {
      return res.status(400).json({ error: "Requested path is a directory" });
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
app.get("/kyzSizes", (req, res) => {
  const brand = req.query.brand;
  if (brand != "Best26") {
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
        res.status(500).json({ error: "Internal Server Error" }); // Отправка ошибки клиенту
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
        res.status(500).json({ error: "Internal Server Error" }); // Отправка ошибки клиенту
        return;
      }
      res.json(rows);
    });
  }
});

app.get("/kyz", (req, res) => {
  const { Size: size, brand, Model: model } = req.query;

  if (!size || !brand || !model) {
    return res
      .status(400)
      .json({ error: "Size, brand, and model parameters are required" });
  }

  // Создаем уникальный ключ для кэша
  const cacheKey = `kyz:${size}:${brand}:${model}`;

  // Проверяем, есть ли данные в кэше
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.json({ data: cachedData });
  }

  const query = `
        SELECT line, Model, Size, fullline 
        FROM lines 
        WHERE Size = ? AND brand = ? AND Model = ? AND Status IN ("Comeback", "Waiting")
    `;

  dbKYZ.all(query, [size, brand, model], (err, rows) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ error: "Database query failed" });
    }

    // Сохраняем данные в кэш
    cache.set(cacheKey, rows);
    res.json({ data: rows });
  });
});

app.post("/kyzComeback", (req, res) => {
  const line = req.body.line;
  const size = req.body.size;
  const brand = req.body.brand;

  const query = `UPDATE lines SET Status = 'Comeback' WHERE line = ?  AND brand = ? AND Size= ?`;
  console.log(req.body);
  dbKYZ.run(query, [line, brand, size], function (err) {
    if (err) {
      console.error("Ошибка при выполнении запроса", err);
      res.status(500).json({ error: "Ошибка при выполнении запроса" });
    } else {
      res.json({ message: "Статус успешно обновлен" });
    }
  });
});

// Получение ЧЗ для финального скачивания документов
app.post("/getlineToFinishDocument", (req, res) => {
  const { kyz, size, brand } = req.body;
  // Валидация входных данных
  if (!kyz || !size || !brand) {
    return res.status(400).json({ error: "Некорректные входные данные" });
  }
  const sql =
    "SELECT data FROM lines WHERE line = ? AND size = ? AND brand = ?";
  dbKYZ.get(sql, [kyz, size, brand], (error, result) => {
    if (error) {
      console.error("Ошибка запроса:", error);
      res.status(500).json({ error: "Ошибка запроса" });
      return;
    }

    if (!result) {
      return res.status(404).json({ error: "Данные не найдены" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.send(result.data);
  });
});

// Сохранение информации о поставке в базе данных SaveDataAboutDelivery
app.post("/SaveDataKyzToDB", (req, res) => {
  const { date, delivery, quantity } = req.body;
  if (typeof delivery !== "string") {
    return res.status(400).json({ error: "Delivery must be a string" });
  }
  const stmt = saveDataAboutDelivery.prepare(
    "INSERT INTO DeliveryData (date, delivery, quantity) VALUES (?, ?, ?)",
  );
  stmt.run(date, delivery, quantity, function (err) {
    if (err) {
      console.error("Ошибка при выполнении запроса", err);
      res.status(500).json({ error: "Ошибка при выполнении запроса" });
    } else {
      res.status(200).json({
        message: "Data added successfully",
        id: this.lastID,
      });
    }
  });
  stmt.finalize();
});

// Обновление статуса киза
app.put("/kyzUpdatestatus", (req, res) => {
  const { line, dateNow } = req.body;
  const stmt = dbKYZ.prepare(
    "UPDATE lines SET Status = 'Used', created_at = ? WHERE line = ?",
  );
  stmt.run(dateNow, line, function (err) {
    if (err) {
      console.error("Error during update:", err);
      res.status(500).json({ message: "Database error", error: err });
    } else {
      res.json({
        message: "Status updated successfully",
        changes: this.changes,
      });
    }
  });
  stmt.finalize();
});

// Загрузка нового КИЗа
app.post("/uploadNewKyz", upload.single("pdf"), async (req, res) => {
  let transactionStarted = false;

  try {
    if (!req.file) {
      return res.status(400).send({ message: "No file uploaded." });
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

    // Декодирование QR-кодов
    await startQRdecoder(brandData, abortController.signal, io);

    // Подтверждение транзакции
    await new Promise((resolve, reject) => {
      dbKYZ.run("COMMIT;", (err) => {
        if (err) {
          console.error("Commit failed:", err);
          return reject(err);
        }
        resolve();
      });
    });

    activeUploads.delete(uploadId); // Удаляем загрузку из активных
    res.status(200).send({ message: "File processed successfully." });
  } catch (err) {
    console.error("Error processing file:", err);

    // Откат транзакции в случае ошибки
    if (transactionStarted) {
      await new Promise((resolve, reject) => {
        dbKYZ.run("ROLLBACK;", (err) => {
          if (err) {
            console.error("Rollback failed:", err);
            reject(err);
          } else {
            console.log("Rollback completed successfully.");
            resolve();
          }
        });
      });
    }

    res.status(500).send({ message: "Error processing file." });
  }
});

// Получение списка успешных доставок
app.get("/getdeliveryinfo/:id", (req, res) => {
  const deliveryId = req.params.id;
  saveDataAboutDelivery.get(
    "SELECT * FROM DeliveryData WHERE id = ?",
    [deliveryId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: "Delivery not found" });
      }
      res.status(200).json(row);
    },
  );
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
    dbKYZ.run(insertStmt, function (err) {
      if (err) {
        console.error("Error during transferring old records:", err);
        dbKYZ.run("ROLLBACK"); // Откат транзакции в случае ошибки
        return;
      }
      // Подготовка SQL-запроса для удаления данных из таблицы lines
      const deleteStmt = `
                DELETE FROM lines 
                WHERE Status = 'Used' AND created_at <= datetime('now', '-3 day')
            `;

      dbKYZ.run(deleteStmt, function (err) {
        if (err) {
          console.error("Error during deleting old records:", err);
          dbKYZ.run("ROLLBACK"); // Откат транзакции в случае ошибки
        } else {
          dbKYZ.run("COMMIT"); // Фиксация транзакции в случае успеха
        }
      });
    });
  });
};
transferAndDeleteOldRecords();

// Обслуживание статических файлов!
app.use(express.static(path.join(__dirname, "public")));

// Маршрут для обновления базы данных
app.post("/update-element", (req, res) => {
  const { vendorcode, wbsize, pair } = req.body;

  if (
    typeof vendorcode === "undefined" ||
    typeof wbsize === "undefined" ||
    typeof pair === "undefined"
  ) {
    return res
      .status(400)
      .json({ success: false, error: "Missing required fields" });
  }

  const query = `UPDATE product_sizes SET pair = ? WHERE vendor_code = ? AND wb_size = ?`;
  db.run(query, [pair, vendorcode, wbsize], function (err) {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({
      success: true,
      message: "Data updated successfully",
      changes: this.changes,
    });
  });
});

// Маршрут для удаления элемента
app.post("/delete-element", (req, res) => {
  const { vendorcode, wbsize, pair } = req.body;
  // SQL-запрос на удаление элемента из базы данных
  const query = `DELETE FROM product_sizes WHERE vendor_code = ? AND wb_size = ? AND pair = ?`;
  db.run(query, [vendorcode, wbsize, pair], function (err) {
    if (err) {
      console.error("Database delete error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    if (this.changes === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Element not found" });
    }
    res.json({ success: true, message: "Element deleted successfully" });
  });
});

// Маршрут для добавления нового элемента
app.post("/add-element", (req, res) => {
  const { vendorcode, wbsize, pair } = req.body;
  // SQL-запрос на добавление нового элемента в базу данных
  const query = `INSERT INTO product_sizes (vendor_code, wb_size, pair) VALUES (?, ?, ?)`;
  db.run(query, [vendorcode, wbsize, pair], function (err) {
    if (err) {
      console.error("Database insert error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, message: "Element added successfully" });
  });
});

// Обработчик GET запроса на получение данных о моделях из разных таблиц
app.get("/getModelArmbest", (req, res) => {
  const sql = "SELECT * FROM product_sizesArmbest"; // Выборка всех записей из таблицы
  // Выполнение SQL запроса к базе данных
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Ошибка выполнения SQL запроса", err.message);
      res.status(500).send("Ошибка выполнения запроса к базе данных");
    } else {
      res.json(rows); // Отправляем данные в формате JSON клиенту
    }
  });
});
app.get("/getModelBest26", (req, res) => {
  const sql = "SELECT * FROM product_sizesBest26"; // Выборка всех записей из таблицы
  // Выполнение SQL запроса к базе данных
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Ошибка выполнения SQL запроса", err.message);
      res.status(500).send("Ошибка выполнения запроса к базе данных");
    } else {
      res.json(rows); // Отправляем данные в формате JSON клиенту
    }
  });
});
app.get("/getModelBestshoes", (req, res) => {
  const sql = "SELECT * FROM product_sizesBestshoes"; // Выборка всех записей из таблицы
  // Выполнение SQL запроса к базе данных
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Ошибка выполнения SQL запроса", err.message);
      res.status(500).send("Ошибка выполнения запроса к базе данных");
    } else {
      res.json(rows); // Отправляем данные в формате JSON клиенту
    }
  });
});

// Получить размер
app.get("/getWbSizeArmbest", async (req, res) => {
  const skus = req.query.skus;

  // Проверяем, что SKU передан в запросе
  if (!skus) {
    return res.status(400).send("SKU не указан");
  }

  try {
    // Выполняем запрос к базе данных
    const [rows] = await pool.execute(
      "SELECT size FROM products WHERE company_name = ? AND sku = ?",
      ["Armbest", skus],
    );

    // Если размер найден, формируем ответ в нужном формате
    if (rows.length > 0) {
      const size = rows[0].size;
      const techSize = String(size); // Преобразуем размер в строку
      res.json({ tech_size: techSize }); // Отправляем данные в формате { tech_size: 'значение' }
    } else {
      res.status(404).send("Размер не найден");
    }
  } catch (error) {
    console.error("Ошибка при выполнении запроса:", error);
    res.status(500).send("Ошибка сервера");
  }
});
// Получить размер для Best26
app.get("/getWbSizeBest26", async (req, res) => {
  const skus = req.query.skus;

  // Проверяем, что SKU передан в запросе
  if (!skus) {
    return res.status(400).send("SKU не указан");
  }

  try {
    // Выполняем запрос к базе данных
    const [rows] = await pool.execute(
      "SELECT size FROM products WHERE company_name = ? AND sku = ?",
      ["Best26", skus],
    );

    // Если размер найден, формируем ответ
    if (rows.length > 0 && rows[0].size !== null) {
      const techSize = String(rows[0].size); // Преобразуем размер в строку
      return res.json({ tech_size: techSize }); // Отправляем данные в формате { tech_size: 'значение' }
    }

    // Если размер не найден
    res.status(404).send("Размер не найден");
  } catch (error) {
    console.error(
      `Ошибка при выполнении запроса для Best26 SKU ${skus}:`,
      error.message,
    );
    res.status(500).send("Ошибка сервера");
  }
});

// Получить размер для Bestshoes
app.get("/getWbSizeBestshoes", async (req, res) => {
  const skus = req.query.skus;

  // Проверяем, что SKU передан в запросе
  if (!skus) {
    return res.status(400).send("SKU не указан");
  }

  try {
    // Выполняем запрос к базе данных
    const [rows] = await pool.execute(
      "SELECT size FROM products WHERE company_name = ? AND sku = ?",
      ["Bestshoes", skus],
    );

    // Если размер найден, формируем ответ
    if (rows.length > 0 && rows[0].size !== null) {
      const techSize = String(rows[0].size); // Преобразуем размер в строку
      return res.json({ tech_size: techSize }); // Отправляем данные в формате { tech_size: 'значение' }
    }

    // Если размер не найден
    res.status(404).send("Размер не найден");
  } catch (error) {
    console.error(
      `Ошибка при выполнении запроса для Bestshoes SKU ${skus}:`,
      error.message,
    );
    res.status(500).send("Ошибка сервера");
  }
});

// // Функция для вывода информации о памяти
// function printMemoryUsage() {
//     const freeMemory = os.freemem();
//     console.log(`Свободная память: ${(freeMemory / 1024 / 1024).toFixed(2)} MB`);
// }

// setInterval(printMemoryUsage, 5000); // Вывод информации каждые 5 секунд

// Эндпоинт для формирования отчета
const ExcelJS = require("exceljs");

// Функция для выполнения запроса к SQLite
function querySQLite(db, query, params) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

app.get("/report_hs", async (req, res) => {
  try {
    const brand = req.query.brand;
    if (!brand) {
      return res.status(400).json({ error: "Параметр brand обязателен" });
    }

    // Нормализация имени бренда (нижний регистр)
    const normalizedBrand = brand.trim().toLowerCase();

    // Запрос для получения данных из таблицы lines (SQLite)
    const reportQuery = `
            SELECT Model, Size, 
                   COUNT(CASE WHEN Status = 'Waiting' THEN 1 ELSE NULL END) AS Quantity_Waiting,
                   COUNT(CASE WHEN Status = 'Comeback' THEN 1 ELSE NULL END) AS Quantity_Comeback
            FROM \`lines\`
            WHERE LOWER(brand) = ?
            GROUP BY Model, Size
        `;
    const reportRows = await querySQLite(dbKYZ, reportQuery, [normalizedBrand]);

    // Создаем карту для быстрого доступа к данным из таблицы lines
    const reportMap = new Map(
      reportRows.map((row) => [
        `${row.Model}_${row.Size}`,
        row.Quantity_Waiting + row.Quantity_Comeback,
      ]),
    );

    // Запрос к таблице products (MySQL)
    const [modelsRows] = await pool.execute(
      `SELECT article AS Model, size AS Size
             FROM products
             WHERE company_name = ?`,
      [normalizedBrand],
    );

    // Проверка на пустые данные
    if (!modelsRows || modelsRows.length === 0) {
      console.warn(`[WARNING] No data found in products for brand: ${brand}`);
      return res
        .status(404)
        .json({ error: `No data found for brand: ${brand}` });
    }

    // Логика для разных брендов
    const available = [];
    const shortage = [];

    if (brand === "Armbest" || brand === "Bestshoes") {
      // Для Armbest и Bestshoes берем только уникальные размеры
      const uniqueSizes = [...new Set(modelsRows.map((row) => row.Size))];
      uniqueSizes.forEach((size) => {
        const key = `Multimodel_${size}`;
        const quantity = reportMap.get(key) || 0;
        const targetArray = quantity >= 10 ? available : shortage;
        targetArray.push({
          Model: "Multimodel",
          Size: size,
          Quantity: quantity,
        });
      });
    } else if (normalizedBrand === "best26") {
      // Для Best26 проверяем каждую модель и размер
      const productKeys = new Set(
        modelsRows.map((row) => `${row.Model}_${row.Size}`),
      );

      productKeys.forEach((key) => {
        const [model, size] = key.split("_");
        const quantity = reportMap.get(key) || 0;

        if (quantity > 0) {
          if (quantity >= 10) {
            available.push({
              Model: model,
              Size: size,
              Quantity: quantity,
            });
          } else {
            shortage.push({
              Model: model,
              Size: size,
              Quantity: quantity,
            });
          }
        } else {
          shortage.push({ Model: model, Size: size, Quantity: 0 });
        }
      });
    }

    // Логирование результатов
    console.log("[INFO] Available:", available);
    console.log("[INFO] Shortage:", shortage);

    // Создаем Excel-отчет
    const workbook = createExcelReport(available, shortage);

    // Отправляем файл пользователю
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${brand}_report.xlsx`,
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("[ERROR] Ошибка сервера:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Функция для создания Excel-отчета
function createExcelReport(available, shortage) {
  const workbook = new ExcelJS.Workbook();

  const createSheet = (sheetName, data) => {
    const sheet = workbook.addWorksheet(sheetName);
    sheet.columns = [
      { header: "Модель", key: "Model", width: 20 },
      { header: "Размер", key: "Size", width: 20 },
      { header: "Количество ЧЗ", key: "Quantity", width: 20 },
    ];
    data.forEach((row) => {
      const newRow = sheet.addRow(row);
      styleRow(newRow, row.Quantity);
    });
  };

  const styleRow = (row, quantity) => {
    let fillColor = "FFFFFF";
    if (quantity < 5)
      fillColor = "EE2028"; // Красный
    else if (quantity >= 5 && quantity <= 8)
      fillColor = "F7941F"; // Оранжевый
    else if (quantity > 8) fillColor = "20B04B"; // Зеленый

    row.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: fillColor },
      };
      cell.font = { bold: quantity <= 10 };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  };

  createSheet("Есть в наличии", available);
  createSheet("Нехватка", shortage);

  return workbook;
}

// Запуск сервера
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Закрытие подключения к базе данных при завершении работы сервера
process.on("SIGINT", () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log("Closed the database connection.");
    process.exit(0);
  });
});