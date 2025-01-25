const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

let db= new sqlite3.Database('./database/honestsigndb.db', (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log(' Успешное подключение к honestsigndb');
    }
});


// Функция для проверки целостности PDF
async function checkPDFIntegrity(filePath) {
    try {
      const pdfDoc = await PDFDocument.load(fs.readFileSync(filePath));
      console.log(`${filePath} is valid`);
    } catch (error) {
      console.error(`${filePath} is corrupted: ${error.message}`);
      fs.unlinkSync(filePath);
    } finally {
        // Удаление файла после проверки
        fs.unlinkSync(filePath);
        console.log(`${filePath} has been deleted`);
    }  
}
  
  // Функция для извлечения PDF из базы данных и проверки их целостности
  function extractAndCheckPDFs() {  
    db.all('SELECT data FROM lines', (err, rows) => {
      if (err) {
        console.error('Error querying database:', err.message);
        return;
      }
  
      rows.forEach((row, index) => {
        const pdfData = row.data;
        const filePath = `output${index}.pdf`;
        
        // Записываем PDF в файл
        fs.writeFileSync(filePath, pdfData);
        
        // Проверяем целостность PDF
        checkPDFIntegrity(filePath);
      });
  
      db.close();
    });
  }
  
// Запускаем процесс извлечения и проверки PDF
extractAndCheckPDFs();