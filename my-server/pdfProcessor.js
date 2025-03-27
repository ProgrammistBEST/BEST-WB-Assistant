const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const pdfjsLibPromise = import('pdfjs-dist/legacy/build/pdf.mjs');
const pdfLib = require('pdf-lib');
const { PDFDocument } = pdfLib;

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

// Функция для выполнения Rollback
async function rollbackTransaction(db) {
  return new Promise((resolve, reject) => {
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

// Извлечение текста из PDF с параллельной обработкой страниц
async function extractTextFromPDF(fileBuffer, signal) {
  const pdfjsLib = await pdfjsLibPromise;
  const { getDocument } = pdfjsLib;

  if (signal && signal.aborted) {
    throw new DOMException('Операция отменена.', 'AbortError');
  }

  const loadingTask = getDocument({ data: new Uint8Array(fileBuffer) });
  const pdf = await loadingTask.promise;

  const pagePromises = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    if (signal && signal.aborted) {
      throw new DOMException('Операция отменена.', 'AbortError');
    }
    pagePromises.push(pdf.getPage(pageNumber).then(page => page.getTextContent()));
  }

  const textContents = await Promise.all(pagePromises);
  return textContents.map(textContent =>
    textContent.items.map(item => item.str).join('\n')
  );
}

// Сохранение данных в базу данных с проверкой на дубликаты
async function saveDataToDatabase(db, fileName, pageDataList, brandData, signal) {
  const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const brand = brandData;
  const color = 'Multicolor';

  const linesToCheck = pageDataList.map(({ lines, sizes, model }) => [
    lines,
    sizes,
    brand,
    model || 'Multimodel',
    color,
  ]);

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
  const duplicateSet = new Set(duplicates.map(row => `${row.line}|${row.Size}|${row.brand}|${row.Model}|${row.color}`));

  const insertStmt = await db.prepare(`
    INSERT INTO lines (brand, data, page, line, Size, created_at, model, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

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

  await insertStmt.finalize();
}

// Создание нового PDF-документа с одной страницей
async function createSinglePagePDF(preloadedPdfDoc, pageIndex) {
  const newPdfDoc = await PDFDocument.create();
  const [copiedPage] = await newPdfDoc.copyPages(preloadedPdfDoc, [pageIndex]);
  newPdfDoc.addPage(copiedPage);
  return await newPdfDoc.save();
}

// Обработка порции страниц PDF
async function processBatchOfPages(extractedTexts, preloadedPdfDoc, startPage, pageSize, brandData, signal) {
  return Promise.all(
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
  
// Основная функция обработки PDF
async function processPDF(fileBuffer, fileName, brandData, signal, io) {
  try {
    const db = await openDatabase(signal);
    const extractedTexts = await extractTextFromPDF(fileBuffer, signal);

    const preloadedPdfDoc = await PDFDocument.load(new Uint8Array(fileBuffer), { ignoreEncryption: true });

    const pageSize = 50;
    let currentPage = 0;

    while (currentPage < extractedTexts.length) {
      if (signal.aborted) {
        throw new DOMException('Операция отменена.', 'AbortError');
      }

      const progress = Math.round(((currentPage + pageSize) / extractedTexts.length) * 100);

      const pageDataList = await processBatchOfPages(
        extractedTexts,
        preloadedPdfDoc,
        currentPage,
        pageSize,
        brandData,
        signal
      );

      await saveDataToDatabase(db, fileName, pageDataList, brandData, signal);

      currentPage += pageSize;
      io.emit('upload_status', { progress, message: `Загружено ${currentPage} из ${extractedTexts.length}` });
    }

    await db.close();
    console.log(`PDF файл "${fileName}" успешно обработан.`);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Обработка PDF была отменена.');
    } else {
      console.error('Ошибка при обработке PDF:', error);
      throw error;
    }
  }
}

module.exports = { processPDF };