let token;

(async () => {
    try {
        token = await getApiById(3, 'Armbest', 'WB');
    } catch (error) {
        console.error('Ошибка получения токена:', error.message);
    }
})();

let statusProgram = {
    orders: "no",
    models: "no",
    changeMod: 'no',
    loadMod: 'no',
    NameDelivery: 'Утро',
    brand: ''
}

document.addEventListener('DOMContentLoaded', function () {
    const statusProgramLoad = localStorage.getItem('statusProgram');
    if (statusProgramLoad !== null) {
        let LoadStatus = JSON.parse(statusProgramLoad);
        statusProgram.brand = LoadStatus.brand
    }
    const navbarBrandElement = document.querySelector('.navbar-brand');

    if (statusProgram.brand == 'Armbest') {
        navbarBrandElement.classList.add('brand-1');
        token = getApiById(3, 'Armbest', 'WB');
    }
    else if (statusProgram.brand == 'Best26') {
        navbarBrandElement.classList.add('brand-2');
        token = getApiById(9, 'Best26', 'WB');
    }
    else if (statusProgram.brand == 'BestShoes') {
        navbarBrandElement.classList.add('brand-3');
        token = getApiById(6, 'Bestshoes', 'WB');
    }
    var dropdown = document.getElementById("navbarDropdown");

    dropdown.addEventListener('click', function (event) {
        event.preventDefault();
        var menu = this.nextElementSibling;
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    });
});

function chooseBrend(selectedbrand) {
    statusProgram.brand = selectedbrand;
    const navbarBrandElement = document.querySelector('.navbar-brand');
    navbarBrandElement.classList.remove('brand-1', 'brand-2', 'brand-3');

    if (statusProgram.brand == 'Armbest') {
        navbarBrandElement.classList.add('brand-1');
        token = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjQxMDE2djEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTc0NzY4OTQ5MywiaWQiOiIwMTkzM2U5MC1iZjI3LTcyNTUtODFkMS02YzI1ZTUxNTk2MjUiLCJpaWQiOjg1MzU5MzQ3LCJvaWQiOjgxNDg3MywicyI6MjQ2LCJzaWQiOiI3MmVjOTQ0NC1lZjY3LTQ0YTctOWUyOC01ODAyZGQyODY5NTkiLCJ0IjpmYWxzZSwidWlkIjo4NTM1OTM0N30.Kil1HJKMwLesyfcyBzZEd1vY7nRwBiJUbzLYEKgyiseRA1IKDWVvmqWuyzNM1WRh6lbIF3cUZ6CspOWwqzVTLQ'
    } else if (statusProgram.brand == 'Best26') {
        navbarBrandElement.classList.add('brand-2');
        token = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjQxMDE2djEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTc0NzY4OTY5MSwiaWQiOiIwMTkzM2U5My1jM2YwLTdkYTQtYTc1My02ODBkYmY0MmY4NTMiLCJpaWQiOjEyMjc2MDYzMywib2lkIjoxMzU5OTM5LCJzIjoyNDYsInNpZCI6IjYwODk0YzU1LWNmOWItNGVhNS04YzMzLTY2NTRkMmQ3OGFkNCIsInQiOmZhbHNlLCJ1aWQiOjEyMjc2MDYzM30.4oucmBwKLfMs_9coKkcxp1ogCAAJgVfWyhxRSasOj2D_exzowJJ6b8jq57OTaApujKLxYJhSHpoMqVld6iCauw'
    } else if (statusProgram.brand == 'BestShoes') {
        navbarBrandElement.classList.add('brand-3');
        token = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjQxMDE2djEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTc0NzY4OTYyNiwiaWQiOiIwMTkzM2U5Mi1jNjM3LTc3Y2YtODhjYy02MTg1OGViY2E2OWEiLCJpaWQiOjUxODk0ODAyLCJvaWQiOjE5MDEzNSwicyI6MjQ2LCJzaWQiOiIzYjIzZGM5Zi1iYzgxLTRmMWUtOGNhMi02ODZjMzA2NjJjMDMiLCJ0IjpmYWxzZSwidWlkIjo1MTg5NDgwMn0.y87P-oDaqk1jgxqeUwc12F0HXIdFDd6PHBSFcNntUKcbeHDiumMgf5dOokZdnM-GXvO8B1cEQhffo8T1bxP17Q'
    }

    // Сохраняем бренд в localStorage
    localStorage.setItem('statusProgram', JSON.stringify(statusProgram));

    // Обновляем текст кнопки отчёта
    const reportButton = document.getElementById('reportButton');
    if (reportButton) {
        reportButton.value = selectedbrand; // Устанавливаем значение
        reportButton.textContent = `Отчёт ЧЗ (${selectedbrand})`; // Обновляем текст кнопки
    }

    console.log(`[INFO] Выбран бренд: ${selectedbrand}`);
}

function ChangeNameDelivery(chooseDeliveryName) {
    statusProgram.NameDelivery = chooseDeliveryName

    if (chooseDeliveryName == 'Утро') {
        document.querySelector('.sectionForAcceptDeliveryold .morningstockes').style.display = 'flex'
        document.querySelector('.buttonForChangeNameDeliverymorning').style.backgroundColor = '#3b9de9';
        document.querySelector('.buttonForChangeNameDeliveryevening').style.backgroundColor = 'white';
        document.querySelector('.buttonForChangeNameDeliveryleaft').style.backgroundColor = 'white';
        document.querySelector('.sectionForAcceptDeliveryold .leftoversstockes').style.display = 'none'
        document.querySelector('.sectionForAcceptDeliveryold .eveningstockes').style.display = 'none'
    }
    else if (chooseDeliveryName == 'Вечер') {
        document.querySelector('.sectionForAcceptDeliveryold .morningstockes').style.display = 'none'
        document.querySelector('.sectionForAcceptDeliveryold .leftoversstockes').style.display = 'none'
        document.querySelector('.sectionForAcceptDeliveryold .eveningstockes').style.display = 'flex'
        document.querySelector('.buttonForChangeNameDeliverymorning').style.backgroundColor = 'white';
        document.querySelector('.buttonForChangeNameDeliveryevening').style.backgroundColor = '#3b9de9';
        document.querySelector('.buttonForChangeNameDeliveryleaft').style.backgroundColor = 'white';
    }
    else if (chooseDeliveryName == 'Остатки') {
        document.querySelector('.sectionForAcceptDeliveryold .morningstockes').style.display = 'none'
        document.querySelector('.sectionForAcceptDeliveryold .leftoversstockes').style.display = 'flex'
        document.querySelector('.sectionForAcceptDeliveryold .eveningstockes').style.display = 'none'
        document.querySelector('.buttonForChangeNameDeliverymorning').style.backgroundColor = 'white';
        document.querySelector('.buttonForChangeNameDeliveryevening').style.backgroundColor = 'white';
        document.querySelector('.buttonForChangeNameDeliveryleaft').style.backgroundColor = '#3b9de9';
    }
}