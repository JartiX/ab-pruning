
class Board {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.board = Array.from({ length: cols }, () => Array(rows).fill(null));
        this.winner = null;
        this.is_changed = true;
        this.winningCells = [];
    }

    isColumnFree(column) {
        return this.board[column][0] === null;
    }

    dropChip(playerId, column) {
        for (let row = this.rows - 1; row >= 0; row--) {
            if (this.board[column][row] === null) {
                this.board[column][row] = playerId;
                this.is_changed = true;
                return true;
            }
        }
        return false;
    }

    removeChip(column) {
        for (let row = 0; row < this.rows; row++) {
            if (this.board[column][row] !== null) {
                this.board[column][row] = null;
                this.is_changed = true;
                return true;
            }
        }
        return false;
    }

    rateSequence(playerId, positions) {

        let bot = 0;
        let player = 0;
        let empty = 0;

        let score = 0

        for (const [col, row] of positions) {
            if (this.board[col][row] === playerId) {
                bot++;
            } else if (this.board[col][row] !== null) {
                player++;
            } else {
                empty++;
            }
        }

        // Если в последовательности есть фишки двух игроков, в ней нет смысла
        if (bot > 0 && player > 0) {
            return 0;
        }

        // Проверка на потенциальный выигрыш
        if (empty > 0 && bot > 0) {
            score += { 1: 1, 2: 10, 3: 100 }[bot] || 0;
        }
        
        // Награждаем за фишки в последовательности
        if (bot > 0) {
            score += { 1: 10, 2: 100, 3: 1000 }[bot] || 0;
        }
        // Штрафуем за последовательность оппонента
        if (player > 0) {
            score += -{ 1: 10, 2: 100, 3: 1000 }[player] || 0;
        }

        return score;
    }

    rateSequences(playerId, seqType) {
        let score = 0;

        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                if (seqType === "horizontal" && col + 3 < this.cols) {
                    score += this.rateSequence(playerId, Array.from({ length: 4 }, (_, k) => [col + k, row]));
                }
                else if (seqType === "vertical" && row + 3 < this.rows) {
                    score += this.rateSequence(playerId, Array.from({ length: 4 }, (_, k) => [col, row + k]));
                }
                else if (seqType === "diagonal" && col + 3 < this.cols && row + 3 < this.rows) {
                    score += this.rateSequence(playerId, Array.from({ length: 4 }, (_, k) => [col + k, row + k]));
                }
                else if (seqType === "reverse_diagonal" && col - 3 >= 0 && row + 3 < this.rows) {
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

        const centerCol = Math.floor(this.cols / 2);
        
        for (let row = 0; row < this.rows; row++) {
            if (this.board[centerCol][row] === playerId) {
                score += 5;
            }
        }
        return score;
    }

    minimax(depth, playerId, maximizingPlayer, alpha, beta) {
        const opponentId = playerId === 1 ? 2 : 1;
        
        // Хорошо награждаем если находим выигрышный ход
        if (this.getWinner() === playerId) {
            return (depth + 1) * 30000;
        }
        // Штрафуем если противник одержит победу
        if (this.getWinner() === opponentId) {
            return -(depth + 1) * 30000;
        }
        if (this.isFull()) {
            return 0;
        }
        // Оцениваем доску, когда дошли до нужной глубины
        if (depth === 0) {
            return this.rateBoard(playerId);
        }

        // Игрок пытается максимизировать свой выигрыш
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
        } else { // Игрок пытается мнимизировать выигрыш максимизатора
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
            // Вычисляем очки для броска фишки в каждую колонку
            const score = this.minimax(depth - 1, playerId, false, -Infinity, Infinity);
            moves.push({ column: col, score });
            this.removeChip(col);
        }
        const maxScore = Math.max(...moves.map(move => move.score));
        const bestMoves = moves.filter(move => move.score === maxScore).map(move => move.column);
        
        // Возвращаем случайный лучший ход если их несколько
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    getWinner() {
        if (!this.is_changed) {
            return this.winner;
        }

        this.is_changed = false;
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