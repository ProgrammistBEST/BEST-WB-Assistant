const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const pdfPoppler = require('pdf-poppler');
const qrdecoder = require('..')();
const { PDFDocument, rgb } = require('pdf-lib');
const sql = `SELECT line, data FROM lines WHERE line = ?`;
const sqlALL = `SELECT line, data, brand, fullline FROM lines WHERE brand = ?`;
const sqlUpdate = `UPDATE lines SET fullline = ? WHERE line = ?`;
const sharp = require('sharp');

let cropOptions = {};
let db = new sqlite3.Database('./database/honestsigndb.db', (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log(' Успешное подключение honestsigndb QRrecorder');
  }
});

function startQRdecoder(brandData) {
  console.log(brandData)
  if (brandData == 'BestShoes') {
    cropBox = { x: 85, y: 35, width: 80, height: 80 };
    cropOptions = { left: 400, top: 50, width: 600, height: 480 };
  } else if (brandData == 'Armbest') {
    cropBox = { x: 50, y: 0, width: 80, height: 80 };
    cropOptions = { left: 50, top: 0, width: 500, height: 450 };
  } else if (brandData == 'Best26') {
    cropBox = { x: 50, y: 0, width: 80, height: 80 };
    cropOptions = { left: 50, top: 0, width: 500, height: 450 };
  }

  db.all(sqlALL, [brandData], (err, rows) => {
    let arrayForKyzwihoutFullKyz = []
    if (err) {
      console.error(err.message);
      return;
    }
    rows.forEach((row, index) => {
      if (row.fullline == null || row.fullline.length < 5 || row.line == "") {
        arrayForKyzwihoutFullKyz.push(row)
      }
    });
    console.log(arrayForKyzwihoutFullKyz.length)
    arrayForKyzwihoutFullKyz.forEach((row, index) => {
      setTimeout(() => {
        try {
          takeInfoToLine(row, index, brandData); // Проверяем, вызывается ли функция
        } catch (error) {
          console.error('Ошибка в функции takeInfoToLine:', error);
        }
      }, index * 200); // Умножаем время задержки на индекс    
    })
  })
}

const convertPdfToPng = (outputPath, line) => {
  const options = {
    format: "png",
    out_dir: path.join(__dirname, 'papka'),
    out_prefix: path.basename(outputPath, path.extname(outputPath)),
    page: 1
  };
  try {
    pdfPoppler.convert(outputPath, options)
      .then(result => {
        const pngContent = findPngFileInPapka(outputPath);
        const fileFolder = path.basename(pngContent);
        const finalDeletePathPDFMainFolder = outputPath

        if (pngContent) {
          cropPng(pngContent, fileFolder, cropOptions, line, finalDeletePathPDFMainFolder)
        }
      })
      .catch(error => {
        console.error('Ошибка конвертации:', error);
      });
  } catch (error) {
    console.error("Error converting PDF to PNG:", error);
  }
};

