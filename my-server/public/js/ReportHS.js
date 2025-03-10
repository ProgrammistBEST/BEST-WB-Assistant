// Функция для обработки нажатия кнопки
const ReportingExcel = () => {
    const button = document.getElementById('reportButton');
    if (!button) {
        console.error('[ERROR] Кнопка с id="reportButton" не найдена.');
        return;
    }

    button.addEventListener('click', async (event) => {
        event.preventDefault();

        const brand = button.value; // Получаем бренд из кнопки
        if (!brand) {
            alert('Пожалуйста, выберите бренд.');
            return;
        }

        const url = `http://${window.location.hostname}:3000/report_hs?brand=${encodeURIComponent(brand)}`;
        try {
            console.log(`[INFO] Отправка запроса на сервер: ${url}`);

            const response = await fetch(url);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[ERROR] Ошибка сервера: ${response.status}`, errorText);
                alert('Ошибка при скачивании отчета. Проверьте параметры.');
                return;
            }

            // Обработка файла как двоичных данных
            const blob = await response.blob();

            // Создаем ссылку для скачивания
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Report_${brand}.xlsx`; // Имя файла
            link.click();

            console.log('[INFO] Отчет успешно сформирован и скачан.');
        } catch (error) {
            console.error('[ERROR] Ошибка при скачивании отчета:', error);
            alert('Произошла ошибка при скачивании отчета.');
        }
    });
};

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    ReportingExcel();
});
