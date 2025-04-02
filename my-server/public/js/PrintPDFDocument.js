// const { error } = require("pdf-lib");

let statusProgramPrintPDFDOC = localStorage.getItem('statusProgram');
let statusProgramLoadPrintPDFDOC = JSON.parse(statusProgramPrintPDFDOC);
let date = new Date()
const dateDay = date.getDate();
// const pdfjsLib  = require('./pdfjs/web/pdfjs.js');
const formattedDay = String(dateDay).padStart(2, '0');
let dateNow = getFormattedDateTime();
let textFormessage = document.querySelector('.loadscreenText')
function general_article(code) {
    if (code.startsWith("1-3")) {
        return code.substring(0, 3);
    } else if (code.startsWith("10-2") || code.startsWith("10-3")) {
        return code.substring(0, 4);
    } else if (code.startsWith("402-1")) {
        return code.substring(0, 3);
    } else if (code.length > 7) {
        for (let i = 2; i < 6; i++) {
            if (code.substring(i).startsWith(code.substring(0, i))) {
                return general_article(code.substring(0, i));
            }
        }
    }
    if (code.startsWith("00") && !code.startsWith("007")) { // Джиббитсы
        if (code.startsWith("00МЕД")) {
            return "Джиббитсы/00МЕД";
        } else if (code.startsWith("00ЖЕН")) {
            return "Джиббитсы/00ЖЕН";
        } else if (code.startsWith("00М")) {
            return "Джиббитсы/00М";
        } else if (code.startsWith("00Д")) {
            return "Джиббитсы/00Д";
        }
    }
    return code.split(/\W+/)[0].replace(/[ .\/-]+$/, "");
}

function get_article(code) {
    if (code.startsWith("00") && !code.startsWith("007")) {  // Джиббитсы
        let count;
        if (code.startsWith("00МЕД")) {
            count = code.substring(5);
        } else if (code.startsWith("00ЖЕН")) {
            count = code.substring(5);
        } else if (code.startsWith("00М")) {
            count = code.substring(3);
        } else if (code.startsWith("00Д")) {
            count = code.substring(3);
        }
        if (!count) {
            count = "6";
        }
        return [count.toString()];
    } else if (code.startsWith("1-3")) {
        return [code.substring(0, 3)];
    } else if (code.startsWith("10-2") || code.startsWith("10-3")) {
        return [code.substring(0, 4)];
    } else if (code.startsWith("402-1")) {
        return [code.substring(0, 5)];
    } else if (code.length > 7) {
        for (let i = 2; i < 6; i++) {
            if (code.substring(i).startsWith(code.substring(0, i))) {
                return [code.substring(0, i)];
            }
        }
    }
    code = code.split(/\W+/).filter(part => !/[a-zA-Z]/.test(part)).join('-').replace(/[-/.\\]+$/, "");
    return [code];
}

function kyzUpdateStatus(article, brand, line, dateNow) {
    fetch('/kyzUpdateStatus', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({model: article, brand: brand, line: line, dateNow }),
    })
        .then(response => response.json())
        .catch((error) => {
            console.error('Error:', error);
        });
}

