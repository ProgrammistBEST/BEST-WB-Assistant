let statusProgramSS = localStorage.getItem('statusProgram');
let statusProgramLoad = JSON.parse(statusProgramSS);

function AddNewBoxButton() {
    let boxforContainer = document.querySelector('.sectionForAcceptDeliverynew')
    const list = document.createElement('ul');
    const container = document.createElement('div');
    container.className = 'box mainbox Boxtransferredfordelivery';
    container.id = 'fakeBoxAdding';
    container.className += ' thirdStock';
    const StockArea = document.createElement('p');
    StockArea.className = 'StockArea';
    StockArea.textContent = "Третий";

    container.classList.add(statusProgram.NameDelivery);
    container.classList.add(statusProgram.brand);

    if (statusProgram.brand == 'Armbest') {
        container.style.backgroundColor = '#8dddbb'
    }
    else if (statusProgram.brand == 'Best26') {
        container.style.backgroundColor = 'rgb(169 169 220)'
    }
    else if (statusProgram.brand == 'BestShoes') {
        container.style.backgroundColor = '#C4E5FF'
    }
    else if (statusProgram.brand == 'Arm2') {
        container.style.backgroundColor = '#FCB996'
    }

    // container.id = article;
    boxforContainer.appendChild(container)

    const header = document.createElement('h3');
    header.className = 'p_article_put_order_in_box';

    let unknownfile = new Date();
    let date = unknownfile.getDate()
    let a = document.querySelector('.inputForDelivery').value
    let prodBrand = statusProgram.brand
    let PreNumberBox;

    if (prodBrand == 'Armbest') {
        PreNumberBox = '1'
    }
    else if (prodBrand == 'Best26') {
        PreNumberBox = '5'
    }
    else if (prodBrand == 'BestShoes') {
        PreNumberBox = '3'
    }
    else if (prodBrand == 'Arm2') {
        PreNumberBox = '2'
    }
    if (date < 10) {
        date = '0' + date;
    }

    if (a < 10) {
        header.textContent = `${date}` + '/' + `${PreNumberBox}` + '0' + a;
    }
    else {
        header.textContent = `${date}` + '/' + `${PreNumberBox}` + a;
    }

    container.appendChild(header);

    container.appendChild(list)

    const deletBox = document.createElement('div');
    deletBox.className = 'deleteBox';

    const deleteButton = document.createElement('button');
    deleteButton.className = 'deleteBoxButton';
    deleteButton.textContent = 'X';
    deletBox.appendChild(deleteButton);
    container.appendChild(deletBox);
    deletBox.addEventListener('click', function () {
        deleteBox(deletBox);
    });

    list.style.height = '100%';
    container.addEventListener('dragover', dragOverHandler);

    const maxItemsinbox = document.createElement('p');
    maxItemsinbox.className = 'headerLabelForModel maxItemsinbox';
    maxItemsinbox.textContent = 10

    const Itemsinbox = document.createElement('p');
    Itemsinbox.className = 'headerLabelForModel Itemsinbox';
    Itemsinbox.textContent = 0;

    container.appendChild(Itemsinbox);
    container.appendChild(maxItemsinbox);
    container.appendChild(StockArea);

    container.addEventListener('dragover', dragOverHandler);
    container.addEventListener('drop', drop);
    container.addEventListener('dragstart', handleDragStart);
    container.addEventListener('dragend', handleDragEnd);
}

