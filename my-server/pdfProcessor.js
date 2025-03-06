const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

// Импортируем библиотеки в глобальной области видимости
const pdfjsLibPromise = import('pdfjs-dist/legacy/build/pdf.mjs');
const pdfLib = require('pdf-lib');
const { PDFDocument } = pdfLib;
const { startQRdecoder } = require('./node-zxing-master/example/test.js');

// Функция для открытия базы данных
async function openDatabase() {
  return open({
    filename: 'database/honestsigndb.db',
    driver: sqlite3.Database
  });
}

// Извлечение текста из PDF
async function extractTextFromPDF(data) {
  const pdfjsLib = await pdfjsLibPromise;
  const { getDocument } = pdfjsLib;

  const loadingTask = getDocument({ data });
  const pdf = await loadingTask.promise;
  const extractedTexts = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const textContentPage = await page.getTextContent();
    const textContent = textContentPage.items.map(item => item.str).join('\n');
    extractedTexts.push(textContent);
  }

  return { extractedTexts, pdf };
}

// Проверка, является ли текст числом в пределах от 24 до 48
function isValidSize(text) {
  let value = parseFloat(text);
  return !isNaN(value) && (value >= 24 && value <= 48) || ['35-36', '40-41', '41-42', '46-47', '47-48'].includes(text);
}

// Сохранение всех данных в базу данных
async function saveAllDataToDB(db, fileName, pageDataList, brandData) {
  let brand = brandData;
  let color;
  let createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  let insertStmt = await db.prepare('INSERT INTO lines (brand, data, page, line, Size, created_at, model, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

  for (let { pageData, pageNumber, lines, sizes, Model} of pageDataList) {
    if (Model == '' || Model == ' '){
      Model = 'Multimodel';
      color = 'Multicolor';
    }
    color = 'Multicolor';
    let existingEntry = await db.get('SELECT 1 FROM lines WHERE line = ? AND Size = ? AND brand = ? AND Model = ? AND color = ?', [lines, sizes, brand, Model, color]);
    if (!existingEntry) {
      await insertStmt.run( brand, pageData, pageNumber, lines, sizes, createdAt, Model, color);
    }
    else {
        console.log('Найдено совпадение!')
    }
  }
  await insertStmt.finalize();
}

// Создание нового PDF-документа с одной страницей
async function createSinglePagePDF(pdfBytes, pageIndex) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const newPdfDoc = await PDFDocument.create();
  const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageIndex]);
  newPdfDoc.addPage(copiedPage);
  return await newPdfDoc.save();
}

// Функция обработки PDF
async function processPDF(fileBuffer, fileName, brandData, io) {
  try {
    const data = new Uint8Array(fileBuffer);
    const { extractedTexts, pdf } = await extractTextFromPDF(data);

    // Сохранение оригинального PDF для использования с pdf-lib
    const pdfBytes = new Uint8Array(fileBuffer);

    const db = await openDatabase();

    const pageSize = 50; // Количество страниц, обрабатываемых за раз
    let startPage = 0;

    while (startPage < extractedTexts.length) {
      
      const progress = Math.round(((startPage + pageSize) / extractedTexts.length) * 100);
      io.emit('upload_status', { progress, message: `Загружено ${startPage} из ${extractedTexts.length}` });

      const pageDataList = await Promise.all(extractedTexts.slice(startPage, startPage + pageSize).map(async (text, pageIndex) => {
        const linesArray = text.split('\n');
        let lines = linesArray.filter(line => line.startsWith('(01)')).join('\n');
        let sizes = '';
        let Model = '';
        if (linesArray.length > 1 && brandData != 'Best26') {
          const secondLine = linesArray[4] || '';
          if (isValidSize(secondLine)) {
            sizes = secondLine;
            Model = ''
          } else {
            sizes = linesArray[2] || '';
            Model = ''
          }
        } else if (linesArray.length > 1 && brandData == 'Best26') {
          const secondLine = linesArray[4] || '';
          const thirdLine = linesArray[2] || '';
          if (isValidSize(secondLine)) {
            sizes = secondLine;
            Model = thirdLine;
          } else {
            sizes = linesArray[2] || '';
            Model = thirdLine;
          }
        }
        // Создаем новый PDF-документ с одной страницей
        const pageBytes = await createSinglePagePDF(pdfBytes, startPage + pageIndex);
        return { pageData: pageBytes, pageNumber: startPage + pageIndex + 1, lines, sizes, Model};
      }));

      // Записываем данные в базу данных
      await saveAllDataToDB(db, fileName, pageDataList, brandData);

      // Перемещаемся к следующей порции страниц
      startPage += pageSize;
      console.log(startPage)
    }
    await db.close();
    console.log(`PDF файл "${fileName}" успешно обработан и данные сохранены в базу данных.`);
    startQRdecoder(brandData);
    io.emit('upload_status', { progress: 100, message: 'Загрузка завершена!' });

  } catch (err) {
    console.error('Ошибка при обработке PDF и сохранении данных в базу данных:', err);
    io.emit('upload_status', { progress: 0, message: `Ошибка: ${err.message}` });
  }
}

// Экспорт функции processPDF
module.exports = {
    processPDF
};