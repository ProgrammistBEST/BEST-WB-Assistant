const apiUrl3 = "https://suppliers-api.wildberries.ru/api/v3/orders";
let nextNumber = 0;
let limit = 1000;
let objOrdersss = [];

const navbarBrandElement = document.querySelector('.navbar-brand');
(async () => {
    try {
        // Получение токена в зависимости от бренда
        let token;
        const statusProgramApp = localStorage.getItem('statusProgram');
        const statusProgramLoadApp = JSON.parse(statusProgramApp);

        if (statusProgramLoadApp.brand === 'Armbest') {
            token = await getApiById(3, 'Armbest', 'WB');
        } else if (statusProgramLoadApp.brand === 'Best26') {
            token = await getApiById(9, 'Best26', 'WB');
        } else if (statusProgramLoadApp.brand === 'BestShoes') {
            token = await getApiById(6, 'Bestshoes', 'WB');
        } else if (statusProgramLoadApp.brand === 'Arm2') {
            token = await getApiById(17, 'Arm2', 'WB');
        }
    } catch (error) {
        console.error('Ошибка при обработке токена:', error.message);
    }
})();


async function getInfo() {
    let hasMoreData = true;

    while (hasMoreData) {

        let params2 = {
            'limit': limit,
            'next': nextNumber,
            'dateFrom': '1720505081',
            'dateTo': '1720591506'
        }
        const urlWithParams = new URL(apiUrl3);
        Object.keys(params2).forEach(key => urlWithParams.searchParams.append(key, params2[key]));

        try {
            const response = await fetch(urlWithParams, {
                method: "GET",
                headers: {
                    Authorization: token,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                console.log("Ошибка HTTP: " + response.status);
            }
            let items = await response.json();
            nextNumber = items.next
            if (items.next == 0) {
                hasMoreData = false
                break
            }
            objOrdersss.push(items.orders)
        } catch (error) {
            console.error("Ошибка при получении данных:", error);
        }
    }


    let arrayGetOrderId = []
    objOrdersss[0].forEach(order => {
        arrayGetOrderId.push(order.id)
    })
    // console.log(arrayGetOrderId)
    getItems(arrayGetOrderId)
}

async function getItems(arrayGetOrderId) {
    const apiUrl2 = "https://suppliers-api.wildberries.ru/api/v3/orders/stickers";

    let params4 = {
        "type": 'svg',
        "width": 58,
        "height": 40,
    }

    const urlWithParams = new URL(apiUrl2);
    Object.keys(params4).forEach(key => urlWithParams.searchParams.append(key, params4[key]));
    let x = 0
    let orderNumber = arrayGetOrderId.slice(0, 100)
    while (true) {
        let body2 = {
            'orders': orderNumber
        }
        try {
            const response = await fetch(urlWithParams, {
                method: "POST",
                headers: {
                    'Authorization': token3,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body2),
            });
            if (!response.ok) {
                console.log("Ошибка HTTP: " + response.message);
            }
            let items = await response.json();
            if (orderNumber.length < 100) {
                break;
            }
            if (x == 0) {
                orderNumber = arrayGetOrderId.slice(100, 200);
                body2.orders = orderNumber;
            }
            if (x == 1) {
                orderNumber = arrayGetOrderId.slice(200, 300);
                body2.orders = orderNumber;
            }
            if (x == 1) {
                orderNumber = arrayGetOrderId.slice(300, 400);
                body2.orders = orderNumber;
            }
            x++
        } catch (error) {
            console.error("Ошибка при получении данных:", error);
        }
    }
}
getInfo()