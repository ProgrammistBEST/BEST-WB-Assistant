const { pool } = require('../connectDB');

// Функция для получения имени таблицы по модели и бренду
async function getCategoryByModel(model, brand, size) {
    try {
        // 1. Нормализация данных
        const normalizedParams = normalizeInputData(model, brand, size);
        const { normalizedModel, normalizedBrand, normalizedSize } = normalizedParams;

        // 2. Обработка специальной логики для модели "ЭВА"
        if (normalizedModel === 'эва') {
            return getTableNameForEva(normalizedBrand, normalizedSize);
        }

        // 3. Получение категории из базы данных
        const categoryMapping = await fetchCategoryFromDatabase(normalizedModel);

        // 4. Формирование имени таблицы
        return `${normalizedBrand}_${categoryMapping}`;
    } catch (error) {
        console.error("Ошибка при получении категории из базы данных:", error.message);
        throw error; // Перебрасываем ошибку выше для обработки вызывающей стороной
    }
}

// Нормализация входных данных
function normalizeInputData(model, brand, size) {
    const normalizedModel = model.split(/[-/]/)[0].trim().toLowerCase();
    const normalizedBrand = brand.trim().toLowerCase();
    const normalizedSize = size.trim();

    return { normalizedModel, normalizedBrand, normalizedSize };
}

// Обработка специальной логики для модели "ЭВА"
function getTableNameForEva(brand, size) {
    const firstCharOfSize = size.charAt(0);

    let tableName;
    switch (firstCharOfSize) {
        case '2':
            tableName = `${brand}_general_2`;
            break;
        case '3':
            tableName = `${brand}_general_3`;
            break;
        case '4':
            tableName = `${brand}_general_4`;
            break;
        default:
            throw new Error(`Неподдерживаемый размер для модели ЭВА: ${size}`);
    }

    return tableName;
}

// Получение категории из базы данных
async function fetchCategoryFromDatabase(model) {
    const [rows] = await pool.query(`
        SELECT DISTINCT category 
        FROM model_categories 
        WHERE model = ?
    `, [model]);

    if (rows.length === 0) {
        throw new Error(`Для модели '${model}' категории не найдены.`);
    }

    return rows.map(row => row.category).join('_');
}

// Экспорт функции
module.exports = { getCategoryByModel };