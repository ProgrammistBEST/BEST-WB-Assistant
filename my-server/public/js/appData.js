let gif = document.getElementById('updateBDGif');
let buttonUpdate = document.getElementById('updateBDButton');

// массив для изменяемых объектов
let ChangeArray = []
let NewModelsArray = []
let arrModels = []
document.addEventListener('DOMContentLoaded', function () {
    function loadModelFromDB() {
        fetch(`/getModel${statusProgram.brand}`)
            .then(response => response.json()) // Преобразуем ответ в JSON
            .then(data => {
                document.getElementById('sectionForDatabaseModels').innerHTML = ''
                // Обработка полученных данных
                let output = '<div class="grid-column-models">';
                data.forEach(item => {
                    if (!arrModels.includes(item.vendor_code)) {
                        output += `<button class="model-elemDB" onclick="addModelsForChanges('${item.vendor_code}', '${item.tech_size}','${item.pair}')">${item.vendor_code}</button>`;
                        arrModels.push(item.vendor_code)
                    }
                });
                output += '</div>';
                document.getElementById('sectionForDatabaseModels').innerHTML = output;
                document.getElementById('sectionForDatabaseModels').innerHTML += `<div class="choosedModel_forchanged">
                                                                                <div class='boxforinfoDB'>
                                                                                    <button class="buttonAddModelInDB" onclick='AddNewModelsForDB(0,0,0)'>Добавить новую модель</button>
                                                                                    <button class="buttonAddModelInDB">Мне нужна помощь</button>
                                                                                </div>
                                                                                </div>`
            })
            .catch(error => console.error('Ошибка загрузки данных:', error));
    }
    loadModelFromDB()
});

buttonUpdate.onclick = function () {
    if (document.getElementById('updateBDButton').classList.contains('off')) {
        document.getElementById('updateBDButton').classList.remove('off')
        gif.style.display = ''
        document.querySelector('.sectionForDatabaseModels').style.opacity = 1
        document.querySelector('.grid-column-models').style.display = 'grid'
        document.querySelector('.sectionForDatabaseModels').style.width = '100%'
        document.querySelector('.sectionForDatabaseModels').style.height = '100%'

        setTimeout(() => {
            buttonUpdate.textContent = 'Update!'
            gif.style.display = 'none'
            setTimeout(() => {
                buttonUpdate.textContent = 'Update models'
            }, 5000);
        }, 3000);
    }
    else {
        document.getElementById('updateBDButton').classList.add('off')
        gif.style.display = ''
        document.querySelector('.sectionForDatabaseModels').style.opacity = 0
        document.querySelector('.grid-column-models').style.display = 'none'
        // document.querySelector('.sectionForDatabaseModels').style.width= '0'
        document.querySelector('.sectionForDatabaseModels').style.height = '0'
    }
}

function addModelsForChanges(vendorcode, wbsize, pair) {
    let div = document.querySelector('.choosedModel_forchanged')
    div.innerHTML +=
        `<article class="changeModels">
        <div class="modelScreenIndatabasemodel">
        <div class="ArticulforModelDB">${vendorcode}</div>
        
        <label class='labelforchangeModelsDB' for='wbsize'>Размер:</label>
        <input name='wbsize' class="box-change-elem-for-modelDB" placeholder="${wbsize}" name='wbsize' value='${wbsize}'></input>
        
        <label class='labelforchangeModelsDB' for='pair'>Пар в коробе:</label>
        <input name='pair' class="box-change-elem-for-modelDB" placeholder="${pair}" name='pair' value='${pair}'></input>
        </div>
        
        <div class="boxforbuttoninChangingModelsDB">
        <button class="btn-fordatabasemodel button_changeModelDB" onclick="button_changeModelDB('${vendorcode}','${wbsize}','${pair}')">
            Изменить
        </button>
        <button class="btn-fordatabasemodel button_deleteModelDB" onclick="button_deleteModelDB('${vendorcode}','${wbsize}','${pair}')">
            Удалить
        </button>
        </div>
    </article>`
    let newModels = {
        vendorcode: vendorcode,
        wbsize: wbsize,
        pair: pair
    }
    ChangeArray.push(newModels)
}
// document.querySelectorAll('.model-elemDB').forEach(button=> {
//     button.addEventListener('click', addModelsForChanges)
// });

// document.querySelectorAll('.model-elemDB').forEach(button=> {
//     button.addEventListener('click', addModelsForChanges)
// });

