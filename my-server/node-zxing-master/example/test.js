// Замените require на динамический import
async function loadPLimit() {
  const pLimit = await import('p-limit');
  return pLimit.default; // Используйте .default для доступа к экспорту по умолчанию
}

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const pdfPoppler = require('pdf-poppler');
const qrdecoder = require('..')();
const { PDFDocument, rgb } = require('pdf-lib');
const sharp = require('sharp');

const SQL_SELECT_LINES_BY_BRAND = `
  SELECT line, data, brand, fullline 
  FROM lines 
  WHERE brand = ? AND (fullline IS NULL OR LENGTH(fullline) < 5 OR line = '')
`;
const SQL_UPDATE_FULLLINE = `UPDATE lines SET fullline = ? WHERE line = ?`;

let db = new sqlite3.Database('./database/honestsigndb.db', (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Успешное подключение honestsigndb для декодирования');
  }
});

// Функция для получения параметров обрезки в зависимости от бренда
function getCropOptions(brandData) {
  const cropOptionsMap = {
    Bestshoes: { cropBox: { x: 85, y: 35, width: 80, height: 80 }, cropArea: { left: 400, top: 50, width: 600, height: 480 } },
    Armbest: { cropBox: { x: 50, y: 0, width: 80, height: 80 }, cropArea: { left: 50, top: 0, width: 500, height: 450 } },
    Best26: { cropBox: { x: 50, y: 0, width: 80, height: 80 }, cropArea: { left: 50, top: 0, width: 500, height: 450 } },
  };

  return cropOptionsMap[brandData] || {};
}

// Функция для поиска строк без полного QR-кода
async function findLinesWithoutFullQR(brandData) {
  return new Promise((resolve, reject) => {
    db.all(SQL_SELECT_LINES_BY_BRAND, [brandData], (err, rows) => {
      if (err) {
        console.error(err.message);
        return reject(err);
      }
      resolve(rows);
    });
  });
}

// Функция для обрезки страниц PDF
async function cropPDFPages(pdfBytes, brandData) {
  const pdfDoc = await PDFDocument.load(pdfBytes);

  const pages = pdfDoc.getPages();
  pages.forEach((page) => {
    if (brandData === 'Bestshoes') {
      drawWhiteRectangles(page, { x: 0, y: 0, width: 80, height: 150 }, { x: 0, y: 0, width: 160, height: 36 });
    } else {
      drawWhiteRectangles(page, { x: 85, y: 0, width: 80, height: 150 }, { x: 0, y: 0, width: 160, height: 36 });
    }
  });

  return pdfDoc.save();
}

// Функция для рисования белых прямоугольников на странице
function drawWhiteRectangles(page, rect1, rect2) {
  page.drawRectangle({ ...rect1, color: rgb(1, 1, 1), borderWidth: 0 });
  page.drawRectangle({ ...rect2, color: rgb(1, 1, 1), borderWidth: 0 });
}

// Функция для конвертации PDF в PNG
async function convertPDFToPNG(pdfBytes) {
  const tempPdfPath = path.join(__dirname, 'mamka', `temp_${Date.now()}.pdf`);
  const options = {
    format: "png",
    out_dir: path.join(__dirname, 'papka'),
    out_prefix: `temp_${Date.now()}`,
    page: 1,
  };

  try {
    // Записываем PDF в файл
    await fs.promises.writeFile(tempPdfPath, pdfBytes);

    // Конвертируем PDF в PNG
    await pdfPoppler.convert(tempPdfPath, options);

    // Получаем путь к PNG файлу
    const pngFilePath = path.join(options.out_dir, `${options.out_prefix}-1.png`);

    return pngFilePath;
  } catch (error) {
    console.error('Ошибка конвертации PDF в PNG:', error);
    throw error;
  } finally {
    // Удаляем временный PDF файл, если он существует
    if (fs.existsSync(tempPdfPath)) {
      try {
        await fs.promises.unlink(tempPdfPath); // Используем асинхронное удаление
      } catch (unlinkError) {
        console.warn(`Не удалось удалить временный PDF файл: ${tempPdfPath}`, unlinkError);
      }
    }
  }
}

// Функция для обрезки изображения
async function cropImage(inputPath, cropOptions) {
  const outputPath = inputPath.replace('.png', '_cropped.png');

  try {
    await sharp(inputPath)
      .extract(cropOptions)
      .toFile(outputPath);
    return outputPath;
  } catch (error) {
    console.error('Ошибка при обрезке изображения:', error);
    throw error;
  }
}

// Функция для расшифровки QR-кода
async function decodeQRCode(filePath) {
  return new Promise((resolve, reject) => {
    qrdecoder.decode(filePath, (err, result) => {
      if (err) {
        resolve(null);
      } else {
        resolve(result.replace(/\x1D/g, ''));
      }
    });
  });
}

// Функция для обновления базы данных
async function updateDatabaseWithQRCode(qrCode, line) {
  return new Promise((resolve, reject) => {
    db.run(SQL_UPDATE_FULLLINE, [qrCode, line], (err) => {
      if (err) {
        console.error(err.message);
        return reject(err);
      }
      resolve();
    });
  });
}

// Функция для очистки временных файлов
function cleanupFiles(filePaths) {
  filePaths.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
}

// Основная функция для обработки строки данных
async function processLine(row, brandData) {
  const { line, data } = row;

  try {
    // Обрезка PDF
    const croppedPdfBytes = await cropPDFPages(data, brandData);

    // Конвертация PDF в PNG
    const pngFilePath = await convertPDFToPNG(croppedPdfBytes);

    // Обрезка изображения
    const cropOptions = getCropOptions(brandData).cropArea;
    const croppedImagePath = await cropImage(pngFilePath, cropOptions);

    // Расшифровка QR-кода
    const decodedQR = await decodeQRCode(croppedImagePath);

    if (decodedQR && decodedQR.length >= 10) {
      await updateDatabaseWithQRCode(decodedQR, line);
    }

    // Очистка временных файлов
    cleanupFiles([pngFilePath, croppedImagePath]);
  } catch (error) {
    console.error(`Ошибка при обработке строки ${line}:`, error);
  }
}

// В функции startQRdecoder используйте динамический импорт
async function startQRdecoder(brandData, io) {
  const pLimit = await loadPLimit();
  const limit = pLimit(5); // Ограничение до 5 параллельных задач

  const linesWithoutFullQR = await findLinesWithoutFullQR(brandData);
  const totalLines = linesWithoutFullQR.length;
  let processedLines = 0;

  io.emit('upload_status', { progress: 0, message: 'Начинаем обработку...' });

  await Promise.all(linesWithoutFullQR.map((row, index) => 
    limit(async () => {
      await processLine(row, brandData);
      processedLines++;
      const progress = Math.round((processedLines / totalLines) * 100);
      io.emit('upload_status', { progress, message: `Обработано ${processedLines} из ${totalLines}` });
    })
  ));

  io.emit('upload_status', { progress: 100, message: 'Обработка завершена!' });
}

module.exports = { startQRdecoder };