let objOrders = []
const boxes = {};
const apiUrlNewQursts = "https://suppliers-api.wildberries.ru/api/v3/supplies";

document.getElementById('NavNewOrders').style.backgroundColor = 'lightgrey'
document.getElementById('NavDelivery').style.backgroundColor = ''  

const elementsAndModels = {
  '093-3': 'first',
  '093-3-розовый': 'first',
  '093-3 розовый': 'first',
  '093-4': 'first',
  '093-4-синий': 'first',
  '093-4 синий': 'first',
  '093-5': 'first',
  '093-5-желтый': 'first',
  '093-5 желтый': 'first',
  '093-8': 'first',
  '093-8-персиковый': 'first',
  '093-8 персиковый': 'first',
  '093-11': 'first',
  '093-11-салатовый': 'first',
  '093-11 салатовый': 'first',
  '093-12': 'first',
  '093-12-коричневый': 'first',
  '093-12 коричневый': 'first',
  '093-13': 'first',
  '093-13-розовый песок': 'first',
  '093-13 розовый песок': 'first',
  '096-3': 'first',
  '096-3-розовый': 'first',
  '096-3 розовый': 'first',
  '096-4': 'first',
  '096-4-синий': 'first',
  '096-4 синий': 'first',
  '096-5': 'first',
  '096-5-желтый': 'first',
  '096-5 желтый': 'first',
  '096-8': 'first',
  '096-8-персиковый': 'first',
  '096-8 персиковый': 'first',
  '096-11': 'first',
  '096-11-салатовый': 'first',
  '096-11 салатовый': 'first',
  '096-12': 'first',
  '096-12-коричневый': 'first',
  '096-12 коричневый': 'first',
  '096-13': 'first',
  '096-13-розовый песок': 'first',
  '096-13 розовый песок': 'first',
  '098-3': 'first',
  '098-3-розовый': 'first',
  '098-3 розовый': 'first',
  '098-4': 'first',
  '098-4-синий': 'first',
  '098-4 синий': 'first',
  '098-11': 'first',
  '098-11-салатовый': 'first',
  '098-11 салатовый': 'first',
  '098-12': 'first',
  '098-12-коричневый': 'first',
  '098-12 коричневый': 'first',
  '098-13': 'first',
  '098-13-розовый песок': 'first',
  '098-13 розовый песок': 'first',
  '097-3': 'first',
  '097-3-розовый': 'first',
  '097-3 розовый': 'first',
  '097-8': 'first',
  '097-8-персиковый': 'first',
  '097-8 персиковый': 'first',
  '097-11': 'first',
  '097-11-салатовый': 'first',
  '097-11 салатовый': 'first',
  '097-12': 'first',
  '097-12-коричневый': 'first',
  '097-12 коричневый': 'first',
  '097-13': 'first',
  '097-13-розовый песок': 'first',
  '097-13 розовый песок': 'first',
  '090-5': 'first',
  '090-5-желтый': 'first',
  '090-5 желтый': 'first',
  '090-8': 'first',
  '090-8-персиковый': 'first',
  '090-8 персиковый': 'first',
  '090-11': 'first',
  '090-11-салатовый': 'first',
  '090-11 салатовый': 'first',
  '090-12': 'first',
  '090-12-коричневый': 'first',
  '090-12 коричневый': 'first',
  '090-13': 'first',
  '090-13-розовый песок': 'first',
  '090-13 розовый песок': 'first',
  '072-3': 'first',
  '072-3-розовый': 'first',
  '072-3 розовый': 'first',
  '072-4': 'first',
  '072-4-синий': 'first',
  '072-4 синий': 'first',
  '072-5': 'first',
  '072-5-желтый': 'first',
  '072-5 желтый': 'first',
  '072-6': 'first',
  '072-6-голубой': 'first',
  '072-6 голубой': 'first',
  '072-8': 'first',
  '072-8-персиковый': 'first',
  '072-8 персиковый': 'first',
  '072-12': 'first',
  '072-12-коричневый': 'first',
  '072-12 коричневый': 'first',
  '072-13': 'first',
  '072-13-розовый песок': 'first',
  '072-13 розовый песок': 'first',
  '076-5': 'first',
  '076-5-желтый': 'first',
  '076-5 желтый': 'first',
  '076-12': 'first',
  '076-12-коричневый': 'first',
  '076-12 коричневый': 'first',
  '076-13': 'first',
  '076-13-розовый песок': 'first',
  '076-13 розовый песок': 'first',
  '075-4': 'first',
  '075-4-синий': 'first',
  '075-4 синий': 'first',
  '075-5': 'first',
  '075-5-желтый': 'first',
  '075-5 желтый': 'first',
  '075-6': 'first',
  '075-6-голубой': 'first',
  '075-6 голубой': 'first',
  '075-8': 'first',
  '075-8-персиковый': 'first',
  '075-8 персиковый': 'first',
  '075-12': 'first',
  '075-12-коричневый': 'first',
  '075-12 коричневый': 'first',
  '075-13': 'first',
  '075-13-розовый песок': 'first',
  '075-13 розовый песок': 'first',
  '073-3': 'first',
  '073-3-розовый': 'first',
  '073-3 розовый': 'first',
  '073-4': 'first',
  '073-4-синий': 'first',
  '073-4 синий': 'first',
  '073-12': 'first',
  '073-12-коричневый': 'first',
  '073-12 коричневый': 'first',
  '073-13': 'first',
  '073-13-розовый песок': 'first',
  '073-13 розовый песок': 'first',
  '078-1': 'first',
  '078-1-белый': 'first',
  '078-1 белый': 'first',
  '078-2': 'first',
  '078-2-сиреневый': 'first',
  '078-2 сиреневый': 'first',
  '078-3': 'first',
  '078-3-розовый': 'first',
  '078-3 розовый': 'first',
  '078-4': 'first',
  '078-4-синий': 'first',
  '078-4 синий': 'first',
  '078-5': 'first',
  '078-5-желтый': 'first',
  '078-5 желтый': 'first',
  '078-6': 'first',
  '078-6-голубой': 'first',
  '078-6 голубой': 'first',
  '078-7': 'first',
  '078-7-зеленый': 'first',
  '078-7 зеленый': 'first',
  '078-8': 'first',
  '078-8-персиковый': 'first',
  '078-8 персиковый': 'first',
  '078-9': 'first',
  '078-10': 'first',
  '078-10-лимонный': 'first',
  '078-10 лимонный': 'first',
  '078-11': 'first',
  '078-11-салатовый': 'first',
  '078-11 салатовый': 'first',
  '078-12': 'first',
  '078-12-коричневый': 'first',
  '078-12 коричневый': 'first',
  '078-13': 'first',
  '078-13-розовый песок': 'first',
  '078-13 розовый песок': 'first',
  '079-5': 'first',
  '079-5-желтый': 'first',
  '079-5 желтый': 'first',
  '079-8': 'first',
  '079-8-персиковый': 'first',
  '079-8 персиковый': 'first',
  '079-12': 'first',
  '079-12-коричневый': 'first',
  '079-12 коричневый': 'first',
  '079-13': 'first',
  '079-13-розовый песок': 'first',
  '079-13 розовый песок': 'first',
  '1': 'second',
  '1-3': 'second',
  '1-3-синий': 'second',
  '1-3 синий': 'second',
  '1-3-фиолетовый': 'second',
  '1-3 фиолетовый': 'second',
  '1 фиолетовый': 'second',
  '1-фиолетовый': 'second',
  '1-бордовый': 'second',
  '10-2': 'second',
  '10-2-сиреневый': 'second',
  '10-2 сиреневый': 'second',
  '10-3': 'second',
  '10-3-розовый': 'second',
  '10-3 розовый': 'second',
  '13': 'second',
  '13-черный': 'second',
  '13 черный': 'second',
  '22': 'second',
  '22-синий': 'second',
  '22 синий': 'second',
  '22-бордовый': 'second',
  '22 бордовый': 'second',
  '22-фиолетовый': 'second',
  '22 фиолетовый': 'second',
  '24': 'second',
  '24-фиолетовый': 'second',
  '24 фиолетовый': 'second',
  '24-синий': 'second',
  '24 синий': 'second',
  '24-бордовый': 'second',
  '24 бордовый': 'second',
  '26': 'second',
  '26-бордовый': 'second',
  '26 бордовый': 'second',
  '26-синий': 'second',
  '26 синий': 'second',
  '31': 'second',
  '31-черный': 'second',
  '31 черный': 'second',
  '32': 'second',
  '32-черный': 'second',
  '32 черный': 'second',
  '33': 'second',
  '33-черный': 'second',
  '33 черный': 'second',
  '36': 'second',
  '36-черный': 'second',
  '36 черный': 'second',
  '37': 'second',
  '37-камуфляж': 'second',
  '37 камуфляж': 'second',
  '41': 'second',
  '41-бордовый': 'second',
  '41 бордовый': 'second',
  '41-синий': 'second',
  '41 синий': 'second',
  '41-фиолетовый': 'second',
  '41 фиолетовый': 'second',
  '42': 'second',
  '42-бордовый': 'second',
  '42 бордовый': 'second',
  '42-фиолетовый': 'second',
  '42 фиолетовый': 'second',
  '42-синий': 'second',
  '42 синий': 'second',
  '51': 'second',
  '51-черный': 'second',
  '51 черный': 'second',
  '52': 'second',
  '52-черный': 'second',
  '52 черный': 'second',
  '80': 'second',
  '80-black': 'second',
  '80-черный': 'second',
  '80 черный': 'second',
  '600': 'second',
  '600-бордовый': 'second',
  '600 бордовый': 'second',
  '600-камуфляж': 'second',
  '600 камуфляж': 'second',
  '600-синий': 'second',
  '600 синий': 'second',
  '600-черный': 'second',
  '600 черный': 'second',
  '602': 'second',
  '602-бордовый': 'second',
  '602 бордовый': 'second',
  '602-камуфляж': 'second',
  '602 камуфляж': 'second',
  '602-синий': 'second',
  '602 синий': 'second',
  '602-черный': 'second',
  '602 черный': 'second',
  '610': 'second',
  '610-черный': 'second',
  '610 черный': 'second',
  '611': 'second',
  '611-бордовый': 'second',
  '611 бордовый': 'second',
  '611-синий': 'second',
  '611 синий': 'second',
  '620': 'second',
  '620-черный': 'second',
  '620 черный': 'second',
  '621': 'second',
  '621-бордовый': 'second',
  '621 бордовый': 'second',
  '621-синий': 'second',
  '621 синий': 'second',
  '700': 'second',
  '700-бордовый': 'second',
  '700 бордовый': 'second',
  '700-камуфляж': 'second',
  '700 камуфляж': 'second',
  '700-синий': 'second',
  '700 синий': 'second',
  '700-черный': 'second',
  '700 черный': 'second',
  '702': 'second',
  '702-бордовый': 'second',
  '702 бордовый': 'second',
  '702-камуфляж': 'second',
  '702 камуфляж': 'second',
  '702-синий': 'second',
  '702 синий': 'second',
  '702-черный': 'second',
  '702 черный': 'second',
  '702-3-черный': 'second',
  '702-3 черный': 'second',
  '702-3': 'second',
  '702-4-черный': 'second',
  '702-4 черный': 'second',
  '702-4': 'second',
  '710': 'second',
  '710-черный': 'second',
  '710 черный': 'second',
  '711': 'second',
  '711-бордовый': 'second',
  '711 бордовый': 'second',
  '711-синий': 'second',
  '711 синий': 'second',
  '711-фиолетовый': 'second',
  '711 фиолетовый': 'second',
  '720': 'second',
  '720-черный': 'second',
  '720 черный': 'second',
  '721': 'second',
  '721-бордовый': 'second',
  '721 бордовый': 'second',
  '721-синий': 'second',
  '721 синий': 'second',
  '721-1-черный': 'second',
  '721-1 черный': 'second',
  '721-1': 'second',
  '721-2-розовый': 'second',
  '721-2 розовый': 'second'
};