function AddNewModelsForDB() {
    let div = document.querySelector('.choosedModel_forchanged')
    div.innerHTML +=
        `<article class="changeModels">
        <div class="modelScreenIndatabasemodel">
        <input name='NewArticul' class="ArticulforModelDB" placeholder="Артикул"></input>
        
        <label class='labelforchangeModelsDB' for='wbsize'>Размер:</label>
        <input name='Newsize' class="box-change-elem-for-modelDB" placeholder="0" name='wbsize' value=''></input>
        
        <label class='labelforchangeModelsDB' for='pair'>Пар в коробе:</label>
        <input name='Newpair' class="box-change-elem-for-modelDB" placeholder="0" name='pair' value=''></input>
        </div>
        
        <div class="boxforbuttoninChangingModelsDB">
        <button class="btn-fordatabasemodel button_saveNewModelDB" onclick="button_addNewModelDB()">
            Сохранить
        </button>
        </div>
    </article>`
}

function getHonestSign() {
    let array = document.querySelectorAll('.spanKYZOrderMain');
    array.forEach(element => {
        element.insertAdjacentHTML('beforeend',
            `
            <span class='spanKYZOrderMain'><b>KYZ:</b> ${1}</span> <br>
        `);
    });
}

function button_deleteModelDB(vendorcode, wbsize, pair) {

    document.querySelectorAll('.box-change-elem-for-modelDB[name="pair"]').forEach(input => {
        if (input.placeholder == pair) {
            let answer = prompt('Вы собираетесь изменить пары в коробке с ' + pair + ' на ' + input.value + ' Для подтверждения действия введите код: 123')
            if (answer == 123) {
                fetch('/delete-element', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        vendorcode: vendorcode,
                        wbsize: wbsize,
                        pair: input.value
                    })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                        } else {
                            console.error('Error updating data:', data.error);
                        }
                    })
                    .catch((error) => {
                        console.error('Error:', error);
                    });
                input.parentNode.parentNode.style.transition = '1s';
                input.parentNode.parentNode.style.backgroundColor = 'red';
                setTimeout(() => {
                    input.parentNode.parentNode.style.height = '0px';
                    input.parentNode.parentNode.style.opacity = 0;
                    setTimeout(() => {
                        input.parentNode.parentNode.remove()
                    }, 1000);
                }, 4000);
            }
            else {
                alert('Отмена действия, введен неправильный код')
            }
        }
    })
}

// функция добавления модели!!!
function button_addNewModelDB() {
    let pair;

    let Articul;

    let Size;

    document.querySelectorAll('input').forEach(input => {
        if (input.name == 'Newsize') {
            pair = input.value;
        }
        else if (input.name == 'NewArticul') {
            Articul = input.value;
        }
        else if (input.name == 'Newpair') {
            Size = input.value;
        }
        if (pair != null && Articul != null && Size != null) {
            let answer = prompt('Вы собираетесь изменить пары в коробке с ' + pair + ' на ' + input.value + ' Для подтверждения действия введите код: 123')
            if (answer == 123) {
                fetch('/add-element', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        vendorcode: Articul,
                        wbsize: Size,
                        pair: pair
                    })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            input.parentNode.parentNode.style.transition = '1s';
                            input.parentNode.parentNode.style.backgroundColor = 'limegreen';
                            setTimeout(() => {
                                input.parentNode.parentNode.style.height = '0px';
                                input.parentNode.parentNode.style.opacity = 0;
                                setTimeout(() => {
                                    input.parentNode.parentNode.remove()
                                }, 1000);
                            }, 4000);
                        } else {
                            console.error('Error updating data:', data.error);
                        }
                    })
                    .catch((error) => {
                        console.error('Error:', error);
                    });
            }
            else {
                alert('Отмена действия, введен неправильный код')
            }
        }
    })
}



function button_changeModelDB(vendorcode, wbsize, pair) {
    document.querySelectorAll('.box-change-elem-for-modelDB[name="pair"]').forEach(input => {
        if (input.placeholder == pair) {
            let answer = prompt('Вы собираетесь изменить пары в коробке с ' + pair + ' на ' + input.value + ' Для подтверждения действия введите код: 123')
            if (answer == 123) {

                fetch('/update-element', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        vendorcode: vendorcode,
                        wbsize: wbsize,
                        pair: input.value
                    })
                })
                    .then(response => {
                        // Проверка типа ответа
                        if (!response.headers.get('content-type').includes('application/json')) {
                            throw new Error('Server did not return JSON');
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data.success) {
                            // Обновление пользовательского интерфейса при успешном ответе
                            input.parentNode.parentNode.style.transition = '1s';
                            input.parentNode.parentNode.style.backgroundColor = 'green';
                            setTimeout(() => {
                                input.parentNode.parentNode.style.height = '0px';
                                input.parentNode.parentNode.style.opacity = 0;
                                setTimeout(() => {
                                    input.parentNode.parentNode.remove()
                                }, 1000);
                            }, 4000);
                        } else {
                            console.error('Error updating data:', data.error);
                        }
                    })
                    .catch((error) => {
                        console.error('Error:', error);
                    });
            }
            else {
                alert('Отмена действия, введен неправильный код')
            }
        }
    })
}

