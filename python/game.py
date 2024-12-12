import random

class Board:
    cols: int = None
    rows: int = None
    board: list[list] = None
    __winner: int | None = None
    __changed: bool = None
    winning_cells: list[tuple] = None

    def __init__(self, cols, rows):
        self.cols = cols
        self.rows = rows
        self.board = [[None for _ in range(rows)] for _ in range(cols)]
        self.__winner = None
        self.__changed = True
        self.winning_cells = []

    def column_free(self, column):
        return self.board[column][0] is None

    def drop_coin(self, player_id, column):
        for row in range(self.rows - 1, -1, -1):  # Снизу вверх ищем пустую ячейку
            if self.board[column][row] is None:
                self.board[column][row] = player_id
                self.__changed = True
                return True
        return False

    def remove_top_coin(self, column):
        # Удаление верхней фишки из колонки (для отката хода)
        for row in range(self.rows):
            if self.board[column][row] is not None:
                self.board[column][row] = None
                self.__changed = True
                return True
        return False

    def evaluate_sequences(self, player_id, seq_type):
        score = 0

        for col in range(self.cols):
            for row in range(self.rows):
                if seq_type == "horizontal" and col + 3 < self.cols:
                    score += self.score_sequence(player_id,
                                                 [(col + k, row) for k in range(4)])
                if seq_type == "vertical" and row + 3 < self.rows:
                    score += self.score_sequence(player_id,
                                                 [(col, row + k) for k in range(4)])
                if seq_type == "diagonal" and col + 3 < self.cols and row + 3 < self.rows:
                    score += self.score_sequence(player_id,
                                                 [(col + k, row + k) for k in range(4)])
                if seq_type == "reverse_diagonal" and col - 3 >= 0 and row + 3 < self.rows:
                    score += self.score_sequence(player_id,
                                                 [(col - k, row + k) for k in range(4)])
        return score

    def score_sequence(self, player_id, positions):
        # Оценка конкретной последовательности ячеек
        bot = 0
        player = 0

        for col, row in positions:
            if self.board[col][row] == player_id:
                bot += 1
            elif self.board[col][row] is not None:
                player += 1

        if bot > 0 and player > 0:
            return 0
        if bot > 0:
            # Награда за последовательности ИИ
            return {1: 1, 2: 10, 3: 100}.get(bot, 0)
        if player > 0:
            # Штраф за последовательности игрока
            return -{1: 1, 2: 10, 3: 100}.get(player, 0)

        return 0

    def evaluate_board(self, player_id):
        # Полная оценка доски по всем направлениям
        score = 0
        for seq_type in ["horizontal", "vertical", "diagonal", "reverse_diagonal"]:
            score += self.evaluate_sequences(player_id, seq_type)
        return score

    def best_move(self, player_id, depth):
        moves = []
        for col in range(self.cols):
            if not self.drop_coin(player_id, col):
                continue
            score = self.minimax(depth, player_id, False,
                                 float("-inf"), float("inf"))
            moves.append((col, score))
            self.remove_top_coin(col)

        max_score = max(moves, key=lambda x: x[1])[1]
        best_moves = [move[0] for move in moves if move[1] == max_score]
        # Если есть несколько лучших ходов, выбрать случайно
        return random.choice(best_moves)

    def minimax(self, depth, player_id, maximizing_player, alpha, beta):
        # Алгоритм minimax с альфа-бета отсечением
        if self.winner == player_id:
            return (depth + 1) * 900000
        if self.winner and self.winner != player_id:
            return -(depth + 1) * 900000
        if self.is_full:
            return 0
        if depth == 0:
            return self.evaluate_board(player_id)

        if maximizing_player:
            max_eval = float("-inf")
            for col in range(self.cols):
                if not self.drop_coin(player_id, col):
                    continue
                eval = self.minimax(depth - 1, player_id, False, alpha, beta)
                self.remove_top_coin(col)
                max_eval = max(max_eval, eval)
                alpha = max(alpha, eval)
                if beta <= alpha:
                    break  # Альфа-бета отсечение
            return max_eval
        else:
            min_eval = float("inf")
            opponent_id = 2 if player_id == 1 else 1
            for col in range(self.cols):
                if not self.drop_coin(opponent_id, col):
                    continue
                eval = self.minimax(depth - 1, player_id, True, alpha, beta)
                self.remove_top_coin(col)
                min_eval = min(min_eval, eval)
                beta = min(beta, eval)
                if beta <= alpha:
                    break  # Альфа-бета отсечение
            return min_eval

    @property
    def winner(self):
        if not self.__changed:
            return self.__winner

        self.__changed = False
        self.winning_cells = []
        for col in range(self.cols):
            for row in range(self.rows):
                for seq_type in ["horizontal", "vertical", "diagonal", "reverse_diagonal"]:
                    if self.check_winner_sequence(col, row, seq_type):
                        self.__winner = self.board[col][row]
                        return self.__winner

        self.__winner = None
        return self.__winner

    def check_winner_sequence(self, col, row, seq_type):
        if self.board[col][row] is None:
            return False

        player_id = self.board[col][row]
        deltas = {
            "horizontal": (1, 0),
            "vertical": (0, 1),
            "diagonal": (1, 1),
            "reverse_diagonal": (-1, 1),
        }
        dc, dr = deltas[seq_type]

        try:
            winning_cells = [(col, row)]
            for k in range(1, 4):
                c, r = col + k * dc, row + k * dr
                if self.board[c][r] == player_id:
                    winning_cells.append((c, r))
                else:
                    return False
            self.winning_cells = winning_cells
            return True
        except IndexError:
            return False

    @property
    def is_full(self):
        return all(self.board[col][0] is not None for col in range(self.cols))

    def __str__(self):
        board_str = "\n".join(
            "|" + "|".join(
                str(self.board[col][row] or " ") for col in range(self.cols)
            ) + "|"
            for row in range(self.rows)
        )
        board_str += '\n' + "- "*(self.cols + 1)
        return board_str + "\n" + "|" + "|".join(map(str, range(1, self.cols + 1))) + "|"