const ArticlesWith1inBox = [
  '90', '90-1', '90-2', '90-3', '90-4', '90-5', '90-6', '90-7', '90-8', '90-9', '90-10', '90-11', '90-12', '90-13',
  '91', '91-1', '91-2', '91-3', '91-4', '91-5', '91-6', '91-7', '91-8', '91-9', '91-10', '91-11', '91-12', '91-13',
  '90-4', '90-4-1', '90-4-2', '90-4-3', '90-4-4', '90-4-5', '90-4-6', '90-4-7', '90-4-8', '90-4-9', '90-4-10', '90-4-11', '90-4-12', '90-4-13',
  '91-4', '91-4-1', '91-4-2', '91-4-3', '91-4-4', '91-4-5', '91-4-6', '91-4-7', '91-4-8', '91-4-9', '91-4-10', '91-4-11', '91-4-12', '91-4-13'
];

const ArticlesWith5inBox = [
  '100','100-1','102','102-1','102-2','102-3','102-4','103','103-1','103-2','103-3','103-4'
];

const ArticlesWith10inBox = [
  '31', '32', '33', '36', '37', '80', '80-black',
  '26', '401','410','400','402', '401-1', '411', '411-1', '401-1', '401-1-1', '401-1-2', '401-1-3', '401-1-4', '401-1-5', '401-1-6', '401-1-7', '401-1-8', '401-1-9', '401-1-10', '401-1-11', '401-1-12', '401-1-13',
  '411-1', '411-1-1', '411-1-2', '411-1-3', '411-1-4', '411-1-5', '411-1-6', '411-1-7', '411-1-8', '411-1-9', '411-1-10', '411-1-11', '411-1-12', '411-1-13',
  '403', '60', '412', '61', '62', '63',
  '81', '82', '83','82-02', '84'
];
const ArticlesWith15inBox = [
  '52','51','50','24','22','10-3',
  '10-2','10','380','180','10-3', '10-3-1', '10-3-2', '10-3-3', '10-3-4', '10-3-5', '10-3-6', '10-3-7', '10-3-8', '10-3-9', '10-3-10', '10-3-11', '10-3-12', '10-3-13',
  '10-2', '10-2-1', '10-2-2', '10-2-3', '10-2-4', '10-2-5', '10-2-6', '10-2-7', '10-2-8', '10-2-9', '10-2-10', '10-2-11', '10-2-12', '10-2-13',
  '1-3', '1-3-1', '1-3-2', '1-3-3', '1-3-4', '1-3-5', '1-3-6', '1-3-7', '1-3-8', '1-3-9', '1-3-10', '1-3-11', '1-3-12', '1-3-13', '70', '70-1', '71', '71-2', '71-5', '71-6', '71-7', '72', '72-2', '72-3', '72-5', '72-6', '72-7'
];
const ArticlesWith20inBox = [
  '42', '42-1', '42-2', '42-3', '42-4', '42-5', '42-6', '42-7', '42-8', '42-9', '42-10', '42-11', '42-12', '42-13',
  '41', '41-1', '41-2', '41-3', '41-4', '41-5', '41-6', '41-7', '41-8', '41-9', '41-10', '41-11', '41-12', '41-13',
  '1', '1-1', '1-2', '1-3', '1-4', '1-5', '1-6', '1-7', '1-8', '1-9', '1-10', '1-11', '1-12', '1-13',
  '1-3',
  '721', '721-1', '721-2', '721-3', '721-4', '721-5', '721-6', '721-7', '721-8', '721-9', '721-10', '721-11', '721-12', '721-13',
  '720', '720-1', '720-2', '720-3', '720-4', '720-5', '720-6', '720-7', '720-8', '720-9', '720-10', '720-11', '720-12', '720-13',
  '620', '620-1', '620-2', '620-3', '620-4', '620-5', '620-6', '620-7', '620-8', '620-9', '620-10', '620-11', '620-12', '620-13',
  '621', '621-1', '621-2', '621-3', '621-4', '621-5', '621-6', '621-7', '621-8', '621-9', '621-10', '621-11', '621-12', '621-13',
  '611', '611-1', '611-2', '611-3', '611-4', '611-5', '611-6', '611-7', '611-8', '611-9', '611-10', '611-11', '611-12', '611-13',
  '720720', '620620', '711711',
  '610', '610-1', '610-2', '610-3', '610-4', '610-5', '610-6', '610-7', '610-8', '610-9', '610-10', '610-11', '610-12', '610-13',
  '702', '702-1', '702-2', '702-3', '702-4', '702-5', '702-6', '702-7', '702-8', '702-9', '702-10', '702-11', '702-12', '702-13',
  '700', '700-1', '700-2', '700-3', '700-4', '700-5', '700-6', '700-7', '700-8', '700-9', '700-10', '700-11', '700-12', '700-13',
  '602', '602-1', '602-2', '602-3', '602-4', '602-5', '602-6', '602-7', '602-8', '602-9', '602-10', '602-11', '602-12', '602-13',
  '600', '600-1', '600-2', '600-3', '600-4', '600-5', '600-6', '600-7', '600-8', '600-9', '600-10', '600-11', '600-12', '600-13',
  '13', '13-1', '13-2', '13-3', '13-4', '13-5', '13-6', '13-7', '13-8', '13-9', '13-10', '13-11', '13-12', '13-13'
];
const ArticlesWith40inBox = [
  '710', '710-1', '710-2', '710-3', '710-4', '710-5', '710-6', '710-7', '710-8', '710-9', '710-10', '710-11', '710-12', '710-13',
  '711', '711-1', '711-2', '711-3', '711-4', '711-5', '711-6', '711-7', '711-8', '711-9', '711-10', '711-11', '711-12', '711-13'
];

