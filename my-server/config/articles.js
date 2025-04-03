const { pool } = require('../connectDB');

// Функция для получения имени таблицы по модели и бренду
async function getCategoryByModel(model, brand, size) {
    try {
        // Нормализация входных данных
        const normalizedModel = model.split(/[-/]/)[0].trim().toLowerCase();
        const normalizedBrand = brand.trim().toLowerCase();
        const normalizedSize = size;

        // console.log(`Обработка модели: ${normalizedModel}, бренда: ${normalizedBrand}, размера: ${normalizedSize}`);
        if (model == 'ЭВА') {
            model = size.charAt(0);
            // console.log('model: ', model);

            let tableName;
            if (model == '2') {
                tableName = `${normalizedBrand}_general_2`;
            } else if (model == '3') {
                tableName = `${normalizedBrand}_general_3`;
            } else if (model == '4') {
                tableName = `${normalizedBrand}_general_4`;
            }
            // console.log(`Таблица для Multimodel определена как: ${tableName}`);

            return tableName;
        }
        // // Обработка специального случая "Multimodel"
        // if (normalizedModel === 'multimodel') {
        //     console.log('Модель Multimodel обнаружена. Определяем категорию по размеру.');

        //     let tableName;
        //     if (/^2\d/.test(normalizedSize)) {
        //         tableName = `${normalizedBrand}_general_2`;
        //     } else if (/^3\d/.test(normalizedSize)) {
        //         tableName = `${normalizedBrand}_general_3`;
        //     } else if (/^4\d/.test(normalizedSize)) {
        //         tableName = `${normalizedBrand}_general_4`;
        //     } else {
        //         throw new Error(`Не удалось определить категорию для размера: ${normalizedSize}`);
        //     }

        //     console.log(`Таблица для Multimodel определена как: ${tableName}`);
        //     return tableName;
        // }
        // Выполнение SQL-запроса для получения категории
        const [rows] = await pool.query(`
            SELECT DISTINCT category 
            FROM model_categories 
            WHERE model = ?
        `, [model]);

        // Проверка, что запрос вернул результат
        if (rows.length === 0) {
            throw new Error(`Для модели '${normalizedModel}' категории не найдены.`);
        }

        // Создание имени таблицы
        const categories = rows.map(row => row.category); // Извлечение категорий
        const tableMapping = `${normalizedBrand}_${categories.join('_')}`; // Формирование строки

        console.log(`Определенная таблица: ${tableMapping}`);
        return tableMapping;
    } catch (error) {
        console.error("Ошибка при получении категории из базы данных:", error.message);
        throw error; // Перебрасываем ошибку выше для обработки вызывающей стороной
    }
}

// Экспорт функции
module.exports = { getCategoryByModel };