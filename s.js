const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const cors = require("cors");
const port = 3000;
const portSocket = 3002;
const multer = require("multer");
const { processPDF } = require("./my-server/pdfProcessor");

// Для работы с сокетами
const http = require("http");
const socketIo = require("socket.io");
const server = http.createServer();

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("A user connected");
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

app.use(cors()); // Разрешает все источники

// Конфигурация multer для обработки загрузки файлов
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Загрузка нового киза
app.post("/uploadNewKyz", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: "No file uploaded." });
    }

    const fileName = req.file.originalname;
    const fileBuffer = req.file.buffer;
    const brandData = JSON.parse(req.body.brandData);

    // Обработка PDF
    await processPDF(fileBuffer, fileName, brandData, io);

    res.status(200).send({ message: "File processed successfully." });
  } catch (err) {
    console.error("Error processing file:", err);
    res.status(500).send({ message: "Error processing file." });
  }
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
  // Запуск сервера сокетов
  server.listen(portSocket, () => {
    console.log(`WebSocket is running on port https://localhost:${portSocket}`);
  });