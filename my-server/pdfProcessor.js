const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const pdfjsLibPromise = import('pdfjs-dist/legacy/build/pdf.mjs');
const pdfLib = require('pdf-lib');
const { PDFDocument } = pdfLib;
const { startQRdecoder } = require('./node-zxing-master/example/test.js');

// Функция для открытия базы данных
async function openDatabase() {
  return open({
    filename: 'database/honestsigndb.db',
    driver: sqlite3.Database,
  });
}

// Извлечение текста из PDF с параллельной обработкой страниц
async function extractTextFromPDF(fileBuffer) {
  const pdfjsLib = await pdfjsLibPromise;
  const { getDocument } = pdfjsLib;

  const loadingTask = getDocument({ data: new Uint8Array(fileBuffer) });
  const pdf = await loadingTask.promise;

  // Параллельная обработка всех страниц
  const pagePromises = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
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

// Проверка, является ли текст числом в пределах от 24 до 48
function isValidSize(text) {
  const value = parseFloat(text);
  const validRanges = ['35-36', '40-41', '41-42', '46-47', '47-48'];
  return !isNaN(value) && value >= 24 && value <= 48 || validRanges.includes(text);
}

// Создание нового PDF-документа с одной страницей
async function createSinglePagePDF(preloadedPdfDoc, pageIndex) {
  const newPdfDoc = await PDFDocument.create();
  const [copiedPage] = await newPdfDoc.copyPages(preloadedPdfDoc, [pageIndex]);
  newPdfDoc.addPage(copiedPage);
  return await newPdfDoc.save();
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

// Сохранение всех данных в базу данных с проверкой на дубликатов
async function saveDataToDatabase(db, fileName, pageDataList, brandData) {
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
    const key = `${lines}|${sizes}|${brand}|${model || 'Multimodel'}|${color}`;
    if (!duplicateSet.has(key)) {
      await insertStmt.run(
        brand,
        pageData,
        pageNumber,
        lines,
        sizes,
        createdAt,
        model || 'Multimodel', // Используем model с маленькой буквы
        color
      );
    } else {
      console.log(`Пропущен дубликат: ${lines}`);
    }
  }

  // Завершение подготовленного оператора
  await insertStmt.finalize();
}

// Обработка порции страниц PDF
async function processBatchOfPages(extractedTexts, preloadedPdfDoc, startPage, pageSize, brandData) {
  const pageDataList = await Promise.all(
    extractedTexts.slice(startPage, startPage + pageSize).map(async (text, index) => {
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

// Основная функция обработки PDF
async function processPDF(fileBuffer, fileName, brandData, io) {
  try {
    const { extractedTexts } = await extractTextFromPDF(fileBuffer);
    const preloadedPdfDoc = await PDFDocument.load(new Uint8Array(fileBuffer));
    const db = await openDatabase();

    const pageSize = 50; // Количество страниц, обрабатываемых за раз
    let currentPage = 0;

    while (currentPage < extractedTexts.length) {
      const progress = Math.round(((currentPage + pageSize) / extractedTexts.length) * 100);

      const pageDataList = await processBatchOfPages(
        extractedTexts,
        preloadedPdfDoc,
        currentPage,
        pageSize,
        brandData
      );

      await saveDataToDatabase(db, fileName, pageDataList, brandData);

      currentPage += pageSize;
      io.emit('upload_status', { progress, message: `Загружено ${currentPage} из ${extractedTexts.length}` });
    }

    await db.close();
    console.log(`PDF файл "${fileName}" успешно обработан и данные сохранены в базу данных.`);
    startQRdecoder(brandData, io);
    io.emit('upload_status', { progress: 100, message: 'Загрузка завершена!' });
  } catch (error) {
    console.error('Ошибка при обработке PDF и сохранении данных в базу данных:', error);
    io.emit('upload_status', { progress: 0, message: `Ошибка: ${error.message}` });
  }
}

// Экспорт функции processPDF
module.exports = { processPDF };