const untileHSButton = document.getElementById("Untie_honest_sign");
const ModalAcceptMessage = document.getElementById("accept-block");
let ChooseUserHonestSign = false;

function OpenuntileHonestSignModal() {
  ModalAcceptMessage.style.display = "flex";
  ModalAcceptMessage.style.opacity = "1";
}

async function untileHonestSignYes() {
  ModalAcceptMessage.style.opacity = "0";
  setTimeout(() => {
    ModalAcceptMessage.style.display = "none";
  }, 500);

  document.querySelectorAll(".UlForAreaLeftovers li").forEach((kyzItem) => {
    let linekyz = kyzItem.querySelector(".kyzArea").textContent;
    let lineSize = kyzItem.querySelector(".Size").textContent;
    let lineBrand = kyzItem.querySelector(".brandAreaHide").textContent;

    const data = {
      line: linekyz,
      size: lineSize,
      brand: lineBrand,
    };

    fetch("/kyzComeback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
        kyzItem.remove();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });
}

async function DwonloadNewExcelFileWithoutPdf() {
  let boxlistNEW = [];
  let listforNewExcelNEW = {};
  let countBoxNEW = 0;
  document
    .querySelectorAll(
      ".sectionForAcceptDeliveryold .Boxtransferredfordelivery"
    )
    .forEach((boxItem) => {
      if (
        !boxItem.classList.contains(statusProgram.brand) ||
        !boxItem.classList.contains(statusProgram.NameDelivery)
      ) {
        return;
      }

      let box = {
        boxNumber: "",
        boxcount: "",
        orderList: [],
      };
      box.boxNumber = boxItem.querySelector(
        "h3.p_article_put_order_in_box"
      ).innerText;
      box.boxcount = boxItem.querySelector(
        "h3.p_article_put_order_in_box"
      ).innerText;

      boxItem
        .querySelectorAll("ul li.transferredfordelivery")
        .forEach((order, index) => {
          let orderItem = {
            orderNumber: index + 1,
            orderArtikul: order.querySelector(
              "h5.headerLabelForModel"
            ).textContent,
            orderSize: order.querySelector(".Size").textContent,
            orderKyz: order.querySelector(".kyzArea").textContent,
            orderCreateAt:
              order.querySelector(".createAt").textContent,
            orderSkus: order.querySelector(".skusArea").textContent,
            orderNmId: order.querySelector(".nmId").textContent,
            color: order.querySelector(".colorArea").textContent,
            stickerAreaBarcode:
              order.querySelector(".stickerArea").textContent,
            stickerAreaFile:
              order.querySelector(".stickerAreaFile").textContent,
            stickerAreaorderId: order.querySelector(
              ".stickerAreaorderId"
            ).textContent,
            stickerAreapartA:
              order.querySelector(".stickerAreapartA")
                .textContent,
            stickerAreapartB:
              order.querySelector(".stickerAreapartB")
                .textContent,
          };

          let NewNumberStickers =
            order
              .querySelector(".stickerAreapartA")
              .textContent.toString() +
            order
              .querySelector(".stickerAreapartB")
              .textContent.toString();
          box.orderList.push(orderItem);
          listforNewExcelNEW[countBoxNEW] = {
            artikle: order.querySelector("h5.headerLabelForModel")
              .textContent,
            order: order.querySelector(".stickerAreaorderId")
              .textContent,
            sticker: NewNumberStickers,
            kyz: order.querySelector(".kyzArea").textContent,
          };
          countBoxNEW++;
        });
      boxlistNEW.push(box);
    });

  // Создание новой книги и листа
  const workbookNew = new ExcelJS.Workbook();
  const worksheetNew = workbookNew.addWorksheet("Sheet1");
  worksheetNew.views = [{ state: "paged" }];

  // Определение заголовков столбцов
  const columnsNew = [
    { header: "Артикул", key: "artikle", width: 20 },
    { header: "№ задания", key: "numberOrder", width: 14 },
    { header: "Стикер", key: "sticker", width: 14 },
    { header: "КИЗ", key: "kiz", width: 37 },
  ];

  // Добавление заголовков к листу
  worksheetNew.columns = columnsNew;

  // Добавление стилей к заголовкам
  const headerRowNew = worksheetNew.getRow(1);
  headerRowNew.eachCell((cell) => {
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFFFF" }, // Серый цвет
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Заполнение данных из объекта
  Object.keys(listforNewExcelNEW).forEach((orderNumber) => {
    const dataNew = listforNewExcelNEW[orderNumber];
    let newKYZ = dataNew.kyz
      .replace(/\((01)\)/g, "01")
      .replace(/\((21)\)/g, "21");
    worksheetNew.addRow({
      artikle: dataNew.artikle,
      numberOrder: dataNew.order,
      sticker: dataNew.sticker,
      kiz: newKYZ,
    });
  });

  const excelBufferNew = await workbookNew.xlsx.writeBuffer();

  let excelLink = document.createElement("a");
  const excelBlob = new Blob([excelBufferNew], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  excelLink.href = URL.createObjectURL(excelBlob);
  excelLink.download = `${statusProgram.brand}-${statusProgram.NameDelivery}-в доставку.xlsx`;
  excelLink.click();
}

function untileHonestSignNo() {
  ModalAcceptMessage.style.opacity = "0";
  setTimeout(() => {
    ModalAcceptMessage.style.display = "none";
  }, 500);
}