function createNewBox(article, maxItems, stockClass) {
    const container = document.createElement('div');
    container.className = 'box mainbox Boxtransferredfordelivery';
    container.classList.add(stockClass);
    container.classList.add(statusProgram.NameDelivery);
    container.classList.add(statusProgram.brand);

    // Установка цвета фона в зависимости от бренда
    if (statusProgram.brand == 'Armbest') {
        container.style.backgroundColor = '#8dddbb';
    } else if (statusProgram.brand == 'Best26') {
        container.style.backgroundColor = 'rgb(169 169 220)';
    } else if (statusProgram.brand == 'BestShoes') {
        container.style.backgroundColor = '#C4E5FF';
    } else if (statusProgram.brand == 'Arm2') {
        container.style.backgroundColor = '#FCB996';
    }

    // Создание заголовка коробки
    const header = document.createElement('h3');
    header.className = 'p_article_put_order_in_box';
    header.textContent = article;
    container.appendChild(header);

    // Кнопка удаления
    const deletBox = document.createElement('div');
    deletBox.className = 'deleteBox';
    const deleteButton = document.createElement('button');
    deleteButton.className = 'deleteBoxButton';
    deleteButton.textContent = 'X';
    deletBox.appendChild(deleteButton);
    container.appendChild(deletBox);
    deletBox.addEventListener('click', function () {
        deleteBox(deletBox);
    });

    // Создание списка <ul> для товаров
    const list = document.createElement('ul');
    container.appendChild(list);
    list.style = 'height: 100%;'

    // Добавление счетчиков
    const Itemsinbox = document.createElement('p');
    Itemsinbox.className = 'headerLabelForModel Itemsinbox';
    Itemsinbox.textContent = 0;

    const maxItemsinbox = document.createElement('p');
    maxItemsinbox.className = 'headerLabelForModel maxItemsinbox';
    maxItemsinbox.textContent = maxItems;

    const StockArea = document.createElement('p');
    StockArea.className = 'StockArea';
    StockArea.textContent = stockClass === 'first' ? 'Первый' : stockClass === 'second' ? 'Второй' : 'Третий';

    container.appendChild(Itemsinbox);
    container.appendChild(maxItemsinbox);
    container.appendChild(StockArea);

    // Добавление обработчиков событий
    container.addEventListener('dragover', dragOverHandler);
    container.addEventListener('drop', drop);
    container.addEventListener('dragstart', handleDragStart);
    container.addEventListener('dragend', handleDragEnd);

    return container;
}