function checkModelBelongsToElement(article) {
  if (elementsAndModels.hasOwnProperty(article)) {
    return elementsAndModels[article]; // Возвращаем значение из elementsAndModels для переданного article
  } else {
    return "third"; // Возвращаем сообщение о том, что артикль не найден
  }
}

// Сравнение первой половины строки со второй
function truncateIfRepeated(code) {
  const length = code.length;

  if (length < 2 || length % 2 !== 0) {
      return code;
  }

  const halfLength = length / 2;
  const firstHalf = code.slice(0, halfLength);
  const secondHalf = code.slice(halfLength);

  if (firstHalf === secondHalf) {
      return firstHalf;
  }

  return code;
}

// Функция удаления коробки
function deleteBox(Box){
  let element = Box.parentElement;
  if (element) {
    let confirmMessage = confirm(`Вы действительно хотите удалить коробку №${element.querySelector('h3.p_article_put_order_in_box').textContent}?`);
    if (confirmMessage) {
        element.remove();
    } else {
        return;
    }
  } else {
    console.error('Parent element not found.');
}}
  
// Функция, вызываемая при начале перетаскивания элемента
function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.id);
  ev.dataTransfer.dropEffect = 'move';
}

function allowDrop(ev) {
  ev.preventDefault();
}

// Функция, вызываемая при начале перетаскивания с использованием мыши
function startDrag(ev) {
  draggedElement = ev.target;
  draggedElement.classList.add('dragging');
  document.addEventListener('mousemove', mouseMove);
  ev.preventDefault();

  // Добавляем слушатели для завершения перетаскивания
  document.addEventListener('mouseup', endDrag);
  draggedElement.addEventListener('dragend', endDrag);
}

