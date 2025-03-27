const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const pdfjsLibPromise = import('pdfjs-dist/legacy/build/pdf.mjs');
const pdfLib = require('pdf-lib');
const { PDFDocument } = pdfLib;
const { startQRdecoder } = require('./node-zxing-master/example/test.js');

// Глобальный AbortController для управления отменой
let abortController = null;

// Функция для открытия базы данных
async function openDatabase(signal) {
  if (signal && signal.aborted) {
    throw new DOMException('Операция отменена.', 'AbortError');
  }
  return open({
    filename: 'database/honestsigndb.db',
    driver: sqlite3.Database,
  });
}

// Извлечение текста из PDF с параллельной обработкой страниц
async function extractTextFromPDF(fileBuffer, signal) {
  const pdfjsLib = await pdfjsLibPromise;
  const { getDocument } = pdfjsLib;

  // Проверяем, не была ли задача отменена
  if (signal && signal.aborted) {
    throw new DOMException('Операция отменена.', 'AbortError');
  }

  const loadingTask = getDocument({ data: new Uint8Array(fileBuffer) });
  const pdf = await loadingTask.promise;

  // Параллельная обработка всех страниц
  const pagePromises = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    if (signal && signal.aborted) {
      throw new DOMException('Операция отменена.', 'AbortError');
    }
    pagePromises.push(
      pdf.getPage(pageNumber).then(page => page.getTextContent())
    );
  }

  const textContents = await Promise.all(pagePromises);
  const extractedTexts = textContents.map(textContent =>
    textContent.items.map(item => item.str).join('\n')
  );

  return { extractedTexts, pdf };
}

