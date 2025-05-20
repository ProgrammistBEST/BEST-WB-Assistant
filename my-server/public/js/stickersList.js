const apiUrl2 = "https://marketplace-api.wildberries.ru/api/v3/supplies";

let objOrdersss2  = [];
let idordersArray = [];

// ПОСТАВКИ - ОСНОВА
let cargoData = {};
let DataForRemainings = {};

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Функция экспоненциальной задержки
function exponentialDelay(retryCount) {
    const delayTime = Math.min(1000 * Math.pow(2, retryCount), 10000); // до 10 сек
    return new Promise(resolve => setTimeout(resolve, delayTime));
}

// Обёртка для безопасного выполнения запроса с повторными попытками
async function safeCall(fn, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (error.status === 429 && i < retries - 1) {
                console.warn(`Попытка ${i + 1} завершена с 429. Ждём...`);
                await exponentialDelay(i);
                continue;
            }
            throw new Error(`Не удалось выполнить запрос после ${retries} попыток: ${error.message}`);
        }
    }
}

// Основная функция получения поставок
async function getCargoes() {

    if (!token || token.trim() === '') {
        console.error("Токен не установлен");
        return;
    }

    let nextNumber = 0;
    let limit = 100;
    let deliveryList = [];

    while (true) {
        let params2 = {
            'limit': limit,
            'next': nextNumber,
        };

        const urlWithParams2 = new URL(apiUrl2);
        Object.keys(params2).forEach(key => urlWithParams2.searchParams.append(key, params2[key]));

        try {
            const response = await fetch(urlWithParams2, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Ошибка HTTP:", response.status, errorText);

                // Генерируем ошибку, чтобы триггернуть retry в safeCall
                const error = new Error(`HTTP ошибка: ${response.status}`);
                error.status = response.status;
                throw error;
            }

            const items = await response.json();

            nextNumber = items.next || 0;

            if (!Array.isArray(items.supplies)) {
                console.error("supplies отсутствует или не является массивом", items);
                break;
            }

            items.supplies.forEach(value => {
                if (!value.done && value.name === statusProgram.NameDelivery) {
                    deliveryList.push(value);
                    cargoData[value.id] = {
                        id: value.id,
                        name: value.name,
                        done: value.done,
                        orders: value.orders
                    };
                }
            });

            if (nextNumber === 0) break;

            await delay(10); // Задержка между пакетами поставок

        } catch (error) {
            console.error("Ошибка при получении данных:", error.message);
            break;
        }
    }

    // Получение заказов по каждой поставке с защитой от 429
    await Promise.all(deliveryList.map(async (order, index) => {
        await safeCall(async () => {
            await getOrders(idordersArray, order.id);
        });
    }));

    await getStikers(idordersArray);
}

// ЗАКАЗЫ
async function getOrders(arrayGetOrderId, supplyId) {
    const apiUrl5 = `https://marketplace-api.wildberries.ru/api/v3/supplies/${supplyId}/orders`;

    try {
        const response = await fetch(apiUrl5, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            console.error(`Ошибка HTTP при получении заказов для поставки ${supplyId}:`, {
                status: response.status,
                body: errorData
            });
            return;
        }

        const items = await response.json();

        if (items && Array.isArray(items.orders)) {
            cargoData[supplyId]['orders'] = items.orders;

            items.orders.forEach(ord => {
                arrayGetOrderId.push(ord.id);
            });
        } else {
            console.warn(`Поставка ${supplyId} не содержит orders или данные повреждены`);
        }

    } catch (error) {
        console.error(`Ошибка при получении данных о заказах поставки ${supplyId}:`, error);
    }
}

// СТИКЕРЫ
async function getStikers(cargoes) {
    const apiUrl = "https://marketplace-api.wildberries.ru/api/v3/orders/stickers?";

    const params = {
        "type": 'png',
        "width": 58,
        "height": 40,
    };

    const batchSize = 100; // Batch size for slicing cargoes
    try {
        let page = 0;
        while (true) {
            const batchStart = page * batchSize;
            const batchEnd = (page + 1) * batchSize;
            const currentBatch = cargoes.slice(batchStart, batchEnd);
	    if (currentBatch.length == 0) {
		break;
	    };
            const body = {
                'orders': currentBatch,
            };
            const response = await fetch(apiUrl + new URLSearchParams(params).toString(), {
                method: "POST",
                headers: {
                    'Authorization': token,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                document.getElementById('put_order_in_box').textContent = 'Заказов нет'
                throw new Error("HTTP error " + response.status);
            }
            const items = await response.json();

            if (Array.isArray(items.stickers)) {
                items.stickers.forEach(sticker => {
                    Object.values(cargoData).forEach(cargoArray => {
                        if (cargoArray && typeof cargoArray === 'object') {
                            Object.values(cargoArray.orders).forEach(ord => {
                                if (ord.id && ord.id === sticker.orderId) {
                                    ord['sticker'] = sticker;
                                }
                            });
                        } else {
                            console.error('cargoArray не является объектом:', cargoArray);
                        }
                    });
                });
            } else {
                console.error('items.stickers не является массивом:', items.stickers);
                break
            }
            
            const stickersCount = Object.values(items.stickers).length;
            if (stickersCount < batchSize) {
                break;
            }
            page++;
        }
        getQuests()
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}