function takeInfoToLine(row2, index, brandData) {
  db.get(sql, [row2.line], (err, row) => {
    if (err) {
      return console.error(err.message);
    }

    line = row.line;
    if (row) {
      const filePath = path.join(__dirname, `${index}.pdf`);
      const outputPath = path.join(__dirname, `${index}_cropped.pdf`);
      // Write the PDF to a file
      fs.writeFile(filePath, row.data, async (err) => {
        if (err) {
          return console.error("File write error:", err.message);
        }

        try {
          const existingPdfBytes = fs.readFileSync(filePath);
          const pdfDoc = await PDFDocument.load(existingPdfBytes);

          // Crop each page
          const pages = pdfDoc.getPages();
          pages.forEach((page) => {
            if (brandData == 'BestShoes') {
              // page.setCropBox(x, y, width, height);
              page.drawRectangle({
                x: 0,
                y: 0, // Координата по оси Y
                width: 80, // Ширина квадрата
                height: 150, // Высота квадрата
                color: rgb(1, 1, 1), // Белый цвет квадрата
                borderWidth: 0, // Толщина рамки (если нужна рамка)
              });
              page.drawRectangle({
                x: 0,
                y: 0, // Координата по оси Y
                width: 160, // Ширина квадрата
                height: 36, // Высота квадрата
                color: rgb(1, 1, 1), // Белый цвет квадрата
                borderWidth: 0, // Толщина рамки (если нужна рамка)
              });
            } else {
              // page.setCropBox(x, y, width, height);
              page.drawRectangle({
                x: 85,
                y: 0, // Координата по оси Y
                width: 80, // Ширина квадрата
                height: 150, // Высота квадрата
                color: rgb(1, 1, 1), // Белый цвет квадрата
                borderWidth: 0, // Толщина рамки (если нужна рамка)
              });
              page.drawRectangle({
                x: 0,
                y: 0, // Координата по оси Y
                width: 160, // Ширина квадрата
                height: 36, // Высота квадрата
                color: rgb(1, 1, 1), // Белый цвет квадрата
                borderWidth: 0, // Толщина рамки (если нужна рамка)
              });

            }
          });

          const croppedPdfBytes = await pdfDoc.save();
          fs.writeFile(outputPath, croppedPdfBytes, async (err) => {
            if (err) {
              return console.error("Error saving cropped PDF:", err.message);
            }
            fs.unlink(filePath, (err) => {
              if (err) {
                return console.error("Error deleting original PDF:", err.message);
              } else {
              }
            });
            await convertPdfToPng(outputPath, row.line);
          });
        } catch (error) {
          console.error("PDF processing error:", error.message);
        }
      });
    } else {
      console.log('No record found');
    }
  });
}

function decodeQrCode(pathFile, line) {
  return new Promise((resolve, reject) => {
    qrdecoder.decode(pathFile, (err, out) => {
      if (err) {
        resolve(line);
      } else {
        resolve(out);
      }
    });
  });
}

function main_function(outputPath, line, finalDeletePathPDFMainFolder) {
  decodeQrCode(outputPath, line)
    .then(result => {
      const cleanedOutput = result.replace(/\x1D/g, '');
      const resutlQR = cleanedOutput
      db.run(sqlUpdate, [resutlQR, line], async (err, row) => {
        if (resutlQR.length < 10) {
          return
        }
        if (err) {
          return console.error(err.message);
        } else {
          fs.unlink(outputPath, (err) => {
            if (err) {
              return console.error("Error deleting png:", err.message);
            } else {
            }
          })
          const NewPNG = path.join(__dirname, `papka/${path.basename(outputPath, path.extname(outputPath))}.png`);
          fs.unlink(NewPNG, (err) => {
            if (err) {
              return console.error("Error deleting png:", err.message);
            } else {

            }
          })
          const NewPDF = path.join(__dirname, `${path.basename(finalDeletePathPDFMainFolder, path.extname(finalDeletePathPDFMainFolder))}.pdf`);
          fs.unlink(NewPDF, (err) => {
            if (err) {
              return console.error("Error deleting png:", err.message);
            } else {
            }
          })
        }
      })
    })
    .catch(error => {
      console.error("Error decoding QR code:", error);
    });
}

async function cropPng(inputPath, outputPath, cropOptions, line, finalDeletePathPDFMainFolder) {
  try {
    // Обрезаем изображение по указанным параметрам
    await sharp(inputPath)
      .extract({
        left: cropOptions.left,
        top: cropOptions.top,
        width: cropOptions.width,
        height: cropOptions.height
      })
      .toFile(outputPath);
    main_function(outputPath, line, finalDeletePathPDFMainFolder);
  } catch (err) {
    console.error('Ошибка при обрезке изображения:', err);
  }
}

function findPngFileInPapka(outputPath) {
  let FindFilePNG = path.basename(outputPath, path.extname(outputPath)) + '-1.png'
  const folderPath = path.join(__dirname, 'papka');
  const files = fs.readdirSync(folderPath);
  const pngFile = files.find(file => file == FindFilePNG);

  if (!pngFile) {
    console.log('!!!!!!!!!!PNG файл не найден!!!!!!!!!!!!!!!!!');
    return null;
  }
  const filePath = path.join(folderPath, pngFile);
  return filePath;
}

// Экспорт функции processPDF
module.exports = {
  startQRdecoder
};