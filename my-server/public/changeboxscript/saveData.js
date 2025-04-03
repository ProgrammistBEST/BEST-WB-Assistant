let db;
let showModal;

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('DeliveryDB', 1);

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            // Создание хранилищ данных
            db.createObjectStore('sections', { keyPath: 'name' });
            db.createObjectStore('orders', { keyPath: 'id' });
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve();
        };

        request.onerror = (event) => {
            reject(new Error('Ошибка при открытии базы данных'));
        };
    });
}

function saveData() {
    openDatabase().then(() => {
        const transaction = db.transaction(['sections', 'orders'], 'readwrite');
        const sectionsStore = transaction.objectStore('sections');
        const ordersStore = transaction.objectStore('orders');

        const oldSection = document.querySelector('.sectionForAcceptDeliveryold').innerHTML;
        const newSection = document.querySelector('.sectionForAcceptDeliverynew').innerHTML;
        const leftoverssection = document.getElementById('LeftoversArea').innerHTML;
        const SectionForSaveNameDelivery = statusProgram.NameDelivery;
        let orders = {};

        // Собираем данные о заказах
        document.querySelectorAll('.sectionForAcceptDeliveryold, .sectionForAcceptDeliverynew').forEach(section => {
            section.querySelectorAll('li').forEach((item, index) => {
                const Artorder = item.querySelector('h5').textContent;
                const createAt = item.querySelector('p.createAt').textContent;
                const nmId = item.querySelector('p.nmId').textContent;
                const skusArea = item.querySelector('p.skusArea').textContent;
                orders[index] = {
                    article: Artorder,
                    createdAt: createAt,
                    nmId: nmId,
                    skus: [skusArea]
                };
            });
        });

        // Собираем данные о ЧЗ для продления резервирования
        const cryptoData = [];
        document.querySelectorAll('.sectionForAcceptDeliverynew .Boxtransferredfordelivery').forEach(box => {
            const crypto = box.querySelector('.kyzArea').textContent;
            const size = box.querySelector('.Size').textContent;
            const model = box.querySelector('h5.headerLabelForModel').textContent;
            const brand = statusProgram.brand;
            console.log("Полученные данные для резервирования", crypto, size, model, brand)
            if (crypto && size && model && brand) {
                cryptoData.push({ crypto, size, brand, model });
            }
        });

        // Продляем резервирование ЧЗ на сервере
        fetch('/extendReservation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                crypto: "(01)04630220301432(21)5W=.No*Y_Wp'E",
                size: "47-48",
                brand: "Armbest",
                model: "ЭВА"
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка сети: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Ответ от сервера:", data);
        })
        .catch(error => {
            console.error('Ошибка при продлении резервирования:', error);
        });

        // Ждем завершения всех запросов на продление резервирования
        Promise.all(extendReservationPromises).then(() => {
            console.log('Резервирование успешно продлено для всех ЧЗ.');

            // Сохраняем данные в IndexedDB
            const compressedOldSection = LZString.compress(oldSection);
            const compressedNewSection = LZString.compress(newSection);
            const compressedleftoverssection = LZString.compress(leftoverssection);
            const compressedOrders = LZString.compress(JSON.stringify(orders));
            const VariableSaveNameDelivery = LZString.compress(SectionForSaveNameDelivery);

            sectionsStore.put({ name: 'oldDeliveryData', data: compressedOldSection });
            sectionsStore.put({ name: 'newDeliveryData', data: compressedNewSection });
            sectionsStore.put({ name: 'leftoverssection', data: compressedleftoverssection });
            sectionsStore.put({ name: 'SaveNameDelivery', data: VariableSaveNameDelivery });
            ordersStore.put({ id: 'NewOrders', data: compressedOrders });

            transaction.oncomplete = () => {
                console.log('Данные успешно сохранены.');
                showModal = 'Данные успешно сохранены.';
            };

            transaction.onerror = (event) => {
                console.error('Ошибка при сохранении данных в IndexedDB', event);
                showModal = 'Ошибка при сохранении данных: ' + event;
            };

            // Показываем сообщение об успешном сохранении
            document.getElementById('success-message').style.display = 'flex';

            setTimeout(() => {
                document.querySelector('body').style.overflow = 'hidden';
                let messageText = document.querySelector('.text-message');
                messageText.textContent = showModal;
                document.getElementById('success-message').style.opacity = 1;

                setTimeout(() => {
                    document.querySelector('.message').style.transform = "translate(220px)";
                    document.getElementById('success-message').style.opacity = 0;
                    setTimeout(() => {
                        document.getElementById('success-message').style.display = 'none';
                        document.querySelector('.message').style.transform = "translate(0px)";
                        document.querySelector('body').style.overflow = '';
                    }, 1000);
                }, 2000);
            }, 1);
        }).catch(error => {
            console.error('Не удалось продлить резервирование ЧЗ:', error);
        });
    }).catch((error) => {
        console.error('Ошибка при открытии базы данных:', error);
    });
}

