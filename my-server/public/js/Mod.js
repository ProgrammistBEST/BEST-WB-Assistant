let token = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjQxMDE2djEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTc0NzY4OTQ5MywiaWQiOiIwMTkzM2U5MC1iZjI3LTcyNTUtODFkMS02YzI1ZTUxNTk2MjUiLCJpaWQiOjg1MzU5MzQ3LCJvaWQiOjgxNDg3MywicyI6MjQ2LCJzaWQiOiI3MmVjOTQ0NC1lZjY3LTQ0YTctOWUyOC01ODAyZGQyODY5NTkiLCJ0IjpmYWxzZSwidWlkIjo4NTM1OTM0N30.Kil1HJKMwLesyfcyBzZEd1vY7nRwBiJUbzLYEKgyiseRA1IKDWVvmqWuyzNM1WRh6lbIF3cUZ6CspOWwqzVTLQ';

let statusProgram = {
    orders: "no",
    models: "no",
    changeMod: 'no',
    loadMod: 'no',
    NameDelivery: 'Утро',
    brand: ''
}

document.addEventListener('DOMContentLoaded', async function () {
    const statusProgramLoad = localStorage.getItem('statusProgram');
    if (statusProgramLoad !== null) {
        let LoadStatus = JSON.parse(statusProgramLoad);
        statusProgram.brand = LoadStatus.brand
    }
    const navbarBrandElement = document.querySelector('.navbar-brand');

    if (statusProgram.brand == 'Armbest') {
        navbarBrandElement.classList.add('brand-1');
        token = await getApiById("3", "Armbest", "WB");
    } else if (statusProgram.brand == 'Best26') {
        navbarBrandElement.classList.add('brand-2');
        token = await getApiById("9", "Best26", "WB");
    } else if (statusProgram.brand == 'BestShoes') {
        navbarBrandElement.classList.add('brand-3');
        token = await getApiById("6", "BestShoes", "WB");
    } else if (statusProgram.brand == 'Arm2') {
        navbarBrandElement.classList.add('brand-4');
        token = await getApiById("17", "Arm2", "WB");
    }

    // Теперь токен получен, можно запускать основные функции
    await getCargoes();

    var dropdown = document.getElementById("navbarDropdown");

    dropdown.addEventListener('click', function (event) {
        event.preventDefault();
        var menu = this.nextElementSibling;
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    });
});

async function chooseBrend(selectedbrand) {

    statusProgram.brand = selectedbrand;
    const navbarBrandElement = document.querySelector('.navbar-brand');
    navbarBrandElement.classList.remove('brand-1', 'brand-2', 'brand-3');

    if (statusProgram.brand == 'Armbest') {
        navbarBrandElement.classList.add('brand-1');
        token = await getApiById("3", "Armbest", "WB");
    } else if (statusProgram.brand == 'Best26') {
        navbarBrandElement.classList.add('brand-2');
        token = await getApiById("9", "Best26", "WB");
    } else if (statusProgram.brand == 'BestShoes') {
        navbarBrandElement.classList.add('brand-3');
        token = await getApiById("6", "BestShoes", "WB");
    } else if (statusProgram.brand == 'Arm2') {
        navbarBrandElement.classList.add('brand-4');
        token = await getApiById("17", "Arm2", "WB");
    }

    localStorage.setItem('statusProgram', JSON.stringify(statusProgram));
    location.reload();
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