let array_characters_missing = []
let arraySizeFromDBKyz = []

document.addEventListener('DOMContentLoaded', function () {
    const brand = statusProgram && statusProgram.brand;
    if (!brand) {
        return;
    }

    fetch(`/kyzSizes?brand=${encodeURIComponent(brand)}`)
        .then(response => response.json())
        .then(data => {
            const carouselInner = document.getElementById('carousel-inner');
            let slideContent = '';
            let itemCount = 0;
            const itemsPerPage = 8;
            const pages = Math.ceil(data.length / itemsPerPage);

            for (let page = 0; page < pages; page++) {
                const start = page * itemsPerPage;
                const end = Math.min(start + itemsPerPage, data.length);
                const isActive = page === 0 ? 'active' : '';

                slideContent += `<div class="carousel-item ${isActive}"><ul class="list-group">`;
                for (let i = start; i < end; i++) {
                    arraySizeFromDBKyz.push(data[i].Size)
                    let colorKYZ = (data[i].Quantity < 100) ? "red" : "black";
                    if (data[i].Quantity < 100) {
                        let item = {
                            [data[i].Size]: data[i].Quantity
                        }
                        array_characters_missing.push(item)
                    }
                    if (statusProgram.brand == 'Best26') {
                        slideContent += `
                        <li class="list-group-item">
                        <span class="size-span">${data[i].Size}</span> - <span class="size-span">${data[i].Model}</span> - <span class="quantity-span" style="color: ${colorKYZ};">${data[i].Quantity}</span>                        </li>
                    `;
                    } else {
                        slideContent += `
                        <li class="list-group-item">
                        <span class="size-span">${data[i].Size}</span> - <span class="quantity-span" style="color: ${colorKYZ};">${data[i].Quantity}</span>                        </li>
                    `;
                    }
                }

                slideContent += `</ul></div>`;
            }

            carouselInner.innerHTML = slideContent;

            if (array_characters_missing.length > 0) {

                const modalContent = document.querySelector('.text-message');
                modalContent.innerHTML = `Срочно добавьте Честный знак на ${statusProgram.brand}:`
                document.querySelector('body').style.overflow = 'hidden';
                modalContent.innerHTML += array_characters_missing.map(item => {
                    const size = Object.keys(item)[0];
                    const quantity = item[size];
                    return `<p style='font-size: 1.1vh'>${size} раз. - ${quantity} ед.</p>`;
                }).join('');

                document.getElementById('success-message').style.display = 'flex'
                document.querySelector('.exclamation_point_module').style.display = 'block'
                setTimeout(() => {
                    document.getElementById('success-message').style.opacity = 1
                    setTimeout(() => {
                        document.querySelector('.message').style.transform = "translate(220px)"
                        document.querySelector('.exclamation_point_module').style.display = 'none'
                        document.getElementById('success-message').style.opacity = 0
                        setTimeout(() => {
                            document.getElementById('success-message').style.display = 'none'
                            document.querySelector('.message').style.transform = "translate(0px)"
                            document.querySelector('body').style.overflow = '';
                        }, 1000);
                    }, 5000);
                }, 1000);
            }

            const range = [];
            for (let i = 24; i <= 48; i++) {
                range.push(i);
            }
            // Преобразование строковых значений массива в числа и обработка диапазонов
            const expandedArraySize = arraySizeFromDBKyz.flatMap(value => {
                if (value.includes('-')) {
                    const [start, end] = value.split('-').map(Number);
                    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
                } else {
                    return Number(value);
                }
            });

            const missingValues = range.filter(value => !expandedArraySize.includes(value));

            if (missingValues.length > 0) {
                setTimeout(() => {
                    document.querySelector('body').style.overflow = 'hidden';
                    document.querySelector('.text-message').innerHTML = `Отсутствуют следующие размеры на ${statusProgram.brand}: <br>` + missingValues
                    document.getElementById('success-message').style.display = 'flex'
                    document.querySelector('.exclamation_point_module').style.display = 'block'
                    setTimeout(() => {
                        document.getElementById('success-message').style.opacity = 1
                        setTimeout(() => {
                            document.querySelector('.message').style.transform = "translate(220px)"
                            document.querySelector('.exclamation_point_module').style.display = 'none'
                            document.getElementById('success-message').style.opacity = 0
                            setTimeout(() => {
                                document.getElementById('success-message').style.display = 'none'
                                document.querySelector('.message').style.transform = "translate(0px)"
                                document.querySelector('body').style.overflow = '';
                            }, 1000);
                        }, 5000);
                    }, 500);
                }, 7500);
            }
        })
        .catch(error => console.error('Error fetching sizes:', error));
});