// Функция, вызываемая при завершении перетаскивания с использованием мыши
function endDrag() {
  if (draggedElement) {
    draggedElement.classList.remove('dragging');
    document.removeEventListener('mousemove', mouseMove);
    document.removeEventListener('mouseup', endDrag);
    draggedElement.removeEventListener('dragend', endDrag);
    draggedElement = null;
  }  
}

// Обработчик события dragover для разрешения скроллинга
function dragOverHandler(ev) {
  ev.preventDefault();
}

// Обработчик движения мыши для обновления позиции перетаскиваемого элемента
function mouseMove(ev) {
  if (draggedElement) {
    draggedElement.style.position = 'absolute';
    draggedElement.style.left = `${ev.pageX}px`;
    draggedElement.style.top = `${ev.pageY}px`;
  }
}

function handleDragStart(event) {
  event.dataTransfer.setData('text/plain', event.target.id);
  event.dataTransfer.dropEffect = 'move';
}
function handleDragEnd(event) {
  event.preventDefault();
}
function drop(ev) {
  ev.preventDefault();

  let data = ev.dataTransfer.getData("text");
  let draggedElement = document.getElementById(data);
  if (draggedElement.tagName != 'LI'){
    alert('Что ты мне подсунул?', draggedElement.tagName, draggedElement)
    return
  }
  if (ev.target.classList.contains('box')) {
    let ul = ev.target.querySelector('ul');
    if (ul) {
      let PreitemCountElement = draggedElement.parentElement.parentElement.querySelector('.Itemsinbox');
      if (PreitemCountElement) {
        let PreitemCount = parseInt(PreitemCountElement.textContent);
        PreitemCountElement.textContent = PreitemCount - 1;
      }
      ul.appendChild(draggedElement);
      let itemCountElement = ul.parentElement.querySelector('.Itemsinbox');
      let itemCount = parseInt(itemCountElement.textContent);
      itemCountElement.textContent = itemCount + 1;
    }
  // } else if (ev.target.tagName === 'LI' && ev.target.parentElement.tagName === 'UL') {
  //   ev.target.parentElement.appendChild(draggedElement);
  } else {
    console.error('Invalid drop target:', ev.target);
  }
}

