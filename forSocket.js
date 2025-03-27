const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const { processPDF } = require("./pdfProcessor");
const { startQRdecoder } = require("./node-zxing-master/example/test");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Глобальный объект для управления загрузками
const activeUploads = new Map(); // Хранит AbortController для каждой загрузки

// Конфигурация multer для обработки загрузки файлов
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Подключение к базе данных SQLite
const db = new sqlite3.Database("./database/honestsigndb.db", (err) => {
  if (err) {
    console.error("Could not connect to database", err);
  } else {
    console.log("Connected to database.");
  }
});

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
      db.run("BEGIN TRANSACTION;", (err) => {
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
      db.run("COMMIT;", (err) => {
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
        db.run("ROLLBACK;", (err) => {
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