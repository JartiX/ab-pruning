const cols = 7;
const rows = 6;
const board = new Board(cols, rows);
const boardElement = document.querySelector('.board');
const controlsElement = document.querySelector('.controls');
const gameInfoElement = document.querySelector('.current-turn');
const gameResultElement = document.querySelector('.game-result');
const gameAlertElement = document.querySelector('.game-alert');

const hintButton = document.querySelector('.hint-container');

let currentPlayer = 1;
let isGameActive = true;
let AIdifficulty = 4;

function renderBoard() {
    boardElement.style.setProperty('--cols', cols);
    boardElement.innerHTML = '';

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            const value = board.board[col][row];

            if (value === 1) {
                cell.classList.add('player1'); 
            } else if (value === 2) {
                cell.classList.add('player2');
            }

            cell.onclick = () => playerMove(col);

            boardElement.appendChild(cell);
        }
    }
}

function animateWin() {
    if (board.winningCells.length > 0) {
        console.log(board.winningCells)
        board.winningCells.forEach(([col, row]) => {
            const index = row * cols + col;
            const winningCell = boardElement.children[index];
            winningCell.classList.add('win');
        });
    }
}

function renderControls() {
    controlsElement.innerHTML = '';
    for (let col = 0; col < cols; col++) {
        const button = document.createElement('button');
        button.textContent = col + 1;
        button.onclick = () => playerMove(col);
        controlsElement.appendChild(button);
    }
}

function updateGameInfo(message) {
    gameAlertElement.innerHTML = message;
    setTimeout(() => {
        gameAlertElement.innerHTML = ''; 
    }, 3000);
}

function updateGameTurn(message) {
    gameInfoElement.innerHTML = message;
}

function updateGameResult(result) {
    gameResultElement.innerHTML = result;
}

function lockControls() {
    const buttons = controlsElement.querySelectorAll('button');
    buttons.forEach(button => {
        button.disabled = true;
    });
}

function unlockControls() {
    const buttons = controlsElement.querySelectorAll('button');
    buttons.forEach(button => {
        button.disabled = false;
    });
}

function playerMove(col) {
    if (!isGameActive) {
        updateGameInfo('Игра окончена...');
        return;
    }
    if (currentPlayer !== 1) {
        updateGameInfo('Сейчас ход ИИ...');
        return;
    }

    if (!board.isColumnFree(col)) {
        updateGameInfo('Столбец заполнен, выберите другой.');
        return;
    }

    clearHighlight();

    lockControls();

    board.dropChip(1, col);
    renderBoard();

    if (board.getWinner() === 1) {
        updateGameResult('Вы победили!');
        isGameActive = false;
        animateWin();
        unlockControls();
        return;
    }

    if (board.isFull()) {
        updateGameResult('Ничья!');
        isGameActive = false;
        unlockControls();
        return;
    }

    updateGameTurn('Ход ИИ');
    currentPlayer = 2;

    setTimeout(() => aiMove(), 500);
}

function aiMove() {
    if (currentPlayer !== 2 || !isGameActive) {
        return;
    }

    lockControls();

    const col = board.calculateBestMove(2, AIdifficulty);
    board.dropChip(2, col);
    renderBoard();

    console.log(board.getWinner())
    if (board.getWinner() === 2) {
        updateGameResult('ИИ победил!');
        isGameActive = false;
        animateWin();
        unlockControls();
        return;
    }

    if (board.isFull()) {
        updateGameResult('Ничья!');
        isGameActive = false;
        unlockControls();
        return;
    }

    updateGameTurn('Ваш ход');
    currentPlayer = 1;

    unlockControls();

    if (hintButton.classList.contains('active')) {
        setTimeout(() => {
            const bestMoveCol = board.calculateBestMove(1, 6);
            highlightBestMove(bestMoveCol);
        }, 200);
    }
}

function restartGame() {
    board.board = Array.from({ length: cols }, () => Array(rows).fill(null));
    board.winner = null;
    board.is_changed = true;
    board.winningCells = [];

    isGameActive = true;
    currentPlayer = 1;

    updateGameResult('');
    updateGameTurn('Ваш ход');
    renderBoard();
    renderControls();
    hintButton.classList.remove('active');
    unlockControls();
    gameAlertElement.innerHTML = '';
}

document.querySelector('.restart-button').addEventListener('click', restartGame);

document.querySelectorAll('.difficulty-button').forEach(button => {
    button.addEventListener('click', (event) => {
        const selectedDifficulty = event.target.getAttribute('data-difficulty');
        switch (selectedDifficulty) {
            case 'easy':
                AIdifficulty = 2;
                break;
            case 'medium':
                AIdifficulty = 4;
                break;
            case 'hard':
                AIdifficulty = 6;
                break;
            default:
                AIdifficulty = 4;
        }
        restartGame();
        updateGameInfo(`Сложность установлена на: ${selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)}`);
    });
});

function highlightBestMove(col) {
    const buttons = controlsElement.querySelectorAll('button');
    buttons.forEach(button => button.classList.remove('highlighted'));

    const button = controlsElement.querySelectorAll('button')[col];
    if (button) {
        button.classList.add('highlighted');
    }
}

function clearHighlight() {
    const buttons = controlsElement.querySelectorAll('button');
    buttons.forEach(button => button.classList.remove('highlighted'));
}

function toggleHint() {
    hintButton.classList.toggle('active');
    if (!hintButton.classList.contains('active')) {
        clearHighlight();
        return;
    }
    setTimeout(() => {
        const bestMoveCol = board.calculateBestMove(1, 6);
        highlightBestMove(bestMoveCol);
    }, 100);
}

renderControls();
renderBoard();