async function finishDocument(choosedVariant) {
    document.getElementById('loadscreen').style.display = 'flex'
    // startGame()
    document.getElementById('loadscreen').style.opacity = 1
    document.querySelector('body').style.overflow = 'hidden';
    statusProgram.loadMod = 'yes'

    console.time('finishDocument')
    const startTime = Date.now();

    document.querySelectorAll('.sectionForAcceptDeliveryold .mainbox').forEach(box => {

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

    let boxlist = [];
    let listforNewExcel = {}
    let countBox = 0;
    let percent = 0;
    let TestNumber = 0
    let actualcountBoxNumber = document.getElementById('countBoxNumber').textContent

    let startA
    let startB

    if (choosedVariant == 1) {
        startA = 0
        startB = 24
    } else if (choosedVariant == 2) {
        startA = 25
        startB = 49
    } else if (choosedVariant == 3) {
        startA = 50
        startB = 74
    } else if (choosedVariant == 4) {
        startA = 75
        startB = 99
    } else if (choosedVariant == 5) {
        startA = 100
        startB = 124
    } else if (choosedVariant == 6) {
        startA = 125
        startB = 149
    }

    document.querySelectorAll('.sectionForAcceptDeliveryold .Boxtransferredfordelivery').forEach((boxItem, i) => {

        if (!boxItem.classList.contains(statusProgram.brand) || !boxItem.classList.contains(statusProgram.NameDelivery)) {
            return;
        }

        TestNumber++

        if (TestNumber < startA || TestNumber > startB) {
            return
        }

        let box = {
            boxNumber: '',
            boxcount: '',
            orderList: []
        };

        box.boxNumber = boxItem.querySelector('h3.p_article_put_order_in_box').innerText;
        box.boxcount = boxItem.querySelector('h3.p_article_put_order_in_box').innerText;

        boxItem.querySelectorAll('ul li.transferredfordelivery').forEach((order, index) => {

            let orderItem = {
                orderNumber: index + 1,
                orderArtikul: order.querySelector('h5.headerLabelForModel').textContent,
                orderSize: order.querySelector('.Size').textContent,
                orderKyz: order.querySelector('.kyzArea').textContent,
                orderCreateAt: order.querySelector('.createAt').textContent,
                orderSkus: order.querySelector('.skusArea').textContent,
                orderNmId: order.querySelector('.nmId').textContent,
                color: order.querySelector('.colorArea').textContent,
                stickerAreaBarcode: order.querySelector('.stickerArea').textContent,
                stickerAreaFile: order.querySelector('.stickerAreaFile').textContent,
                stickerAreaorderId: order.querySelector('.stickerAreaorderId').textContent,
                stickerAreapartA: order.querySelector('.stickerAreapartA').textContent,
                stickerAreapartB: order.querySelector('.stickerAreapartB').textContent,
            }
            let fullKyzArea;
            if (order.querySelector('.FullkyzArea').textContent.length > 50) {
                fullKyzArea = order.querySelector('.FullkyzArea').textContent
            } else {
                fullKyzArea = order.querySelector('.kyzArea').textContent
            }
            let NewNumberStickers = order.querySelector('.stickerAreapartA').textContent.toString() + order.querySelector('.stickerAreapartB').textContent.toString()
            box.orderList.push(orderItem)
            listforNewExcel[countBox] = { artikle: order.querySelector('h5.headerLabelForModel').textContent, order: order.querySelector('.stickerAreaorderId').textContent, sticker: NewNumberStickers, fullKyz: fullKyzArea };

            if (choosedVariant != 7) {
                order.classList.add('didItem')
            }

            countBox++
        })

        boxlist.push(box)

    })

    // Создание новой книги и листа
    const workbookNew = new ExcelJS.Workbook();
    const worksheetNew = workbookNew.addWorksheet('Sheet1');
    worksheetNew.views = [{ state: 'paged' }];

    // Определение заголовков столбцов
    const columnsNew = [
        { header: 'Артикул', key: 'artikle', width: 20 },
        { header: '№ задания', key: 'numberOrder', width: 14 },
        { header: 'Стикер', key: 'sticker', width: 14 },
        { header: 'КИЗ', key: 'kiz', width: 37 },
    ];

    // Добавление заголовков к листу
    worksheetNew.columns = columnsNew;

    // Добавление стилей к заголовкам
    const headerRowNew = worksheetNew.getRow(1);
    headerRowNew.eachCell((cell) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { bold: true };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFFF' } // Серый цвет
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        };
    });

    // Заполнение данных из объекта
    Object.keys(listforNewExcel).forEach(orderNumber => {
        const dataNew = listforNewExcel[orderNumber];
        let newKYZ = dataNew.fullKyz.replace(/\((01)\)/g, '01').replace(/\((21)\)/g, '21');
        worksheetNew.addRow({
            artikle: dataNew.artikle,
            numberOrder: dataNew.order,
            sticker: dataNew.sticker,
            kiz: newKYZ
        });
    });

    // Создаем EXCEL файл
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    worksheet.views = [{ state: 'paged' }];

    function addHeaders(startRow, boxNumber) {

        const row = worksheet.getRow(startRow);
        columns.forEach((col, index) => {
            const cell = row.getCell(index + 1);
            cell.value = col.header;
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFBFBFBF' } // Серый цвет
            };
            if (col.key === 'BoxNumber') {
                cell.value = boxNumber;
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFEB3B' } // Желтый цвет
                };
                cell.border = {
                    top: { style: 'none' },
                    bottom: { style: 'none' },
                    right: { style: 'none' }
                };
            }
        });
        row.commit();
    }

    let columns = [
        { header: '№', key: 'id', width: 10 },
        { header: '№ задания', key: 'numberOrder', width: 20 },
        { header: 'Бренд', key: 'Brend', width: 10 },
        { header: 'Размер', key: 'Size', width: 10 },
        { header: 'Цвет', key: 'Color', width: 20 },
        { header: 'Артикул продавца', key: 'Articul', width: 15 },
        { header: 'Стикер', key: 'Stiker', width: 20 },
        // { header: 'Наличие', key: 'didItem', width: 10 },
        { header: "", key: 'BoxNumber', width: 10 },
    ];
    let currentRow = 1;

    // Создание ZIP-архива
    const zip1 = new JSZip();

    // Размер страницы и отступы
    const pageHeight = 297; // мм
    const margin = 10; // отступы
    const usableHeight = pageHeight - 2 * margin;
    let orderNumber = 0
    const { PDFDocument } = PDFLib;
    const folderBar = zip1.folder('Баркоды');
    const folderKyz = zip1.folder('Честные знаки и Стикеры');

    await Promise.all(boxlist.map(async boxitem => {

        // columns
        addHeaders(currentRow, boxitem.boxNumber);
        currentRow += 1; // Переход на следующую строку для данных

        let currentPage = 1; // Номер текущей страницы
        let yOffset = margin; // Начальное смещение по вертикали     

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            unit: 'px',
            format: [40, 58],
            orientation: 'landscape',
            compress: true,
        });

        doc.addFont('../fonts/DejaVuSans.ttf', 'DejaVuSans', 'normal');
        doc.addFont('../fonts/DejaVuSansMonoBoldOblique.ttf', 'DejaVuSansBold', 'bold');
        doc.setFont('DejaVuSansBold', 'bold');

        let imagesBarckodePDF = [];
        let itemNumberInBox = 0
        let totalOrders = boxitem.orderList.length
        await Promise.all(boxitem.orderList.map(async (orderItem, orderIndex) => {
            orderIndex++
            itemNumberInBox++
            orderNumber++
            // Создаем новую страницу при необходимости
            if (yOffset + 100 > usableHeight) { // Проверка на окончание места на странице
                doc.addPage(); // Добавляем новую страницу
                currentPage++; // Увеличиваем номер страницы
                yOffset = margin; // Сбрасываем вертикальное смещение
            }

            let article = orderItem.orderArtikul;
            let size = orderItem.orderSize;
            // let kyzArea = orderItem.orderKyz;
            // let skusArea = orderItem.orderSkus;
            // let nmId = orderItem.orderNmId;
            // let kyz = orderItem.orderKyz;
            let color = orderItem.color;
            // let stickerAreaBarcode = orderItem.stickerAreaBarcode
            let stickerAreaFile = orderItem.stickerAreaFile
            // let stickerAreaorderId = orderItem.stickerAreaorderId
            let stickerAreapartA = orderItem.stickerAreapartA
            let stickerAreapartB = orderItem.stickerAreapartB
            let NewArikulForArenPDF;

            let PreNumberStick = (stickerAreapartA % 100).toString();
            if (PreNumberStick.length < 2) {
                PreNumberStick = '0' + PreNumberStick;
            }
            let NumberStick = PreNumberStick.toString() + stickerAreapartB.toString()

            // Регулярное выражение для извлечения цвета
            let colorPattern = /-(бордовый|зеленый|черный|синий|темно-синий|серый|белый|желтый|сиреневый|персиковый|лимонный|розовый песок|коричневый|голубой|фиолетовый|камуфляж)$/;

            // Извлекаем цвет
            let colorMatch = article.match(colorPattern);
            if (colorMatch) {
                let colorArea = colorMatch[1];
                if (colorArea == 'бордовый') {
                    colorArea = 'бор'
                }
                if (colorArea == 'синий') {
                    colorArea = 'син'
                }
                else if (colorArea == 'зеленый') {
                    colorArea = 'зел'
                }
                else if (colorArea == 'черный') {
                    colorArea = 'чер'
                }
                else if (colorArea == 'темно-синий') {
                    colorArea = 'тем-син'
                }
                else if (colorArea == 'серый') {
                    colorArea = 'сер'
                }
                else if (colorArea == 'белый') {
                    colorArea = 'бел'
                }
                else if (colorArea == 'желтый') {
                    colorArea = 'жел'
                }
                else if (colorArea == 'сиреневый') {
                    colorArea = 'сир'
                }
                else if (colorArea == 'персиковый') {
                    colorArea = 'пер'
                }
                else if (colorArea == 'лимонный') {
                    colorArea = 'лим'
                }
                else if (colorArea == 'розовый песок') {
                    colorArea = 'роз'
                }
                else if (colorArea == 'коричневый') {
                    colorArea = 'кор'
                }
                else if (colorArea == 'голубой') {
                    colorArea = 'гол'
                }
                else if (colorArea == 'фиолетовый') {
                    colorArea = 'фио'
                }
                else if (colorArea == 'камуфляж') {
                    colorArea = 'кам'
                }
                let newarticle = article.replace(colorPattern, '');
                NewArikulForArenPDF = newarticle + '-' + colorArea;
            }
            else {
                NewArikulForArenPDF = article
            }

            let extractedString = orderItem.orderKyz
            let str = extractedString;
            let regex = /\(01\)(\d{14})/;
            let match = str.match(regex);

            if (match) {
                extractedString = match[1];
            } else {

            }

            const fileBrand = statusProgram.brand;
            const generalArticle = general_article(article);
            const articleFetch = get_article(article) + '_' + color;
            // let postColor = articleFetch.replace(/[a-zA-Z_]/g, '')
            const sizeFetch = size;

            let url;

            if (fileBrand == 'Best26') {
                url = `/download?fileBrand=${encodeURIComponent('EVA')}&generalArticle=${encodeURIComponent(generalArticle)}&article=${encodeURIComponent(articleFetch)}&size=${encodeURIComponent(sizeFetch)}`;
            }
            else if (fileBrand == 'Bestshoes') {
                url = `/download?fileBrand=${encodeURIComponent('BEST')}&generalArticle=${encodeURIComponent(generalArticle)}&article=${encodeURIComponent(articleFetch)}&size=${encodeURIComponent(sizeFetch)}`;
            }
            else if (fileBrand == 'Armbest') {
                url = `/download?fileBrand=${encodeURIComponent('ARMBEST')}&generalArticle=${encodeURIComponent(generalArticle)}&article=${encodeURIComponent(articleFetch)}&size=${encodeURIComponent(sizeFetch)}`;
            }

            let imagesKYZPDF;
            const data = {
                id: orderNumber,
                numberOrder: orderItem.stickerAreaorderId,
                Brend: fileBrand,
                Size: sizeFetch,
                Color: color,
                Articul: article,
                Stiker: `${stickerAreapartA}\n${stickerAreapartB}`,
                // didItem: '',
                BoxNumber: orderIndex
            };

            if (orderIndex === totalOrders) { // Проверяем, является ли текущий orderIndex последним
                data.BoxNumber = orderIndex + ' пар'; // Устанавливаем значение только для последнего orderIndex
            } else {
                data.BoxNumber = ""; // Оставляем пустым для остальных
            }

            const row = worksheet.getRow(currentRow);

            columns.forEach((col, index) => {
                row.getCell(index + 1).value = data[col.key];
                if (index == 7) {
                    const cell = row.getCell(index + 1);
                    cell.font = { bold: true, size: 18 };
                }
            });

            row.commit();

            currentRow += 1; // Переход на следующую строку для следующего элемента
            if (choosedVariant == 7) {
                return
            }
            try {
                const responsePDF = await fetch('/getLineToFinishDocument', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        kyz: orderItem.orderKyz,
                        size: orderItem.orderSize,
                        brand: statusProgram.brand
                    })
                });
                if (!responsePDF.ok) {
                    throw new Error(`Ошибка загрузки PDF: ${responsePDF.statusText}`);
                }
                const dataPDF = await responsePDF.arrayBuffer();
                if (dataPDF.byteLength === 0) {
                    alert('Получены пустые данные. Остановись!!!');
                }
                try {
                    const pdf = await pdfjsLib.getDocument({ data: dataPDF }).promise;
                    const page = await pdf.getPage(1);
                    const viewport = page.getViewport({ scale: 4 });
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };

                    await page.render(renderContext).promise;
                    imagesKYZPDF = canvas.toDataURL('image/png');

                    const imgKYZ = new Image();

                    const imageUrl = imagesKYZPDF;
                    imgKYZ.src = imageUrl;
                    canvas.remove()
                    doc.addImage(imagesKYZPDF, 'JPEG', 0, 0, 58, 40, null, 'FAST');
                    if (statusProgramLoadPrintPDFDOC.brand == 'Bestshoes') {
                        doc.setFillColor(255, 255, 255);
                        doc.rect(2, 2, 28, 25, 'F');
                        if (article.length > 7) {
                            doc.setFontSize(3);
                        }
                        else {
                            doc.setFontSize(5);
                        }
                        doc.text('арт ' + NewArikulForArenPDF, 4.5, 10);
                        doc.setFontSize(5);
                        doc.text(NumberStick, 10, 6);
                        doc.text("_____________", 4, 10);
                        doc.setFontSize(2);
                        if (size.length > 3) {
                            doc.setFontSize(5);
                            doc.text(size, 10, 17);
                        }
                        else {
                            doc.setFontSize(7);
                            doc.text(size, 14, 17);
                        }
                        doc.setFontSize(3);
                        doc.text('Производство РФ', 5, 22);
                        doc.setFontSize(5);
                        doc.text("_____________", 4, 22);
                        doc.setFontSize(3);
                        doc.text('"BEST"', 4, 25);
                    }
                    else if (statusProgramLoadPrintPDFDOC.brand == 'Armbest') {
                        doc.setFillColor(1, 1, 1);
                        doc.setTextColor(255, 255, 255);
                        doc.rect(29.5, 1.2, 25, 9, 'F');
                        if (article.length > 7) {
                            doc.setFontSize(3);
                        }
                        else {
                            doc.setFontSize(4);
                        }
                        doc.text('арт ' + NewArikulForArenPDF, 32, 9);
                        doc.setFontSize(4);
                        doc.text(NumberStick, 34, 5.6);
                        doc.setTextColor(0, 0, 0);
                    }

                    else if (statusProgramLoadPrintPDFDOC.brand == 'Best26') {
                        doc.setFillColor(255, 255, 255);
                        doc.setTextColor(1, 1, 1);
                        doc.rect(30.5, 2.2, 23, 9, 'F');
                        if (article.length > 7) {
                            doc.setFontSize(3);
                        }
                        else {
                            doc.setFontSize(5);
                        }
                        doc.text('арт ' + NewArikulForArenPDF, 32, 10);
                        doc.setFontSize(6);
                        doc.text(NumberStick, 32, 6);
                        doc.setTextColor(0, 0, 0);
                    }
                    doc.addPage([58, 40], 'landscape');
                } catch (error) {
                    if (error.message.includes('Compressed input was truncated')) {
                        alert('Ошибка: данные PDF были повреждены или неполные.');
                    } else {
                        console.error('Ошибка при обработке PDF:', error);
                    }
                }
            } catch (error) {
                console.error('Ошибка при обработке запроса:', error);
            }

            // Стикер
            let blobstickerFile = atob(stickerAreaFile);
            const byteNumbers = new Array(blobstickerFile.length);
            for (let i = 0; i < blobstickerFile.length; i++) {
                byteNumbers[i] = blobstickerFile.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            const blob1 = new Blob([byteArray], { type: 'image/png' });
            const img = new Image();
            img.src = URL.createObjectURL(blob1);
            doc.addImage(img, 'PNG', 0, 1, 58, 38);
            doc.addPage([58, 40], 'landscape');
            try {
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error('Ошибка загрузки изображения');
                }
                const arrayBuffer = await response.arrayBuffer();
                imagesBarckodePDF.push(arrayBuffer)
            } catch (error) {
                console.error('Ошибка загрузки изображения:', error);
            }
        }));
        const mergedPdf = await PDFDocument.create();
        imagesBarckodePDF.sort((a, b) => {
            return a - b;
        })
        for (const pdfBytes of imagesBarckodePDF) {
            if (choosedVariant == 7) {
                return
            }
            const pdf = await PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const mergedPdfBytes = await mergedPdf.save();
        let testBoxnumb = boxitem.boxNumber.replace(/[/]/g, '-');
        console.log(testBoxnumb)
        folderBar.file(`${testBoxnumb}.pdf`, mergedPdfBytes);
        const pageCount = doc.internal.getNumberOfPages();
        doc.deletePage(pageCount);
        const pdfBlob = doc.output('blob');
        folderKyz.file(`${testBoxnumb}.pdf`, pdfBlob);
        percent++;
        textFormessage.textContent = `${percent}/${actualcountBoxNumber}`;

    }));

    // Создание ссылки для загрузки zip-файла
    textFormessage.textContent = `Создание архива с файлами`;

    // Выравнивание заголовков по центру и выделение жирным шрифтом
    worksheet.getRow(1).eachCell((cell) => {
        cell.alignment = { horizontal: 'center' };
        cell.font = { bold: true };
    });

    // Выровнять все элементы по центру
    worksheet.eachRow({ includeEmpty: true }, (row) => {
        row.eachCell({ includeEmpty: true }, (cell) => {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });
    });
    console.log('Почти всё1')

    worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
                maxLength = columnLength;
            }
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            if (cell.value == '') {
                cell.border = {
                    top: { style: 'none' },
                    left: { style: 'none' },
                    bottom: { style: 'none' },
                    right: { style: 'none' }
                };
            }
        });
        column.width = maxLength + 2;
    });

    // Устанавливаем высоту всех строк
    worksheet.eachRow({ includeEmpty: true }, (row) => {
        row.height = 30;
    });

    // Генерация буфера из Excel файла
    const excelBuffer = await workbook.xlsx.writeBuffer();
    try {
        zip1.file(`Сборка-${statusProgram.brand}-${statusProgram.NameDelivery}.xlsx`, excelBuffer);
        const zipStream1 = zip1.generateInternalStream({ type: 'blob' });
        let lastProgress = 0;
        const blob = await zipStream1.accumulate(progress => {
            const currentProgress = progress.percent.toFixed(2);
            if (currentProgress - lastProgress >= 1) { // Обновление только на 1% и более
                textFormessage.textContent = `Прогресс: ${currentProgress}%`;
                lastProgress = currentProgress;
            }
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Сборка-${statusProgram.brand}-${statusProgram.NameDelivery}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error creating or downloading the ZIP:', error);
    }
    console.log('Почти всё')
    const excelBufferNew = await workbookNew.xlsx.writeBuffer();
    // Создание ссылки для загрузки zip-файла
    // Создание и скачивание нового Excel файла
    let excelLink = document.createElement('a');
    const excelBlob = new Blob([excelBufferNew], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    excelLink.href = URL.createObjectURL(excelBlob);
    excelLink.download = `WB-${statusProgram.brand}-${statusProgram.NameDelivery}.xlsx`;
    excelLink.click();
    statusProgram.loadMod = 'no';

    document.querySelectorAll('.sectionForAcceptDeliveryold .Boxtransferredfordelivery li.didItem').forEach(item => {
        item.id += `did${Math.random()}`;
        let kyzline = item.querySelector('.kyzArea').textContent
        let kyzSize = item.querySelector('.Size').textContent
        kyzUpdateStatus(article, brand, kyzline, dateNow)
    })

    let boxNumberForDB = 0
    boxlist.forEach(box => {
        box.orderList = box.orderList.map(order => {
            boxNumberForDB++;
            const { stickerAreaFile, stickerAreaBarcode, ...rest } = order;
            return rest;
        });
    })

    let dataToKyzDB = {
        date: dateNow,
        delivery: JSON.stringify(boxlist),
        quantity: boxNumberForDB
    }

    if (choosedVariant != 7) {
        saveDataKyzToDB(dataToKyzDB)
    }

    console.timeEnd('finishDocument')
    const endTime = Date.now();

    statusProgram.loadMod === 'no'
    // endGame()
    const timeTakenMs = endTime - startTime;
    const timeTakenSec = Math.floor(timeTakenMs / 1000);
    const minutes = Math.floor(timeTakenSec / 60);
    const seconds = timeTakenSec % 60;
    console.log(`Время выполнения: ${timeTakenMs} мс`);
    textFormessage.textContent = `Время выполнения: ${minutes} мин ${seconds} сек`;
    setTimeout(() => {
        document.getElementById('loadscreen').style.opacity = 0
        setTimeout(() => {
            saveData()
            document.getElementById('loadscreen').style.display = 'none';
            document.querySelector('body').style.overflow = '';
            textFormessage.textContent = `BEST`;
        }, 1000);
    }, 1000);
}

async function saveDataKyzToDB(dataToKyzDB) {
    try {
        const response = await fetch('/SaveDataKyzToDB', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToKyzDB)
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
    }
    catch (error) {
        console.error('Error:', error);
    }
}

function getFormattedDateTime() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}