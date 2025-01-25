const gameContainer = document.getElementById('gameContainerONLYFORGAME');
const scoreDisplay = document.getElementById('scoreONLYFORGAME');
const highscoreDisplay = document.getElementById('highscoreONLYFORGAME');
const gameOverScreen = document.getElementById('gameOverONLYFORGAME');
const restartBtn = document.getElementById('restartBtnONLYFORGAME');

let score = 0;
let highscore = localStorage.getItem('highscoreONLYFORGAME') || 0;
let gameInterval;
let gameActive = true;  // Флаг активности игры

highscoreDisplay.textContent = highscore;

function startGame() {
    score = 0;
    scoreDisplay.textContent = score;
    gameOverScreen.classList.add('hiddenONLYFORGAME');
    gameContainer.innerHTML = '';
    gameActive = true;  // Устанавливаем флаг активности игры
    gameInterval = setInterval(spawnShoe, 1000);
}

function showEndMessage(message) {
    const endMessage = document.createElement('div');
    endMessage.classList.add('end-messageONLYFORGAME');
    endMessage.textContent = message;

    // Анимация появления сообщения
    endMessage.style.opacity = '0';
    document.body.appendChild(endMessage);
    setTimeout(() => {
        endMessage.style.transition = 'opacity 1s';
        endMessage.style.opacity = '1';
    }, 100);
}

function spawnShoe() {
    if (!gameActive) return;

    const shoe = document.createElement('div');
    shoe.classList.add('shoeONLYFORGAME');

    const isSuperShoe = Math.random() < 0.2;  // 20% вероятность появления супер коробки
    if (isSuperShoe) {
        shoe.classList.add('super-shoeONLYFORGAME');
    }

    shoe.style.left = `${Math.random() * (gameContainer.clientWidth - 50)}px`;
    shoe.style.top = '0px';

    let isCollected = false;

    shoe.addEventListener('click', () => {
        if (gameActive && !isCollected) {

            if (isSuperShoe) {
                score += 5;
            } else {
                score++;
            }
            
            scoreDisplay.textContent = score;
            isCollected = true;

            // Добавляем анимацию исчезновения коробки
            shoe.style.transition = 'transform 0.5s, opacity 0.5s';
            shoe.style.transform = 'scale(0)';
            shoe.style.opacity = '0';

            setTimeout(() => {
                shoe.remove();
            }, 500);  // Удаляем коробку через 0.5 секунд (время анимации)
        }
    });

    gameContainer.appendChild(shoe);

    let fallInterval = setInterval(() => {
        const top = parseInt(shoe.style.top);
        shoe.style.top = `${top + 5}px`;

        if (top > gameContainer.clientHeight - 50) {
            clearInterval(fallInterval);
            if (!isCollected && gameActive) {
                shoe.remove();
                endGame();  // Завершаем игру, если коробка не была собрана
            }
        }
    }, 30);
}

function endGame() {
    gameActive = false;  // Деактивируем игру, чтобы коробки не могли быть собраны
    clearInterval(gameInterval);

    // Удаляем все оставшиеся коробки с анимацией
    const remainingShoes = document.querySelectorAll('.shoeONLYFORGAME');
    remainingShoes.forEach(shoe => {
        shoe.style.transition = 'transform 0.5s, opacity 0.5s';
        shoe.style.transform = 'scale(0)';
        shoe.style.opacity = '0';
        setTimeout(() => {
            const endMessage = document.querySelector('.end-messageONLYFORGAME');
            if (endMessage) {
                endMessage.remove();  // Удаляем сообщение при перезапуске игры
            }        
            shoe.remove();
        }, 3000);
    });


    // Проверка на новый рекорд
    let message = `Конец поставки, вы загрузили ${score} коробок, ваш рекорд ${highscore}.`;
    if (score > highscore) {
        highscore = score;
        localStorage.setItem('highscoreONLYFORGAME', highscore);
        highscoreDisplay.textContent = highscore;
        message = `Поздравляем, вы побили рекорд! Вы загрузили ${score} коробок.`;
    }

    // Отображение сообщения с анимацией
    showEndMessage(message);

    gameOverScreen.classList.remove('hiddenONLYFORGAME');

    if (score > highscore) {
        highscore = score;
        localStorage.setItem('highscoreONLYFORGAME', highscore);
        highscoreDisplay.textContent = highscore;
    }
}

restartBtn.addEventListener('click', () => {
    const endMessage = document.querySelector('.end-messageONLYFORGAME');
    if (endMessage) {
        endMessage.remove();  // Удаляем сообщение при перезапуске игры
    }
    startGame();
});