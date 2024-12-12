
class Board {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.board = Array.from({ length: cols }, () => Array(rows).fill(null));
        this.winner = null;
        this.changed = true;
        this.winningCells = [];
    }

    isColumnFree(column) {
        return this.board[column][0] === null;
    }

    dropChip(playerId, column) {
        for (let row = this.rows - 1; row >= 0; row--) {
            if (this.board[column][row] === null) {
                this.board[column][row] = playerId;
                this.changed = true;
                return true;
            }
        }
        return false;
    }

    removeChip(column) {
        for (let row = 0; row < this.rows; row++) {
            if (this.board[column][row] !== null) {
                this.board[column][row] = null;
                this.changed = true;
                return true;
            }
        }
        return false;
    }

    rateSequence(playerId, positions) {
        let bot = 0;
        let player = 0;

        for (const [col, row] of positions) {
            if (this.board[col][row] === playerId) {
                bot++;
            } else if (this.board[col][row] !== null) {
                player++;
            }
        }

        if (bot > 0 && player > 0) {
            return 0;
        }
        if (bot > 0) {
            return { 1: 1, 2: 10, 3: 100 }[bot] || 0;
        }
        if (player > 0) {
            return -{ 1: 1, 2: 10, 3: 100 }[player] || 0;
        }

        return 0;
    }

    rateSequences(playerId, seqType) {
        let score = 0;

        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                if (seqType === "horizontal" && col + 3 < this.cols) {
                    score += this.rateSequence(playerId, Array.from({ length: 4 }, (_, k) => [col + k, row]));
                }
                if (seqType === "vertical" && row + 3 < this.rows) {
                    score += this.rateSequence(playerId, Array.from({ length: 4 }, (_, k) => [col, row + k]));
                }
                if (seqType === "diagonal" && col + 3 < this.cols && row + 3 < this.rows) {
                    score += this.rateSequence(playerId, Array.from({ length: 4 }, (_, k) => [col + k, row + k]));
                }
                if (seqType === "reverse_diagonal" && col - 3 >= 0 && row + 3 < this.rows) {
                    score += this.rateSequence(playerId, Array.from({ length: 4 }, (_, k) => [col - k, row + k]));
                }
            }
        }

        return score;
    }

    rateBoard(playerId) {
        let score = 0;
        for (const seqType of ["horizontal", "vertical", "diagonal", "reverse_diagonal"]) {
            score += this.rateSequences(playerId, seqType);
        }
        return score;
    }

    minimax(depth, playerId, maximizingPlayer, alpha, beta) {
        const opponentId = playerId === 1 ? 2 : 1;

        if (this.getWinner() === playerId) {
            return (depth + 1) * 10000;
        }
        if (this.getWinner() === opponentId) {
            return -(depth + 1) * 10000;
        }
        if (this.isFull()) {
            return 0;
        }
        if (depth === 0) {
            return this.rateBoard(playerId);
        }

        if (maximizingPlayer) {
            let maxEval = -Infinity;
            for (let col = 0; col < this.cols; col++) {
                if (!this.dropChip(playerId, col)) continue;
                const evalue = this.minimax(depth - 1, playerId, false, alpha, beta);
                this.removeChip(col);
                maxEval = Math.max(maxEval, evalue);
                alpha = Math.max(alpha, evalue);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let col = 0; col < this.cols; col++) {
                if (!this.dropChip(opponentId, col)) continue;
                const evalue = this.minimax(depth - 1, playerId, true, alpha, beta);
                this.removeChip(col);
                minEval = Math.min(minEval, evalue);
                beta = Math.min(beta, evalue);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    calculateBestMove(playerId, depth) {
        const moves = [];

        for (let col = 0; col < this.cols; col++) {
            if (!this.dropChip(playerId, col)) continue;
            const score = this.minimax(depth - 1, playerId, false, -Infinity, Infinity);
            moves.push({ column: col, score });
            this.removeChip(col);
        }

        const maxScore = Math.max(...moves.map(move => move.score));
        const bestMoves = moves.filter(move => move.score === maxScore).map(move => move.column);

        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    getWinner() {
        if (!this.changed) {
            return this.winner;
        }

        this.changed = false;
        this.winningCells = [];

        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                for (const seqType of ["horizontal", "vertical", "diagonal", "reverse_diagonal"]) {
                    if (this.checkWinnerSequence(col, row, seqType)) {
                        this.winner = this.board[col][row];
                        return this.winner;
                    }
                }
            }
        }

        this.winner = null;
        return this.winner;
    }

    checkWinnerSequence(col, row, seqType) {
        if (this.board[col][row] === null) return false;

        const playerId = this.board[col][row];
        const deltas = {
            horizontal: [1, 0],
            vertical: [0, 1],
            diagonal: [1, 1],
            reverse_diagonal: [-1, 1],
        };
        const [dc, dr] = deltas[seqType];

        try {
            const winningCells = [[col, row]];
            for (let k = 1; k < 4; k++) {
                const c = col + k * dc;
                const r = row + k * dr;
                if (this.board[c][r] === playerId) {
                    winningCells.push([c, r]);
                } else {
                    return false;
                }
            }
            this.winningCells = winningCells;
            return true;
        } catch (e) {
            return false;
        }
    }

    isFull() {
        return this.board.every(column => column[0] !== null);
    }
}
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
    board.changed = true;
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