let area = document.querySelector('.AddingKyzFromUsersFile')
function openSizeKyzFromDB() {
    if (area.classList.contains('closeAreaKyz')) {
        area.classList.remove('closeAreaKyz');
        area.classList.add('openAreaKyz');
        document.querySelector('.areaforSizeAndModelKyz').style.display = 'block'
        document.querySelector('.closeAreaKyzButton').textContent = '='
    }
}

function closeSizeKyzFromDB() {
    setTimeout(() => {
        if (area.classList.contains('openAreaKyz')) {
            area.classList.add('closeAreaKyz');
            area.classList.remove('openAreaKyz');
            document.querySelector('.areaforSizeAndModelKyz').style.display = 'none'
            document.querySelector('.closeAreaKyzButton').textContent = ''
        }
    }, 10);
}

document.getElementById('deliveryForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    const deliveryId = document.getElementById('deliveryId').value;

    try {
        const response = await fetch(`/getdeliveryinfo/${deliveryId}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const deliveryInfo = await response.json();
        displayDeliveryInfo(deliveryInfo);
    } catch (error) {
        console.error('Error:', error);
        displayError('Не удалось найти информацию о поставке, попробуйте еще раз.');
    }
});

function displayDeliveryInfo(deliveryInfo) {
    const detailsDiv = document.getElementById('deliveryDetails');

    // Распарсите строку JSON, если delivery это строка
    let deliveryData = [];
    try {
        deliveryData = JSON.parse(deliveryInfo.delivery);
    } catch (e) {
        console.error('Error parsing delivery JSON:', e);
        displayError('Failed to parse delivery data.');
        return;
    }

    // Обработка каждого элемента в deliveryData
    const deliveriesHtml = deliveryData.map(delivery => {
        const orderList = Array.isArray(delivery.orderList) ? delivery.orderList : [];

        // Создание таблицы для заказов
        const ordersHtml = orderList.map(order => `
        <tr>
          <td>${order.orderNumber}</td>
          <td>${order.orderArtikul}</td>
          <td style='font-weight: 400'>${order.orderSize}</td>
          <td style='font-weight: 400'>${order.orderKyz}</td>
          <td style='font-weight: 400'>${order.orderCreateAt}</td>
          <td style='font-weight: 400'>${order.orderSkus}</td>
          <td style='font-weight: 400'>${order.orderNmId}</td>
          <td style='font-weight: 400'>${order.color}</td>
          <td style='font-weight: 400'>${order.stickerAreaorderId}</td>
          <td style='font-weight: 400'>${order.stickerAreapartA}</td>
          <td style='font-weight: 400'>${order.stickerAreapartB}</td>
        </tr>
      `).join('');

        return `
        <div class="card mb-3">
          <div class="card-header">
            Короб №: ${delivery.boxNumber || 'N/A'}
          </div>
          <div class="card-body">
            <table class="table table-striped">
              <thead>
                <tr>
                  <th>№ модели</th>
                  <th>Артикул</th>
                  <th>Размер</th>
                  <th>КИЗ</th>
                  <th>Время оформления</th>
                  <th>Баркод</th>
                  <th>Номер заказа</th>
                  <th>Цвет</th>
                  <th>Стикер (ID заказа)</th>
                  <th>Стикер (Часть А)</th>
                  <th>Стикер (Часть Б)</th>
                </tr>
              </thead>
              <tbody>
                ${ordersHtml}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }).join('');

    const htmlContent = `
      <h2>Информация о поставке</h2>
      <div class="mb-4">
        <p><strong>Дата:</strong> ${deliveryInfo.date || 'N/A'}</p>
      </div>
      ${deliveriesHtml}
    `;

    detailsDiv.innerHTML = htmlContent;
}

