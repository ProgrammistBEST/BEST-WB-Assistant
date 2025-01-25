const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const ExcelJS = require('exceljs');

const port = 3100;
const app = express();

app.use(cors());

// Подключение к базе данных
const database_hs = new sqlite3.Database('../database/honestsigndb.db', (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Успешное подключение к базе данных honestsigndb');
    }
});

// Подключение к базе данных моделей
const databaseInfoModel = new sqlite3.Database('../database/products.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Ошибка при открытии базы данных', err.message);
    } else {
        console.log('Успешное подключение к базе данных products');
    }
});

// Функция для нормализации размеров (удаление повторяющихся значений)
const normalizeSize = (sizeString) => {
    // Разделяем строку на массив размеров
    const sizes = sizeString.split('-').map(size => size.trim());
    // Убираем дублирующиеся размеры
    const uniqueSizes = [...new Set(sizes)];
    // Возвращаем нормализованный размер в виде строки
    return uniqueSizes.join('-');
};

// Функция для добавления недостающих моделей с размером в отчет
const addMissingSizes = (modelsRows, reportMap, shortage) => {
    modelsRows.forEach(modelRow => {
        const key = `${modelRow.Model}_${modelRow.Size}`;
        const quantity = reportMap.get(key); // Проверяем, есть ли модель и размер в отчете

        if (quantity === undefined) {
            // Если модели и размера нет в отчете, добавляем их в нехватку с количеством 0
            shortage.push({
                Model: modelRow.Model,
                Size: modelRow.Size,
                Quantity: 0
            });
        }
    });
};

// Эндпоинт для формирования отчета
app.get('/report_hs', (req, res) => {
    const brand = req.query.brand;

    if (!brand) {
        return res.status(400).json({ error: 'Параметр brand обязателен' });
    }

    const reportQuery = `
        SELECT 
            Model, 
            Size, 
            COUNT(CASE WHEN Status = "Waiting" THEN 1 ELSE NULL END) AS Quantity
        FROM lines
        WHERE brand = ?
        GROUP BY Model, Size
    `;

    const modelsQuery = `
        SELECT vendor_code AS Model, size_key AS Size 
        FROM product_sizes${brand}
    `;

    // Выполнение запроса для отчета
    database_hs.all(reportQuery, [brand], (err, reportRows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Выполнение запроса для получения всех моделей и размеров
        databaseInfoModel.all(modelsQuery, (err, modelsRows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Создаем карту для быстрого поиска данных из отчета
            const reportMap = new Map();
            reportRows.forEach(row => {
                const key = `${row.Model}_${row.Size}`;
                reportMap.set(key, row.Quantity);
            });

            // Инициализируем массивы для наличия и нехватки
            const available = [];
            const shortage = [];

            // Обрабатываем все модели из отчета
            reportRows.forEach(row => {
                const key = `${row.Model}_${row.Size}`;
                const quantity = row.Quantity;

                if (quantity > 10) {
                    // ЧЗ больше 10 — добавляем в "Есть в наличии"
                    available.push({
                        Model: row.Model,
                        Size: row.Size,
                        Quantity: quantity
                    });
                } else {
                    // ЧЗ меньше или равно 10 — добавляем в "Нехватка"
                    shortage.push({
                        Model: row.Model,
                        Size: row.Size,
                        Quantity: quantity
                    });
                }
            });

            // Обрабатываем все модели из таблицы product_sizes${brand}
            modelsRows.forEach(modelRow => {
                // Нормализуем размер
                const normalizedSize = normalizeSize(modelRow.Size);

                const key = `${modelRow.Model}_${normalizedSize}`;
                const quantity = reportMap.get(key); // Проверяем, есть ли модель и размер в отчете

                if (quantity === undefined) {
                    // Если модели и размера нет в отчете, добавляем их в нехватку с количеством 0
                    shortage.push({
                        Model: modelRow.Model,
                        Size: normalizedSize,
                        Quantity: 0
                    });
                }
            });

            // Формируем Excel-файл
            const workbook = new ExcelJS.Workbook();

            // Лист "Есть в наличии"
            const availableSheet = workbook.addWorksheet('Есть в наличии');
            availableSheet.columns = [
                { header: 'Модель', key: 'Model', width: 20 },
                { header: 'Размер', key: 'Size', width: 20 },
                { header: 'Количество ЧЗ', key: 'Quantity', width: 20 },
            ];
            available.forEach(row => availableSheet.addRow(row));

            // Лист "Нехватка"
            const shortageSheet = workbook.addWorksheet('Нехватка');
            shortageSheet.columns = [
                { header: 'Модель', key: 'Model', width: 20 },
                { header: 'Размер', key: 'Size', width: 20 },
                { header: 'Количество ЧЗ', key: 'Quantity', width: 20 },
            ];

            // Добавляем строки с данными
            shortage.forEach(row => {
                const newRow = shortageSheet.addRow(row);

                // Применяем стили в зависимости от значения Quantity
                const quantity = row.Quantity;

                let fillColor = 'FFFFFF'; // По умолчанию — белый фон
                let fontBold = false;    // По умолчанию текст не жирный

                if (quantity < 5) {
                    fillColor = 'EE2028'; // Красный фон
                    fontBold = true;
                } else if (quantity >= 5 && quantity <= 8) {
                    fillColor = 'F7941F'; // Оранжевый фон
                    fontBold = true;
                } else if (quantity > 8) {
                    fillColor = '20B04B'; // Зеленый фон
                    fontBold = true;
                }

                // Применяем стиль к строке
                newRow.eachCell(cell => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: fillColor },
                    };
                    cell.font = {
                        bold: fontBold,
                    };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' },
                    };
                });
            });

            // Скачивание Excel-файла
            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                `attachment; filename=${brand}_report.xlsx`
            );

            workbook.xlsx.write(res).then(() => res.end());
        });
    });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});

// Закрытие подключения к базе данных при завершении работы сервера
process.on('SIGINT', () => {
    database_hs.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Закрыто подключение к базе данных.');
        process.exit(0);
    });
});