// Сохранение всех данных в базу данных с проверкой на дубликатов
async function saveDataToDatabase(db, fileName, pageDataList, brandData, signal) {
  const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const brand = brandData;
  const color = 'Multicolor';

  // Подготовка массива данных для проверки дубликатов
  const linesToCheck = pageDataList.map(({ lines, sizes, model }) => [
    lines,
    sizes,
    brand,
    model || 'Multimodel',
    color,
  ]);

  // Проверка дубликатов с помощью одного SQL-запроса
  const placeholders = linesToCheck.map(() => '(?, ?, ?, ?, ?)').join(',');
  const query = `
    SELECT line, Size, brand, Model, color 
    FROM lines 
    WHERE (line, Size, brand, Model, color) IN (${placeholders})
  `;
  const flatValues = linesToCheck.flat();

  if (signal && signal.aborted) {
    throw new DOMException('Операция отменена.', 'AbortError');
  }

  const duplicates = await db.all(query, flatValues);

  // Создание множества для быстрого поиска дубликатов
  const duplicateSet = new Set(duplicates.map(row => `${row.line}|${row.Size}|${row.brand}|${row.Model}|${row.color}`));

  // Подготовка оператора для вставки новых записей
  const insertStmt = await db.prepare(`
    INSERT INTO lines (brand, data, page, line, Size, created_at, model, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Вставка только уникальных записей
  for (const { pageData, pageNumber, lines, sizes, model } of pageDataList) {
    if (signal && signal.aborted) {
      await insertStmt.finalize();
      throw new DOMException('Операция отменена.', 'AbortError');
    }

    const key = `${lines}|${sizes}|${brand}|${model || 'Multimodel'}|${color}`;
    if (!duplicateSet.has(key)) {
      await insertStmt.run(
        brand,
        pageData,
        pageNumber,
        lines,
        sizes,
        createdAt,
        model || 'Multimodel',
        color
      );
    } else {
      console.log(`Пропущен дубликат: ${lines}`);
    }
  }

  // Завершение подготовленного оператора
  await insertStmt.finalize();
}

// Создание нового PDF-документа с одной страницей
async function createSinglePagePDF(preloadedPdfDoc, pageIndex) {
  const newPdfDoc = await PDFDocument.create();
  const [copiedPage] = await newPdfDoc.copyPages(preloadedPdfDoc, [pageIndex]);
  newPdfDoc.addPage(copiedPage);
  return await newPdfDoc.save();
}

// Проверка, является ли текст числом в пределах от 24 до 48
function isValidSize(text) {
  const value = parseFloat(text);
  const validRanges = ['35-36', '40-41', '41-42', '46-47', '47-48'];
  return !isNaN(value) && value >= 24 && value <= 48 || validRanges.includes(text);
}

// Обработка строк текста для извлечения размеров и модели
function parseTextForSizesAndModel(linesArray, brandData) {
  let lines = linesArray.filter(line => line.startsWith('(01)')).join('\n');
  let sizes = '';
  let model = '';

  if (linesArray.length > 1) {
    const secondLine = linesArray[4] || ''; // Пятая строка
    const thirdLine = linesArray[2] || ''; // Третья строка

    if (isValidSize(secondLine)) {
      sizes = secondLine;
      model = brandData === 'Best26' ? thirdLine : '';
    } else {
      sizes = thirdLine;
      model = brandData === 'Best26' ? secondLine : '';
    }
  }

  return { lines, sizes, model };
}

// Обработка порции страниц PDF
async function processBatchOfPages(extractedTexts, preloadedPdfDoc, startPage, pageSize, brandData, signal) {
  const pageDataList = await Promise.all(
    extractedTexts.slice(startPage, startPage + pageSize).map(async (text, index) => {
      if (signal && signal.aborted) {
        throw new DOMException('Операция отменена.', 'AbortError');
      }

      const linesArray = text.split('\n');
      const { lines, sizes, model } = parseTextForSizesAndModel(linesArray, brandData);

      const pageBytes = await createSinglePagePDF(preloadedPdfDoc, startPage + index);
      return {
        pageData: pageBytes,
        pageNumber: startPage + index + 1,
        lines,
        sizes,
        model,
      };
    })
  );

  return pageDataList;
}

// Глобальная переменная для хранения текущего uploadId
let currentUploadId = null;

// Основная функция обработки PDF
async function processPDF(fileBuffer, fileName, brandData, io) {
  abortController = new AbortController(); // Создаем новый AbortController
  const signal = abortController.signal;

  try {
    const db = await openDatabase(signal);
    const { extractedTexts, pdf } = await extractTextFromPDF(fileBuffer, signal); // Извлекаем текст и PDF

    // Загружаем PDF для дальнейшего использования
    const preloadedPdfDoc = await PDFDocument.load(new Uint8Array(fileBuffer), { ignoreEncryption: true });

    const pageSize = 50; // Количество страниц, обрабатываемых за раз
    let currentPage = 0;

    while (currentPage < extractedTexts.length) {
      if (signal.aborted) {
        throw new DOMException('Операция отменена.', 'AbortError');
      }

      const progress = Math.round(((currentPage + pageSize) / extractedTexts.length) * 100);

      const pageDataList = await processBatchOfPages(
        extractedTexts,
        preloadedPdfDoc, // Передаем загруженный PDF
        currentPage,
        pageSize,
        brandData,
        signal
      );

      await saveDataToDatabase(db, fileName, pageDataList, brandData, signal);

      currentPage += pageSize;
      io.emit('upload_status', { progress, message: `Загружено ${currentPage} из ${extractedTexts.length} на ${brandData}` });
    }

    await db.close();
    console.log(`PDF файл "${fileName}" успешно обработан и данные сохранены в базу данных.`);
    startQRdecoder(brandData, io);

    // Отправляем событие о завершении загрузки
    io.emit('upload_status', { progress: 100, message: 'Загрузка завершена!' });
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Загрузка была отменена пользователем.');
      io.emit('upload_status', { progress: 0, message: 'Загрузка отменена пользователем.' });
    } else {
      console.error('Ошибка при обработке PDF и сохранении данных в базу данных:', error);
      io.emit('upload_status', { progress: 0, message: `Ошибка: ${error.message}` });
    }
  } finally {
    abortController = null; // Очищаем AbortController после завершения
  }
}

// Обработка события отмены загрузки
function handleCancelUpload(io) {
  if (abortController) {
    abortController.abort(); // Отменяем все активные задачи
    console.log('Загрузка отменена сервером.');

    openDatabase()
      .then(async (db) => {
        await deleteDataByUploadId(db, currentUploadId); // Удаляем данные
        await db.close();
        io.emit('upload_status', { progress: 0, message: 'Загрузка отменена пользователем.' });
      })
      .catch((error) => {
        console.error('Ошибка при удалении данных:', error);
        io.emit('upload_status', { progress: 0, message: 'Ошибка при отмене загрузки.' });
      });
  }
}

// Экспорт функций
module.exports = { processPDF, handleCancelUpload };