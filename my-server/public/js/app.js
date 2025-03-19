// Получение данных по API
let allItems = [];
let limitModel = 100;

// URL для доступа к API Wildberries
const apiUrlModel = "https://content-api.wildberries.ru/content/v2/get/cards/list";
const totalOrders = 10;
let processedModels = 0;
let statusProgramApp = localStorage.getItem('statusProgram');
let statusProgramLoadApp = JSON.parse(statusProgramApp);
(async () => {
  try {
    let token;
    const statusProgramApp = localStorage.getItem('statusProgram');
    const statusProgramLoadApp = JSON.parse(statusProgramApp);
    console.log('statusProgramLoadApp ', statusProgramLoadApp)
    if (statusProgramLoadApp.brand == 'Armbest') {
      token = await getApiById(3, 'Armbest', 'WB');
    } else if (statusProgramLoadApp.brand == 'BestShoes') {
      token = await getApiById(6, 'BestShoes', 'WB');
    } else if (statusProgramLoadApp.brand == 'Best26') {
      token = await getApiById(9, 'Best26', 'WB');
    }

    // Вызываем getModels с переданным токеном
    await getModels(token);
  } catch (error) {
    console.error('Ошибка при обработке токена:', error.message);
  }
})();


async function getModels(token) {

  let paramsModels = {
    settings: {
      cursor: {
        limit: 100,
      },
      filter: {
        withPhoto: -1,
      },
    },
  };

  while (true) {
    try {
      const response = await fetch(apiUrlModel, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paramsModels),
      });

      if (!response.ok) {
        console.error("Ошибка HTTP: " + response.status);
        break; // Выходим из цикла при ошибке HTTP
      }

      let items = await response.json();
      processedModels++;
      document.querySelector('.progress-fill-model').style.width = (processedModels / totalOrders) * 100 + '%';
      allItems = allItems.concat(items.cards);

      const lastItem = items.cursor;
      if (Object.keys(items.cards).length < limitModel) {
        document.querySelector('.progress-fill-model').style.width = '100%';
        document.querySelector('.progress-fill-model').textContent = 'Готово';
        statusProgram.models = 'yes';
        break;
      }

      paramsModels.settings.cursor.updatedAt = lastItem.updatedAt;
      paramsModels.settings.cursor.nmID = lastItem.nmID;
    } catch (error) {
      console.error("Ошибка при получении данных:", error);
      break; // Завершаем цикл при ошибке
    }
  }
}

document.querySelector('.menu-button').addEventListener('click', function () {
  const aside = document.querySelector('.aside');
  aside.classList.toggle('open');
});