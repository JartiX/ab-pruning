import pygame
import sys
from game import Board

pygame.init()

CELL_SIZE = 100
MARGIN = 10
WIDTH = 7 * CELL_SIZE
HEIGHT = 6 * CELL_SIZE
RADIUS = CELL_SIZE // 2 - MARGIN

BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
RED = (255, 0, 0)
YELLOW = (255, 255, 0)
LIGHT_BLUE = (58, 166, 208)
BLUE = (0, 0, 255)
GREEN = (0, 255, 0)

WINDOW_HEIGHT = HEIGHT + MARGIN*3
screen = pygame.display.set_mode((WIDTH, WINDOW_HEIGHT))
pygame.display.set_caption("4 в ряд")


def draw_board(board_obj, highlight_col=None):
    screen.fill(LIGHT_BLUE)

    for col in range(board_obj.cols):
        for row in range(board_obj.rows):
            pygame.draw.rect(screen, LIGHT_BLUE, (col * CELL_SIZE,
                             row * CELL_SIZE, CELL_SIZE, CELL_SIZE))
            pygame.draw.circle(screen, WHITE, (col * CELL_SIZE +
                               CELL_SIZE // 2, row * CELL_SIZE + CELL_SIZE // 2), RADIUS)

            if board_obj.board[col][row] == 1:
                pygame.draw.circle(screen, RED, (col * CELL_SIZE + CELL_SIZE //
                                   2, row * CELL_SIZE + CELL_SIZE // 2), RADIUS)
            elif board_obj.board[col][row] == 2:
                pygame.draw.circle(screen, BLUE, (col * CELL_SIZE +
                                   CELL_SIZE // 2, row * CELL_SIZE + CELL_SIZE // 2), RADIUS)

    if board_obj.winning_cells:
        winner = board_obj.winner
        color = RED if winner == 1 else BLUE
        for (col, row) in board_obj.winning_cells:
            pygame.draw.circle(screen, WHITE,
                               (col * CELL_SIZE + CELL_SIZE // 2,
                                row * CELL_SIZE + CELL_SIZE // 2),
                               RADIUS + 2, width=6)
            pygame.draw.circle(screen, color,
                               (col * CELL_SIZE + CELL_SIZE // 2,
                                row * CELL_SIZE + CELL_SIZE // 2),
                               RADIUS)

    if highlight_col is not None:
        pygame.draw.rect(screen, GREEN, (highlight_col * CELL_SIZE,
                                         0, CELL_SIZE, HEIGHT), 5)

    pygame.display.flip()


def draw_restart_button():
    font = pygame.font.Font(None, 36)
    text = font.render("Restart", True, WHITE)
    button_outline = pygame.Rect(
        WIDTH // 2 - 75, 40, 155, 45)
    button_rect = pygame.Rect(
        WIDTH // 2 - 75, 40, 150, 40)
    pygame.draw.rect(screen, BLACK, button_outline)
    pygame.draw.rect(screen, RED, button_rect)
    screen.blit(text, (button_rect.x + 25, button_rect.y + 5))
    return button_rect


def draw_current_turn(player_turn):
    font = pygame.font.Font(None, 36)

    if player_turn:
        text = font.render("Ваш ход", True, BLACK)
    else:
        text = font.render("Ход бота", True, BLACK)

    screen.blit(text, (WIDTH // 2 - text.get_width() // 2, 10))


def draw_winner(player_win):
    font = pygame.font.Font(None, 36)

    if player_win:
        text = font.render("Вы победили!", True, BLACK)
    elif player_win is not None:
        text = font.render("Вы проиграли...", True, BLACK)
    else:
        text = font.render("Ничья", True, BLACK)

    screen.blit(text, (WIDTH // 2 - text.get_width() // 2, 10))


def draw_checkbox(is_checked):
    font = pygame.font.Font(None, 34)
    text = font.render("Подсказки", True, WHITE)
    checkbox_rect = pygame.Rect(20, HEIGHT, 25, 25)

    pygame.draw.rect(screen, WHITE, checkbox_rect, 2)
    if is_checked:
        pygame.draw.rect(screen, GREEN, checkbox_rect.inflate(-6, -6))
    else:
        pygame.draw.rect(screen, LIGHT_BLUE, checkbox_rect.inflate(-6, -6))

    screen.blit(text, (checkbox_rect.x + 35, checkbox_rect.y - 5))

    return checkbox_rect


def play_game():
    board = Board(7, 6)
    running = True
    player_turn = True
    game_over = False
    restart_button = None
    analysis_enabled = False
    checkbox_rect = None
    is_analysis_drawn = False
    is_checkbox_drawn = False

    draw_board(board)
    is_tern_drawn = False
    while running:

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

            if event.type == pygame.MOUSEBUTTONDOWN:
                mouse_pos = event.pos

                if checkbox_rect.collidepoint(mouse_pos):
                    analysis_enabled = not analysis_enabled

                # Если игра окончена, проверяем нажатие на кнопку
                if game_over and restart_button:
                    if restart_button.collidepoint(mouse_pos):
                        board = Board(7, 6)
                        player_turn = True
                        game_over = False
                        restart_button = None
                        analysis_enabled = False
                        is_checkbox_drawn = False
                        draw_board(board)
                        continue

                # Если игра не окончена, обрабатываем клики только на игровом поле
                if not game_over:
                    if mouse_pos[1] < HEIGHT:
                        is_tern_drawn = False
                        is_analysis_drawn = False
                        is_checkbox_drawn = False
                        x_pos = mouse_pos[0]
                        col = x_pos // CELL_SIZE
                        if board.column_free(col):
                            board.drop_coin(2, col)
                            draw_board(board)
                            if board.winner == 2:
                                print("Вы победили!")
                                draw_board(board)
                                draw_winner(True)
                                game_over = True
                            elif board.is_full:
                                print("Ничья!")
                                draw_board(board)
                                draw_winner(None)
                                game_over = True
                            player_turn = False
                            break
        if not game_over and not is_tern_drawn:
            draw_current_turn(player_turn)
            pygame.display.flip()
            is_tern_drawn = True

        if not is_checkbox_drawn:
            checkbox_rect = draw_checkbox(analysis_enabled)
            is_checkbox_drawn = True
            pygame.display.flip()
        if player_turn and not game_over and analysis_enabled and not is_analysis_drawn:
            best_move = board.best_move(2, 4)
            draw_board(board, best_move)
            pygame.display.flip()
            is_analysis_drawn = True
            is_checkbox_drawn = False

        if not player_turn and not game_over:
            bot_move = board.best_move(1, 4)
            board.drop_coin(1, bot_move)
            draw_board(board)
            is_tern_drawn = False
            is_analysis_drawn = False
            is_checkbox_drawn = False
            if board.winner == 1:
                print("Бот победил!")
                draw_board(board)
                draw_winner(False)
                game_over = True
            elif board.is_full:
                print("Ничья!")
                draw_board(board)
                draw_winner(None)
                game_over = True
            player_turn = True

        if game_over and not restart_button:
            restart_button = draw_restart_button()

        pygame.display.flip()

    pygame.quit()
    sys.exit()