function SendForDelivery() {

    let boxcountInPanel = 0;

    if (statusProgram.models != 'yes' || statusProgram.orders != 'yes') {
        document.getElementById('success-message').style.display = 'flex'
        setTimeout(() => {
            document.getElementById('success-message').style.display = 'flex'
            document.getElementById('success-message').style.opacity = 1
            document.querySelector('.text-message').textContent = 'Пожалуйста, подождите немного. Идет загрузка заказов или моделей.'
            setTimeout(() => {
                document.querySelector('.message').style.transform = "translate(220px)"
                document.getElementById('success-message').style.opacity = 0
                setTimeout(() => {
                    document.getElementById('success-message').style.display = 'none'
                    document.querySelector('.message').style.transform = "translate(0px)"
                }, 1000);
            }, 2000);
        }, 1);
        return
    }

    if (statusProgram.changeMod != 'no') {
        document.getElementById('success-message').style.display = 'flex'
        setTimeout(() => {
            document.getElementById('success-message').style.display = 'flex'
            document.getElementById('success-message').style.opacity = 1
            document.querySelector('.text-message').textContent = 'Выключите режим редактирования!'
            setTimeout(() => {
                document.querySelector('.message').style.transform = "translate(220px)"
                document.getElementById('success-message').style.opacity = 0
                setTimeout(() => {
                    document.getElementById('success-message').style.display = 'none'
                    document.querySelector('.message').style.transform = "translate(0px)"
                }, 1000);
            }, 2000);
        }, 1);
        return
    }

    document.getElementById('NavNewOrders').style.backgroundColor = ''
    document.getElementById('NavDelivery').style.backgroundColor = 'lightgrey'
    document.getElementById('sectionForAcceptDelivery').style.display = 'flex'
    document.getElementById('OrdersList').style.display = 'none'
    document.querySelectorAll('.listOrders .mainbox').forEach(box => {
        box.classList.add('Boxtransferredfordelivery')
        const liElements = box.querySelectorAll('ul > li');
        liElements.forEach(li => {
            boxcountInPanel++
            li.classList.add('transferredfordelivery')
            let article = li.querySelector('h5.headerLabelForModel')
            allItems.forEach(model => {
                if (model.vendorCode == article.textContent) {
                    model.characteristics.forEach(char => {
                        if (char.name == 'Цвет') {
                            li.querySelector('.colorArea').textContent = char.value[0]
                            if (li.querySelector('.colorArea').textContent == 'черный кварц') {
                                li.querySelector('.colorArea').textContent = 'черный'
                            }
                            article.textContent = article.textContent.replace(/[.]/g, '');
                        }
                    })
                }
            })
        });
        document.querySelector('.sectionForAcceptDeliverynew').appendChild(box)
    })

    document.getElementById('countBoxNumber').textContent = boxcountInPanel
    document.getElementById('countBoxNumb').textContent = 0

    let firstBoxMerge;
    let secondBoxMerge;
    let arrayMerged = [];

    document.querySelectorAll('.sectionForAcceptDeliverynew .mainbox').forEach(box => {

        let currentItems = parseInt(box.querySelector('.Itemsinbox').textContent);
        let maxItems = parseInt(box.querySelector('.maxItemsinbox').textContent);
        let article = box.querySelector('.headerLabelForModel').textContent;
        let firststockClass;

        if (currentItems == maxItems && !arrayMerged.includes(box)) {
            arrayMerged.push(box)
        }

        if (arrayMerged.includes(box)) {
            return;
        }

        if (box.classList.contains('firstStock')) {
            firststockClass = 'first';
        } else if (box.classList.contains('secondStock')) {
            firststockClass = 'second';
        } else if (box.classList.contains('thirdStock')) {
            firststockClass = 'third';
        } else {
            console.error('Неизвестный класс склада:', box);
            return;
        }
    
        if (currentItems > maxItems) {
            let excessItems = currentItems - maxItems;
        
            while (excessItems > 0) {
        
                // Создаем новую коробку
                const newBox = createNewBox(article, maxItems, 'thirdStock');
        
                // Определяем, сколько товаров нужно переместить
                const itemsToMoveCount = Math.min(excessItems, maxItems);
                const allItemsInBox = Array.from(box.querySelectorAll('ul li'));
                const itemsToMove = allItemsInBox.slice(-itemsToMoveCount);
        
                if (itemsToMove.length === 0) {
                    console.error(`[ERROR] Не удалось выбрать товары для перемещения. Прерываем цикл.`);
                    break;
                }
        
                // Перемещаем товары в новую коробку
                const newUl = newBox.querySelector('ul');
                itemsToMove.forEach(item => {
                    newUl.appendChild(item);
                });
        
                // Обновляем данные
                excessItems -= itemsToMove.length;
                currentItems -= itemsToMove.length; // Уменьшаем текущее количество товаров в исходной коробке
                box.querySelector('.Itemsinbox').textContent = currentItems;
                newBox.querySelector('.Itemsinbox').textContent = itemsToMove.length;
        
                // Добавляем новую коробку в DOM
                document.querySelector('.sectionForAcceptDeliverynew').appendChild(newBox);
            }
        }
        if (currentItems != maxItems) {
            firstBoxMerge = box;

            document.querySelectorAll('.sectionForAcceptDeliverynew .mainbox').forEach(nextBox => {
                let nextCurrentItems = parseInt(nextBox.querySelector('.Itemsinbox').textContent);
                let nextMaxItems = parseInt(nextBox.querySelector('.maxItemsinbox').textContent);
                let freeSpaceFirst = maxItems - currentItems;
                let freeSpaceSecond = nextMaxItems - nextCurrentItems;
                let secondstockClass;

                if (nextCurrentItems == nextMaxItems && !arrayMerged.includes(nextBox)) {
                    arrayMerged.push(nextBox)
                }

                if (arrayMerged.includes(nextBox)) {
                    return;
                }

                if (nextBox.classList.contains('firstStock')) {
                    secondstockClass = 'first'
                }
                else if (nextBox.classList.contains('secondStock')) {
                    secondstockClass = 'second'
                }
                else if (nextBox.classList.contains('thirdStock')) {
                    secondstockClass = 'third'
                }
                if (nextCurrentItems < nextMaxItems &&
                    nextBox !== box &&
                    nextMaxItems == maxItems &&
                    currentItems + nextCurrentItems <= maxItems &&
                    freeSpaceSecond > 0 &&
                    freeSpaceFirst >= freeSpaceSecond &&
                    !arrayMerged.includes(nextBox) &&
                    firststockClass == secondstockClass ||
                    nextMaxItems == maxItems &&
                    nextCurrentItems == nextMaxItems &&
                    nextBox !== box &&
                    !arrayMerged.includes(nextBox) &&
                    currentItems + nextCurrentItems <= maxItems &&
                    firststockClass == secondstockClass) {
                    secondBoxMerge = nextBox;

                    // Перемещаем элементы ul из secondBoxMerge в firstBoxMerge
                    let firstBoxUl = firstBoxMerge.querySelector('ul');
                    let secondBoxUlItems = secondBoxMerge.querySelectorAll('ul .bpxelem');

                    secondBoxUlItems.forEach(item => {
                        firstBoxUl.appendChild(item);
                    });

                    let totalItems = currentItems + nextCurrentItems;
                    let updatedFirstBoxItems = totalItems;
                    let updatedSecondBoxItems = 0;

                    firstBoxMerge.querySelector('.Itemsinbox').textContent = updatedFirstBoxItems;
                    secondBoxMerge.querySelector('.Itemsinbox').textContent = updatedSecondBoxItems;

                    currentItems = updatedFirstBoxItems
                    nextCurrentItems = updatedSecondBoxItems

                    if (currentItems == maxItems) {
                        return;
                    }
                }
            });
        }
    });

    const boxes = Array.from(document.querySelectorAll('.sectionForAcceptDeliverynew .mainbox'));

    // Преобразуем каждый элемент в объект с данными для удобства обработки
    const boxData = boxes.map(box => {
        return {
            element: box,
            currentItems: parseInt(box.querySelector('.Itemsinbox').textContent),
            maxItems: parseInt(box.querySelector('.maxItemsinbox').textContent),
            freeSpace: parseInt(box.querySelector('.maxItemsinbox').textContent) - parseInt(box.querySelector('.Itemsinbox').textContent),
            class: box.classList.contains('firstStock') ? 'first' :
                box.classList.contains('secondStock') ? 'second' :
                    box.classList.contains('thirdStock') ? 'third' : ''
        };
    });

    boxData.forEach(sourceBox => {
        if (sourceBox.currentItems > sourceBox.maxItems) {
            let excessItems = sourceBox.currentItems - sourceBox.maxItems;

            boxData.forEach(targetBox => {
                if (sourceBox !== targetBox && targetBox.freeSpace > 0 && sourceBox.class === targetBox.class && sourceBox.maxItems == targetBox.maxItems) {
                    let transferAmount = Math.min(excessItems, targetBox.freeSpace);

                    // Перемещение элементов
                    const itemsToMove = Array.from(sourceBox.element.querySelectorAll('ul li')).slice(0, transferAmount);

                    itemsToMove.forEach(item => {
                        targetBox.element.querySelector('ul').appendChild(item);
                    });

                    // Обновление данных
                    sourceBox.currentItems -= transferAmount;
                    targetBox.currentItems += transferAmount;
                    sourceBox.freeSpace = sourceBox.maxItems - sourceBox.currentItems;
                    targetBox.freeSpace = targetBox.maxItems - targetBox.currentItems;

                    sourceBox.element.querySelector('.Itemsinbox').textContent = sourceBox.currentItems;
                    targetBox.element.querySelector('.Itemsinbox').textContent = targetBox.currentItems;

                    // Обновляем оставшееся количество элементов, которые нужно переместить
                    excessItems -= transferAmount;

                    // Если больше нет лишних элементов для перемещения, прерываем цикл
                    if (excessItems <= 0) return;
                }
            });
        }
    });


    document.querySelectorAll('.sectionForAcceptDeliverynew .mainbox').forEach(box => {
        if (box.querySelector('.Itemsinbox').textContent == 0) {
            box.remove()
        }
    })

    boxcountInPanel = 0;
    let boxescountInPanel = 0;

    let unknownfile = new Date();
    let date = unknownfile.getDate()
    let a = document.querySelector('.inputForDelivery').value
    let prodBrand = statusProgram.brand
    let PreNumberBox;

    if (prodBrand == 'Armbest') {
        PreNumberBox = '1'
    }
    else if (prodBrand == 'Best26') {
        PreNumberBox = '5'
    }
    else if (prodBrand == 'BestShoes') {
        PreNumberBox = '3'
    }
    else if (prodBrand == 'Arm2') {
        PreNumberBox = '2'
    }
    if (date < 10) {
        date = '0' + date;
    }

    document.querySelectorAll('.sectionForAcceptDeliverynew .mainbox').forEach(box => {
        if (a < 10) {
            box.querySelector('.p_article_put_order_in_box').textContent = `${date}` + '/' + `${PreNumberBox}` + '0' + a;
        }
        else {
            box.querySelector('.p_article_put_order_in_box').textContent = `${date}` + '/' + `${PreNumberBox}` + a;
        }
        if (a == 99) {
            a = -1
            PreNumberBox++
        }
        a++;
        boxescountInPanel++;
        box.querySelectorAll('ul li').forEach(item => {
            boxcountInPanel++;
        })
    });

    document.getElementById('countBoxNumber').textContent = boxcountInPanel
    document.getElementById('countBoxNumb').textContent = boxescountInPanel
    document.getElementById('updateBDButton').style.display = 'none'

    document.querySelectorAll('.sectionForAcceptDeliverynew .mainbox').forEach(box => {
        boxescountInPanel++;
        let ul = box.querySelector('ul');
        let items = Array.from(ul.querySelectorAll('li'));

        // Группировка элементов по Article
        let groups = items.reduce((acc, item) => {
            let article = item.querySelector('.headerLabelForModel').textContent;
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
}

function openDeliveryWindow() {
    document.getElementById('updateBDButton').style.display = 'none'
    document.querySelector('.boxforinfoDB').style.display = 'none'
    document.getElementById('NavNewOrders').style.backgroundColor = ''
    document.getElementById('NavDelivery').style.backgroundColor = 'lightgrey'
    document.getElementById('OrdersList').style.display = 'none'
    document.getElementById('sectionForAcceptDelivery').style.display = 'flex'

}

document.querySelectorAll('.burger').forEach(burger => {
    burger.addEventListener('click', function () {
        burger.classList.toggle('active');
        if (burger.classList.contains('active')) {
            document.querySelector('aside').style.width = '180px'
            document.getElementById('infoAboutCountBoxes').style.transition = '0.2s'
            setTimeout(() => {
                document.querySelector('.SectionForBar').style.opacity = 1
                document.querySelector('.GifForDelivery').classList.remove('off')
                document.querySelector('.BoxforchangeVariantForZIP').style.opacity = 1
                document.querySelector('aside p').style.opacity = 1
                document.getElementById('infoAboutCountBoxes').style.opacity = 1
                document.querySelector('.AddingKyzFromUsersFile').style.display = ''
                document.querySelectorAll('.buttonInAsideForPost').forEach(button => {
                    button.style.display = '';
                    button.style.opacity = 1;
                })
                document.querySelector('.BoxforchangeVariantForZIP').style.display = 'grid'
            }, 200);
        }
        else {
            document.querySelector('.GifForDelivery').classList.add('off')
            document.getElementById('infoAboutCountBoxes').style.transition = '0s'
            document.querySelector('.BoxforchangeVariantForZIP').style.opacity = 0

            document.querySelector('aside p').style.opacity = 0
            document.querySelector('.SectionForBar').style.opacity = 0
            document.getElementById('infoAboutCountBoxes').style.opacity = 0
            document.querySelector('.AddingKyzFromUsersFile').style.display = 'none'
            document.querySelectorAll('.buttonInAsideForPost').forEach(button => {
                button.style.display = 'none';
                button.style.opacity = 0;
            })
            setTimeout(() => {
                document.querySelector('aside').style.width = '0px'
                document.querySelector('.BoxforchangeVariantForZIP').style.display = 'none'
            }, 10);
        }
    });
})

function PressButtonDeliveryPost() {
    if (document.querySelector('.GifForDelivery').classList.contains('off')) {
        document.querySelector('.SectionForBar').style.opacity = 1
        document.querySelector('.GifForDelivery').classList.remove('off')
        document.querySelector('aside').style.width = '180px'
        document.querySelector('aside p').style.opacity = 1
        document.querySelectorAll('.buttonInAsideForPost').forEach(button => {
            button.style.display = '';
            button.style.opacity = 1;
        })
    }
    else {
        document.querySelector('.GifForDelivery').classList.add('off')
        document.querySelector('aside').style.width = '0px'
        document.querySelector('aside p').style.opacity = 0
        document.querySelector('.SectionForBar').style.opacity = 0
        document.querySelectorAll('.buttonInAsideForPost').forEach(button => {
            button.style.display = 'none';
            button.style.opacity = 0;
        })
    }
}

// Функция для перемещения элементов между складами
function moveBoxesToStocks() {
    document.querySelectorAll('.sectionForAcceptDeliverynew .Boxtransferredfordelivery').forEach((box) => {
        if (box.closest('article')) return;

        const stockSelectors = {
            Утро: '.morningstockes',
            Вечер: '.eveningstockes',
            Остатки: '.leftoversstockes',
        };

        Object.entries(stockSelectors).forEach(([time, selector]) => {
            if (box.classList.contains(time)) {
                ['firstStock', 'secondStock', 'thirdStock'].forEach((stock) => {
                    if (box.classList.contains(stock)) {
                        document.querySelector(`${selector} .${stock}`).appendChild(box);
                    }
                });
            }
        });
    });
}

// Функция для проверки корректности данных
function validateBoxes() {
    document.querySelectorAll('.stockes .Boxtransferredfordelivery .transferredfordelivery').forEach((box) => {
        const fields = [
            { selector: '.StockAreaHide', message: 'Не указан склад' },
            { selector: 'h5.headerLabelForModel', message: 'Отсутствует артикул' },
            { selector: 'p.Size', message: 'Отсутствует размер' },
            { selector: '.stickerArea', message: 'Отсутствует стикер' },
            { selector: '.kyzArea', message: 'Отсутствует КИЗ' },
            { selector: '.createAt', message: 'Отсутствует время создания' },
            { selector: '.colorArea', message: 'Отсутствует цвет' },
            { selector: '.skusArea', message: 'Отсутствует баркод' },
            { selector: '.nmId', message: 'Отсутствует номер заказа' },
        ];

        fields.forEach(({ selector, message }) => {
            if (!box.querySelector(selector)?.textContent.trim()) {
                alert(`Ошибка с Артикулом №${box.querySelector('h5.headerLabelForModel')?.textContent}: ${message}`);
                box.style.backgroundColor = 'red';
            }
        });
    });
}

// Функция для получения данных о моделях
function getModelData(brand) {
    const modelMap = {}; // Хранилище для группировки данных

    document.querySelectorAll('.sectionForAcceptDeliverynew .mainbox li').forEach((element, index) => {
        const modelElement = element.querySelector('h5.headerLabelForModel');
        const sizeElement = element.querySelector('.Size');

        if (!modelElement || !sizeElement) {
            console.error(`[getModelData] Отсутствует модель или размер для элемента ${index}:`, element);
            return;
        }

        const model = brand === 'Best26' || brand === 'Arm2'
            ? modelElement.textContent.replace(/[.]/g, '').trim()
            : 'ЭВА';
        const size = sizeElement.textContent.trim();

        const key = `${model}-${size}`; // Уникальный ключ для модели и размера

        // Группируем данные
        if (!modelMap[key]) {
            modelMap[key] = { model, size, count: 1 };
        } else {
            modelMap[key].count += 1; // Увеличиваем счетчик
        }
    });

    const result = Object.values(modelMap);

    return result;
}

// Функция для выполнения HTTP-запросов
async function fetchKyzElements(modelInfo, brand) {
    try {
        const { model, size, count } = modelInfo;

        if (!size || !brand || !model || !count) {
            console.error('[fetchKyzElements] Некорректные параметры запроса:', { size, brand, model, count });
            return { size, model, kyzElements: [] };
        }

        const url = `/kyz?size=${size}&brand=${brand}&model=${model}&count=${count}`;

        const response = await fetch(url, { method: 'GET' });

        if (!response.ok) {
            console.error(`[fetchKyzElements] Ошибка сети: ${response.status}. URL: ${url}`);
            throw new Error(`Ошибка сети: ${response.status}`);
        }

        const data = await response.json();

        return {
            size,
            model,
            kyzElements: data.data.map((item) => ({
                Crypto: item.Crypto,
                id: item.id,
                tableName: item.tableName,
                Model: item.Model,
                Size: item.Size,
            })),
        };
    } catch (error) {
        console.error('[fetchKyzElements] Ошибка при получении КИЗов:', error);
        return { size: modelInfo.size, model: modelInfo.model, kyzElements: [] };
    }
}

// Общая функция для обновления DOM
function updateDOM(results, selectorFactory, updateLogic) {
    results.forEach((result, index) => {

        // Получаем селектор на основе model + size
        const selector = selectorFactory(result);

        // Ищем все элементы по этому селектору
        const elements = document.querySelectorAll(selector);

        // Применяем логику обновления к каждому найденному элементу
        elements.forEach((element, idx) => {
            const data = result.kyzElements[idx];
        });
    });
}

// Общая функция для обновления DOM
function updateDOMForOther(results, selectorFactory, updateLogic) {
    results.forEach((result) => {
        const elements = document.querySelectorAll(selectorFactory(result));
        elements.forEach((element, index) => {
            const data = result.kyzElements[index];
            if (data && updateLogic(element, data)) {
                // Если логика обновления успешна, продолжаем
                return;
            }
        });
    });
}

// Функция для обновления DOM для бренда Best26
function updateDOMForBest26(results) {
    updateDOM(
        results,
        // Строим селектор сразу по article-numb и data-size
        ({ model, size }) => `.sectionForAcceptDeliverynew li[article-numb="${model}"][data-size="${size}"]`,
        (element, data) => {
            // Находим .kyzArea внутри <li>
            const kyzArea = element.querySelector('.kyzArea');

            if (!kyzArea) {
                console.warn("Элемент .kyzArea не найден в товаре:", element);
                return false;
            }

            // Применяем КИЗ
            kyzArea.textContent = data.Crypto;
            kyzArea.setAttribute('data-id', data.id);
            kyzArea.setAttribute('data-table-name', data.tableName);
            return true;
        }
    );
}

// Функция для обновления DOM для других брендов
function updateDOMForOtherBrands(results) {
    updateDOMForOther(
        results,
        ({ size }) => `.sectionForAcceptDeliverynew .kyzArea[data-size="${size}"]`,
        (element, data) => {
            element.textContent = data.Crypto;

            // Сохраняем tableName и id в data-атрибутах
            element.setAttribute('data-id', data.id);
            element.setAttribute('data-table-name', data.tableName);

            const fullKyzElement = element.parentElement.querySelector('.FullkyzArea');
            if (fullKyzElement) {
                fullKyzElement.textContent = data.fullline;
                return true;
            }
            return false;
        }
    );
}

// Главная функция
async function addKyzForModelsToDilivery() {
    const brand = statusProgram.brand;

    const models = getModelData(brand);
    console.log('Данные моделей:', models);

    const fetchPromises = models.map((modelInfo) =>
        fetchKyzElements(modelInfo, brand)
    );
    const results = await Promise.all(fetchPromises);

    console.log('Результаты запросов:', results);

    if (brand === 'Best26' || brand === 'Arm2') {
        updateDOMForBest26(results);
    } else {
        updateDOMForOtherBrands(results);
    }

    moveBoxesToStocks();
    validateBoxes();
}

document.getElementById('approvedelivery').addEventListener("click", addKyzForModelsToDilivery);