function loadData() {
    openDatabase().then(() => {
        const transaction = db.transaction(['sections', 'orders'], 'readonly');
        const sectionsStore = transaction.objectStore('sections');
        const ordersStore = transaction.objectStore('orders');

        const getOldSection = sectionsStore.get('oldDeliveryData');
        const getNewSection = sectionsStore.get('newDeliveryData');
        const getLeftoverssection = sectionsStore.get('leftoverssection');
        const getSaveNameDelivery = sectionsStore.get('SaveNameDelivery');
        const getOrders = ordersStore.get('NewOrders');

        getOldSection.onsuccess = () => {
            const compressedOldSection = getOldSection.result?.data;
            if (compressedOldSection !== undefined) {
                const oldSection = LZString.decompress(compressedOldSection);
                document.querySelector('.sectionForAcceptDeliveryold').innerHTML = oldSection;
            }
        };

        getNewSection.onsuccess = () => {
            const compressedNewSection = getNewSection.result?.data;
            if (compressedNewSection !== undefined) {
                const newSection = LZString.decompress(compressedNewSection);
                document.querySelector('.sectionForAcceptDeliverynew').innerHTML = newSection;
            }
        };

        getSaveNameDelivery.onsuccess = () => {
            const SaveNameDelivery = getSaveNameDelivery.result?.data;
            if (SaveNameDelivery !== undefined) {
                const SavedNameDelivery = LZString.decompress(SaveNameDelivery);
                statusProgram.NameDelivery = SavedNameDelivery;
                document.querySelector('.infoAboutNameDelivery').textContent = statusProgram.NameDelivery;
            }

            document.querySelectorAll('.deleteBoxButton').forEach(deleteBox => {
                deleteBox.onclick = function() {
                    let element = deleteBox.parentElement.parentElement; // Убедитесь, что это правильно определяет элемент, который нужно удалить
                    if (element) {
                        let confirmMessage = confirm(`Вы действительно хотите удалить коробку №${element.querySelector('h3.p_article_put_order_in_box').textContent}?`);
                        if (confirmMessage) {
                            element.remove();
                        } else {
                            return;
                        }
                    } else {
                        console.error('Parent element not found.');
                    }
                }
            });
        };

        getOrders.onsuccess = () => {
            const compressedOrders = getOrders.result?.data;
            if (compressedOrders !== undefined) {
                const orders = JSON.parse(LZString.decompress(compressedOrders));
                // Обработайте заказы
            }
        };

        getLeftoverssection.onsuccess = () => {
            const compressedLeftoverssection = getLeftoverssection.result?.data;
            if (compressedLeftoverssection !== undefined) {
                const leftoverssection = LZString.decompress(compressedLeftoverssection);
                document.getElementById('LeftoversArea').innerHTML = leftoverssection;
            }
        };

        transaction.onerror = (event) => {
            console.error('Ошибка при загрузке данных из IndexedDB', event);
        };

    }).catch((error) => {
        console.error(error);
    });

    document.querySelector('.sectionForAcceptDeliveryold').querySelectorAll('.bpxelem').forEach(li => {
        li.id += 'saved'
        // li.addEventListener('dragstart', handleDragStart);
        // li.addEventListener('dragend', handleDragEnd);
        // li.draggable = true; // Устанавливаем draggable свойство
        // if (!li.hasDragStartHandler) {
        //     li.addEventListener('dragstart', drag);
        //     li.className += ' NewbpxelemfromDatabase';
        //     li.hasDragStartHandler = true; // Установка флага
        // }
    });

    document.querySelector('.sectionForAcceptDeliverynew').querySelectorAll('.bpxelem').forEach(li => {
        // li.addEventListener('dragstart', handleDragStart);
        // li.addEventListener('dragend', handleDragEnd);
        // li.draggable = true;
        // if (!li.hasDragStartHandler) {
        //     li.addEventListener('dragstart', drag);
        //     li.className += ' NewbpxelemfromDatabase';
        //     li.hasDragStartHandler = true; // Установка флага
        // }
    });

}
function clearData() {
    // Показываем диалоговое окно для подтверждения
    if (confirm('Вы уверены, что хотите удалить все данные?')) {
        openDatabase().then(() => {
            const transaction = db.transaction(['sections', 'orders'], 'readwrite');
            const sectionsStore = transaction.objectStore('sections');
            const ordersStore = transaction.objectStore('orders');
            
            // Очищаем хранилища
            sectionsStore.clear();
            ordersStore.clear();

            transaction.oncomplete = () => {
                console.log('Данные успешно очищены.');
                
                // Очистка содержимого элементов после очистки IndexedDB
                document.querySelectorAll('.sectionForAcceptDeliverynew .mainbox').forEach(box => {
                    box.remove();
                });
                document.querySelectorAll('.sectionForAcceptDeliveryold .mainbox').forEach(box => {
                    box.remove();
                });
            };

            transaction.onerror = (event) => {
                console.error('Ошибка при очистке IndexedDB', event);
            };
        }).catch((error) => {
            console.error(error);
        });
    } else {
        // Если пользователь нажал "Отмена"
        console.log('Операция отменена пользователем.');
    }
}

// Восстановление данных при загрузке страницы
document.addEventListener('DOMContentLoaded', loadData);

// Сохранение данных при клике на кнопку
document.getElementById('DownloadInLocalStorageChanges').addEventListener('click', saveData);

// Удаление данных при клике на кнопку
document.querySelector('.ClearLocalStorage').addEventListener('click', clearData);