function removeColorFromArticle(article){
  const regex = /-\D+$|\s\D+$/;
  const cleanedArticle = article.replace(regex, '');
  return cleanedArticle;
}

let sizeItem;
let numberOrder = 0
function openNewOrdersWindow() {
  document.getElementById('updateBDButton').style.display = 'block'
  document.getElementById('NavNewOrders').style.backgroundColor = 'lightgrey'
  document.getElementById('sectionForAcceptDelivery').style.display = 'none'
  document.getElementById('NavDelivery').style.backgroundColor = ''
  document.getElementById('OrdersList').style.display = ''
  // document.querySelector('.boxforinfoDB').style.display = 'none'
}

async function getQuests() {
  const compressedOrders = localStorage.getItem('NewOrders');
  let orderList;
  let showModal;

  if (compressedOrders == null) {

  }  

  Object.values(cargoData).forEach(cargoArray => {
    Object.values(cargoArray.orders).forEach(ord => {
        if (!boxes[ord.article]) {
          boxes[ord.article] = [];
        }
        boxes[ord.article].push(ord);
        let artCheck = ord.article.split('-')[0].trim().replace(/[-.]/g, '');
        artCheck = truncateIfRepeated(artCheck)
        if (checkModelBelongsToElement(artCheck) == 'first') {
          ord['stock'] = 'firstStock';
          ord['maxItems'] = 20;
          ord['numberItems'] = 0;
        } else if (checkModelBelongsToElement(artCheck) == 'second') {
          ord['stock'] = 'secondStock';
          ord['maxItems'] = 15;
          ord['numberItems'] = 0;
        } else {
          ord['stock'] = 'thirdStock';
          ord['maxItems'] = 20;
          ord['numberItems'] = 0;
        }
        if (ArticlesWith1inBox.includes(removeColorFromArticle(artCheck))) {
          ord['maxItems'] = 1;
        }
	else if (ArticlesWith5inBox.includes(removeColorFromArticle(artCheck))) {
          ord['maxItems'] = 5;
        }
        else if (ArticlesWith10inBox.includes(removeColorFromArticle(artCheck))) {
          ord['maxItems'] = 10;
        }
        else if (ArticlesWith15inBox.includes(removeColorFromArticle(artCheck))) {
          ord['maxItems'] = 15;
        }
        else if (ArticlesWith20inBox.includes(removeColorFromArticle(artCheck))) {
          ord['maxItems'] = 20;
        }
        else if (ArticlesWith40inBox.includes(removeColorFromArticle(artCheck))) {
          ord['maxItems'] = 40;
        }
	console.log('Артикул: ' + artCheck + " Количество пар в кор.: " + ord['maxItems']);
      })
  })

  let a = 0

  async function getWbSizeFromApi(skus) {
    const response = await fetch(`http://localhost:3000/getWbSize${statusProgram.brand}?skus=${skus}`);
    if (response.ok) {
        const data = await response.json();
        return data.tech_size;
    } else {
        throw new Error('Размер не найден');
    }
  }

  async function assignSizeToParagraph(items) {
      for (let key in items) {
          if (items.hasOwnProperty(key)) {
              try {
                for (let i = 0; i < items[key].length; i++) {
                  let wbSize = await getWbSizeFromApi(items[key][i].skus[0]);
                  items[key][i].size = wbSize;
                }
              } catch (error) {
                  console.error(error);
              }
            }
          }
          // console.log(boxes)
      let matchFound = false;
      Object.keys(boxes).forEach(article => {
        if (orderList!= null || orderList!= undefined) {
          Object.values(orderList).forEach(order => {
            if (order.article == boxes[article][0].article && order.createdAt == boxes[article][0].createdAt && order.nmId == boxes[article][0].nmId && order.skus[0] == boxes[article][0].skus[0]){
              matchFound = true;
            }
          })
        }
        if (matchFound == false) {
          a++
          createContainerForBox(article, boxes[article], a);  
        }
    });
  }
  assignSizeToParagraph(boxes);
  document.getElementById('countBoxNumb').textContent = a
  statusProgram.orders = 'yes';
}