function displayError(message) {
    const detailsDiv = document.getElementById('deliveryDetails');
    detailsDiv.innerHTML = `<p class="error">${message}</p>`;
}

function buttonforCounterBoxAndItems() {
    let boxcountInPanel = 0;
    let boxcountInPanelARM = 0;
    let boxcountInPanelBEST = 0;
    let boxcountInPanelBEST26 = 0;

    let boxescountInPanel = 0;
    let boxescountInPanelARM = 0;
    let boxescountInPanelBEST = 0;
    let boxescountInPanelBEST26 = 0;

    let unknownfile = new Date();
    let a = document.querySelector('.inputForDelivery').value
    let b = document.querySelector('.inputForDelivery').value
    let c = document.querySelector('.inputForDelivery').value

    let prodBrand = statusProgram.brand
    let PreNumberBox;

    document.querySelectorAll('.sectionForAcceptDeliveryold .mainbox').forEach(box => {
        let date = unknownfile.getDate()
        let ul = box.querySelector('ul');
        let items = Array.from(ul.querySelectorAll('li'));
        let boxHeader = box.querySelector('.p_article_put_order_in_box')
        if (box.classList.contains('Armbest')) {
            PreNumberBox = '1'
            if (date < 10) {
                date = '0' + date;
            }
            if (a < 10) {
                boxHeader.textContent = `${date}` + '/' + `${PreNumberBox}` + '0' + a;
            }
            else {
                boxHeader.textContent = `${date}` + '/' + `${PreNumberBox}` + a;
            }
            a++
            boxescountInPanelARM++;
        }
        else if (box.classList.contains('Best26')) {
            PreNumberBox = '5'
            if (date < 10) {
                date = '0' + date;
            }
            if (b < 10) {
                boxHeader.textContent = `${date}` + '/' + `${PreNumberBox}` + '0' + b;
            }
            else {
                boxHeader.textContent = `${date}` + '/' + `${PreNumberBox}` + b;
            }
            b++
            boxescountInPanelBEST26++;

        }
        else if (box.classList.contains('Bestshoes')) {
            PreNumberBox = '3'
            if (date < 10) {
                date = '0' + date;
            }
            if (c < 10) {
                boxHeader.textContent = `${date}` + '/' + `${PreNumberBox}` + '0' + c;
            }
            else {
                boxHeader.textContent = `${date}` + '/' + `${PreNumberBox}` + c;
            }
            c++
            boxescountInPanelBEST++;
        }
        console.log(PreNumberBox)

        // Группировка элементов по Article
        let groups = items.reduce((acc, item) => {
            let article = item.querySelector('.headerLabelForModel').textContent;
            if (box.classList.contains('Armbest') && box.classList.contains(statusProgram.NameDelivery)) {
                boxcountInPanelARM++
            }
            else if (box.classList.contains('Best26') && box.classList.contains(statusProgram.NameDelivery)) {
                boxcountInPanelBEST26++
            }
            else if (box.classList.contains('Bestshoes') && box.classList.contains(statusProgram.NameDelivery)) {
                boxcountInPanelBEST++
            }
            if (!acc[article]) {
                acc[article] = [];
            }
            acc[article].push(item);
            return acc;
        }, {});

        // Сортировка каждой группы по Size и добавление в ul
        ul.innerHTML = ''; // Очищаем ul перед добавлением элементов
        Object.keys(groups).forEach(article => {
            groups[article].sort((a, b) => {
                let sizeA = parseFloat(a.querySelector('.Size').textContent);
                let sizeB = parseFloat(b.querySelector('.Size').textContent);
                return sizeA - sizeB;
            }).forEach(item => {
                ul.appendChild(item);
            });
        });
    });
    if (statusProgram.brand == 'Armbest') {
        document.getElementById('countBoxNumber').textContent = boxcountInPanelARM
        document.getElementById('countBoxNumb').textContent = boxescountInPanelARM
    }
    else if (statusProgram.brand == 'Best26') {
        document.getElementById('countBoxNumber').textContent = boxcountInPanelBEST26
        document.getElementById('countBoxNumb').textContent = boxescountInPanelBEST26
    }
    else if (statusProgram.brand == 'Bestshoes') {
        document.getElementById('countBoxNumber').textContent = boxcountInPanelBEST
        document.getElementById('countBoxNumb').textContent = boxescountInPanelBEST
    }
}