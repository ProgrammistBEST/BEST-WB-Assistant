const apiUrl2 = "https://suppliers-api.wildberries.ru/api/v3/supplies";
(async () => {
    try {
      let token = await getApiById(3, 'Armbest', 'WB');
      console.log('Полученный токен:', token);
  
      // Вызываем getCargoes с переданным токеном
      await getCargoes(token);
    } catch (error) {
      console.error('Ошибка при обработке токена:', error.message);
    }
  })();
let objOrdersss2 = [];
let idordersArray = [];

// ПОСТАВКИ - ОСНОВА
let cargoData = {};
let DataForRemainings = {};

async function getCargoes(token) {
    console.log('api/v3/supplies: ', token)
    let nextNumber = 0;
    let limit = 100;
    let deliveryList = [];
    let ArrayForRemainings = [];

    while (true) {
        let params2 = {
            limit: limit,
            next: nextNumber,
        };
        const urlWithParams2 = new URL(apiUrl2);
        Object.keys(params2).forEach((key) => urlWithParams2.searchParams.append(key, params2[key]));

        try {
            const response = await fetch(urlWithParams2, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                console.log("Ошибка HTTP: " + response.status);
                break;
            }

            let items = await response.json();
            console.log(items);
            nextNumber = items.next;
            if (nextNumber === 0) {
                break;
            }
            Object.values(items.supplies).forEach((value) => {
                if (value.done === false && value.name === statusProgram.NameDelivery) {
                    deliveryList.push(value);
                    cargoData[value.id] = {
                        id: value.id,
                        name: value.name,
                        done: value.done,
                        orders: value.orders,
                    };
                }
            });
        } catch (error) {
            console.error("Ошибка при получении данных:", error);
            break; // Завершаем цикл при ошибке
        }
    }

    await Promise.all(
        deliveryList.map(async (order) => {
            await getOrders(idordersArray, order.id);
        })
    );

    await getStikers(idordersArray);
}


// ЗАКАЗЫ
async function getOrders(arrayGetOrderId, supplyId) {
    const apiUrl5 = `https://suppliers-api.wildberries.ru/api/v3/supplies/${supplyId}/orders`;
    try {
        const response = await fetch(apiUrl5, {
            method: "GET",
            headers: {
                'Authorization': token,
                "Content-Type": "application/json"
            }
        });
        if (!response.ok) {
            console.log("Ошибка HTTP: " + response.statusText);
        }
        const items = await response.json();
        cargoData[supplyId]['orders'] = items.orders
        items.orders.forEach(ord => {
            idordersArray.push(ord.id)
        })

    } catch (error) {
        console.error("Ошибка при получении данных:", error);
    }
}

// СТИКЕРЫ
async function getStikers(cargoes) {
    const apiUrl = "https://suppliers-api.wildberries.ru/api/v3/orders/stickers?";
    console.log('v3/orders/stickers? ', token)
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
            console.log(currentBatch)
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

// getCargoes(token)