let statusProgramSS = localStorage.getItem('statusProgram');
let statusProgramLoad = JSON.parse(statusProgramSS);

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
        } else if (statusProgramLoadApp.brand === 'Bestshoes') {
            token = await getApiById(6, 'Bestshoes', 'WB');
        }
    } catch (error) {
        console.error('Ошибка при обработке токена:', error.message);
    }
})();


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
    else if (statusProgram.brand == 'Bestshoes') {
        container.style.backgroundColor = '#C4E5FF'
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
    else if (prodBrand == 'Bestshoes') {
        PreNumberBox = '3'
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
    maxItemsinbox.textContent = 20

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

function Sendfordelivery() {

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
        let firststockClass;

        if (currentItems == maxItems && !arrayMerged.includes(box)) {
            arrayMerged.push(box)
        }

        if (arrayMerged.includes(box)) {
            return;
        }

        if (box.classList.contains('firstStock')) {
            firststockClass = 'first'
        }
        else if (box.classList.contains('secondStock')) {
            firststockClass = 'second'
        }
        else if (box.classList.contains('thirdStock')) {
            firststockClass = 'third'
        }
        else {
            alert('Что вы мне подсунули?')
            console.log(box)
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
    else if (prodBrand == 'Bestshoes') {
        PreNumberBox = '3'
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

function addKyzForModelsToDilivery() {
    // Получаем размеры из элементов с классом 'sizeElement'

    const brand = statusProgram.brand;
    let Models = [];

    document.querySelectorAll('.sectionForAcceptDeliverynew .mainbox li').forEach((element, index) => {
        const modelInfo = {};

        let modelElement = element.querySelector('h5.headerLabelForModel');
        let sizeElement = element.querySelector('.Size');

        if (modelElement && sizeElement) {
            modelElement.textContent.replace(/[.чЧ]/g, '');
            modelInfo.model = modelElement.textContent;
            modelInfo.size = sizeElement.textContent;

            if (brand == 'Best26') {
                modelInfo.model = modelElement.textContent.replace(/[.]/g, '');
            } else {
                modelInfo.model = 'Multimodel'
            }
            Models.push(modelInfo);
        }
    })

    // Создаём массив промисов для всех запросов
    const fetchPromises = Models.map(modelInfo => fetch(`/kyz?Size=${modelInfo.size}&brand=${brand}&Model=${modelInfo.model}`, { method: 'GET' })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка сети: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(data)
            return { size: modelInfo.size, model: modelInfo.model, kyzElements: data.data };
        })
        .catch(error => {
            console.error('Error fetching kyz elements:', error);
            return { size: modelInfo.size, model: modelInfo.model, kyzElements: [] }; // Возвращаем пустой массив в случае ошибки
        })
    );

    // Выполняем все запросы
    Promise.all(fetchPromises).then(results => {
        if (statusProgram.brand == 'Best26') {
            results.forEach(({ model, kyzElements }) => {
                console.log(model, kyzElements)
                // Обновляем элементы на странице
                document.querySelectorAll(`.sectionForAcceptDeliverynew li[article-numb="${model}"]`).forEach((element, index) => {
                    let modelElement = element.querySelector('h5.headerLabelForModel').textContent;
                    let sizeElement = element.querySelector('.Size');
                    if (kyzElements[index] && modelElement && modelElement == kyzElements[index].Model && sizeElement.textContent == kyzElements[index].Size) {
                        element.querySelector('.kyzArea').textContent = kyzElements[index].line;
                        element.querySelector('.FullkyzArea').textContent = kyzElements[index].fullline;
                    }
                });
            });
        } else {
            results.forEach(({ size, kyzElements }) => {
                // Обновляем элементы на странице
                document.querySelectorAll(`.sectionForAcceptDeliverynew .kyzArea[data-size="${size}"]`).forEach((element, index) => {
                    if (kyzElements[index]) {
                        element.textContent = kyzElements[index].line;
                        element.parentElement.querySelector('.FullkyzArea').textContent = kyzElements[index].fullline;
                    }
                });
            });
        }

        document.querySelectorAll('.sectionForAcceptDeliverynew .Boxtransferredfordelivery').forEach(box => {
            if (box.closest('article')) { return; }
            if (box.classList.contains('firstStock') && box.classList.contains('Утро')) {
                document.querySelector('.morningstockes .firstStock').appendChild(box);
            } else if (box.classList.contains('secondStock') && box.classList.contains('Утро')) {
                document.querySelector('.morningstockes .secondStock').appendChild(box);
            } else if (box.classList.contains('thirdStock') && box.classList.contains('Утро')) {
                document.querySelector('.morningstockes .thirdStock').appendChild(box);
            }

            if (box.classList.contains('firstStock') && box.classList.contains('Вечер')) {
                document.querySelector('.eveningstockes .firstStock').appendChild(box);
            } else if (box.classList.contains('secondStock') && box.classList.contains('Вечер')) {
                document.querySelector('.eveningstockes .secondStock').appendChild(box);
            } else if (box.classList.contains('thirdStock') && box.classList.contains('Вечер')) {
                document.querySelector('.eveningstockes .thirdStock').appendChild(box);
            }

            if (box.classList.contains('firstStock') && box.classList.contains('Остатки')) {
                document.querySelector('.leftoversstockes .firstStock').appendChild(box);
            } else if (box.classList.contains('secondStock') && box.classList.contains('Остатки')) {
                document.querySelector('.leftoversstockes .secondStock').appendChild(box);
            } else if (box.classList.contains('thirdStock') && box.classList.contains('Остатки')) {
                document.querySelector('.leftoversstockes .thirdStock').appendChild(box);
            }
        });

        document.querySelectorAll('.stockes .Boxtransferredfordelivery .transferredfordelivery').forEach(box => {
            if (box.querySelector('.StockAreaHide').textContent == '') {
                alert('Ошибка с Артикулом №' + box.querySelector('h5.headerLabelForModel').textContent + " Не указан склад")
                box.style.backgroundColor = 'red'
            }
            if (box.querySelector('h5.headerLabelForModel').textContent == '') {
                alert('Ошибка.' + box.querySelector('h5.headerLabelForModel').textContent + " Отсутствует артикул")
                box.style.backgroundColor = 'red'
            }
            if (box.querySelector('p.Size').textContent == '') {
                alert('Ошибка с Артикулом №' + box.querySelector('h5.headerLabelForModel').textContent + " Отсутствует размер")
                box.style.backgroundColor = 'red'
            }
            if (box.querySelector('.stickerArea').textContent == '') {
                alert('Ошибка с Артикулом №' + box.querySelector('h5.headerLabelForModel').textContent + " Отсутствует стикер")
                box.style.backgroundColor = 'red'
            }
            if (box.querySelector('.kyzArea').textContent == '') {
                alert('Ошибка с Артикулом №' + box.querySelector('h5.headerLabelForModel').textContent + " Отсутствует КИЗ")
                box.style.backgroundColor = 'red'
            }
            if (box.querySelector('.createAt').textContent == '') {
                alert('Ошибка с Артикулом №' + box.querySelector('h5.headerLabelForModel').textContent + " Отсутствует время создания")
                box.style.backgroundColor = 'red'
            }
            if (box.querySelector('.colorArea').textContent == '') {
                alert('Ошибка с Артикулом №' + box.querySelector('h5.headerLabelForModel').textContent + " Отсутствует цвет")
                box.style.backgroundColor = 'red'
            }
            if (box.querySelector('.skusArea').textContent == '') {
                alert('Ошибка с Артикулом №' + box.querySelector('h5.headerLabelForModel').textContent + " Отсутствует баркод")
                box.style.backgroundColor = 'red'
            }
            if (box.querySelector('.nmId').textContent == '') {
                alert('Ошибка с Артикулом №' + box.querySelector('h5.headerLabelForModel').textContent + " Отсутствует номер заказа")
                box.style.backgroundColor = 'red'
            }
        })
    });
}

document.getElementById('approvedelivery').addEventListener("click", addKyzForModelsToDilivery);