let boxcountInPanel = 0;
let boxescountInPanel = 0;

function createContainerForBox(article, items, a) {
  let preArt = article;
  if (statusProgram.brand == 'Best26'){
    if (preArt == '61' || preArt == '81' || preArt == '82' || preArt == '83' || preArt == '83'){
      preArt += 'ч'
    }
  }

  const container = document.createElement('div');
  container.className = 'box mainbox';
  container.id = article;
  boxescountInPanel++
  const header = document.createElement('h3');
  header.className = 'p_article_put_order_in_box';

  header.textContent = article;    
  container.appendChild(header);
  const list = document.createElement('ul');

  const deletBox = document.createElement('div');
  deletBox.className = 'deleteBox';

  const deleteButton = document.createElement('button');
  deleteButton.className = 'deleteBoxButton';
  deleteButton.textContent = 'X';
  deletBox.appendChild(deleteButton);
  container.appendChild(deletBox);
  deletBox.addEventListener('click', function() {
    deleteBox(deletBox);
  });
  list.style.height = '100%';
  let x = 0;

  let progressBarOrder = document.querySelector('.progress-fill-order');
  let totalOrders = items.length;
  let progressedOrders = 0;

  const maxItemsinbox = document.createElement('p');
  maxItemsinbox.className = 'headerLabelForModel maxItemsinbox';

  const StockArea= document.createElement('p');
  StockArea.className = 'StockArea';

  const Itemsinbox = document.createElement('p');
  Itemsinbox.className = 'headerLabelForModel Itemsinbox';
  container.classList.add(statusProgram.NameDelivery);
  container.classList.add(statusProgram.brand);

  if (statusProgram.brand == 'Armbest'){
    container.style.backgroundColor = '#8dddbb'
  }
  else if (statusProgram.brand == 'Best26'){
    container.style.backgroundColor = 'rgb(169 169 220)'
  }
  else if (statusProgram.brand == 'BestShoes'){
    container.style.backgroundColor = '#C4E5FF'
  }

  items.forEach(item => {
    if(!item.sticker){
      return;
    }
    boxcountInPanel++
    x++;
    container.classList.add(statusProgram.NameDelivery);
    const listItem = document.createElement('li');
    listItem.draggable = true;
    listItem.id = `Article${article}-${x}-${statusProgram.brand}-` ;
    listItem.className = `box bpxelem ${statusProgram.brand}`
    listItem.setAttribute('article-numb', preArt.replace(/[.]/g, ''));

    if (item.stock == 'firstStock') {
      container.className += ' firstStock';

      StockArea.textContent = "Первый";

    } else if (item.stock == 'secondStock') {
      
      container.className += ' secondStock';
      StockArea.textContent = "Второй";
    }
    else {
      container.className += ' thirdStock';
      StockArea.textContent = "Третий";

    }

    const p1= document.createElement('p');
    p1.className = 'headerLabelForModel Size';
    p1.textContent = item.size;

    const kyzArea= document.createElement('p');
    kyzArea.className = 'kyzArea';
    kyzArea.setAttribute('data-size', item.size);

    const FullkyzArea= document.createElement('p');
    FullkyzArea.className = 'FullkyzArea';
    FullkyzArea.setAttribute('FullkyzArea', item.size);
    FullkyzArea.style.display = 'none'

    const colorArea= document.createElement('p');
    colorArea.className = 'colorArea';
    colorArea.textContent = "";
    colorArea.style.display = 'none'

    const stickerArea= document.createElement('div');
    stickerArea.className = 'stickerArea';
    stickerArea.textContent = article.sticker;

    const stickerAreaBarcode= document.createElement('p');
    stickerAreaBarcode.textContent = item.sticker.barcode;
    stickerAreaBarcode.className = 'stickerAreaBarcode';
    stickerAreaBarcode.style.display = 'none';
    stickerArea.appendChild(stickerAreaBarcode)  

    const stickerAreaFile= document.createElement('p');
    stickerAreaFile.textContent = item.sticker.file;
    stickerAreaFile.className = 'stickerAreaFile';
    stickerAreaFile.style.display = 'none';
    stickerArea.appendChild(stickerAreaFile)

    const stickerAreaorderId= document.createElement('p');
    stickerAreaorderId.textContent = item.sticker.orderId;
    stickerAreaorderId.className = 'stickerAreaorderId';
    stickerArea.appendChild(stickerAreaorderId)

    const stickerAreapartA= document.createElement('p');
    stickerAreapartA.textContent = item.sticker.partA;
    stickerAreapartA.className = 'stickerAreapartA';
    stickerAreapartA.style.display = 'none';

    stickerArea.appendChild(stickerAreapartA)

    const stickerAreapartB= document.createElement('p');
    stickerAreapartB.textContent = item.sticker.partB;
    stickerAreapartB.className = 'stickerAreapartB';
    stickerAreapartB.style.display = 'none';

    stickerArea.appendChild(stickerAreapartB)

    const createAt= document.createElement('p');
    createAt.textContent = item.createdAt;
    createAt.className = 'createAt';
    createAt.style.display = 'none';
    
    const skusArea= document.createElement('p');
    skusArea.textContent = item.skus[0];
    skusArea.className = 'skusArea';
    skusArea.style.display = 'none';

    const nmId= document.createElement('p');
    nmId.textContent = item.nmId;
    nmId.style.display = 'none'
    nmId.className = 'nmId';

    const StockAreaHide= document.createElement('p');
    StockAreaHide.className = 'StockAreaHide';
    StockAreaHide.textContent = item.stock;
    StockAreaHide.style.display = 'none'

    const brandAreaHide= document.createElement('p');
    brandAreaHide.className = 'brandAreaHide';
    brandAreaHide.textContent = statusProgram.brand;
    brandAreaHide.style.display = 'none'

    const h5= document.createElement('h5');
    h5.className = 'headerLabelForModel';
    h5.textContent = article;
    
    maxItemsinbox.textContent = item.maxItems;
    Itemsinbox.textContent = x;

    listItem.appendChild(brandAreaHide);
    listItem.appendChild(StockAreaHide);
    listItem.appendChild(h5);
    listItem.appendChild(p1);
    listItem.appendChild(stickerArea);
    listItem.appendChild(kyzArea);
    listItem.appendChild(FullkyzArea);
    listItem.appendChild(createAt);
    listItem.appendChild(colorArea);
    listItem.appendChild(skusArea);
    listItem.appendChild(nmId);
    list.appendChild(listItem);
    
    progressedOrders++;
    progressBarOrder.style.width = (progressedOrders/totalOrders) * 100 + '%'
  });

  progressBarOrder.textContent = 'Готово'
  container.appendChild(list);
  container.appendChild(Itemsinbox);
  container.appendChild(maxItemsinbox);
  container.appendChild(StockArea);

  container.style.transition = '2s'
  container.style.opacity = 0
  container.style.height = 0 

  // Добавляем контейнер в DOM
  document.getElementById('OrdersList').appendChild(container);
  document.getElementById('OrdersList').style.transition = '2s'
  document.getElementById('OrdersList').style.height = '100%'
  document.getElementById('countBoxNumber').textContent = boxcountInPanel

  const loadingScreen = document.getElementById('loading-screen');
  loadingScreen.style.transition= '1s';
  loadingScreen.style.opacity = 0;

  setTimeout(() => {
    loadingScreen.style.display = 'none';
  }, 1000);

  document.querySelectorAll('.mainbox').forEach(listItem => {
    // Проверяем наличие уже добавленных обработчиков
    if (!listItem.hasDragOverHandler) {
        listItem.addEventListener('dragstart', handleDragStart);
        listItem.addEventListener('dragend', handleDragEnd);  
        listItem.addEventListener('dragover', dragOverHandler);
        listItem.addEventListener('drop', drop);
        listItem.hasDragOverHandler = true; // Устанавливаем флаг
    }
  });
  let y = 0
  document.querySelector('.sectionForAcceptDeliveryold').querySelectorAll('.bpxelem').forEach(li => {
    if (!li.id.includes('saved')) {
      li.id += 'saved';
    }
  })
  document.querySelector('.sectionForAcceptDeliverynew').querySelectorAll('.bpxelem').forEach(li => {
    if (!li.id.includes('saved')) {
      li.id += 'saved';
    }
  })
  document.querySelector('.LeftoversArea').querySelectorAll('.bpxelem').forEach(li => {
    if (!li.id.includes('saved')) {
      li.id += 'saved';
    }
  })

  // document.querySelectorAll('.mainbox').forEach(listItem => {
  //   if (){}
  //   listItem.addEventListener('dragover', dragOverHandler);
  //   listItem.addEventListener('drop', drop);
  // })

  setTimeout(() => {
    container.style.opacity = 1;
    container.style.height = '100%';  
  }, 1000);
}

function changeItemsforDelivery() {
  if (statusProgram.changeMod == 'no'){
    statusProgram.changeMod = 'yes'
    document.querySelectorAll('.deleteBox').forEach(Deletebutton => {
      Deletebutton.style.display = 'flex'
    })
    document.querySelectorAll('.mainbox').forEach(item => {
      item.classList.add('changeMod');
      const pArticle = item.querySelector('.p_article_put_order_in_box');
      if (pArticle) {
        pArticle.setAttribute('contenteditable', 'true');
      }
    })  
  }

  else {
    statusProgram.changeMod = 'no'
    document.querySelectorAll('.deleteBox').forEach(Deletebutton => {
      Deletebutton.style.display = 'none'
    })
    document.querySelectorAll('.mainbox').forEach(item => {
      item.classList.remove('changeMod');
      const pArticle = item.querySelector('.p_article_put_order_in_box');
      if (pArticle) {
        pArticle.setAttribute('contenteditable', 'false');
      }
    })  
  }
}