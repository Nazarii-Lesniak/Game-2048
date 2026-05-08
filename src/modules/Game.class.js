'use strict';

const GRID_SIZE = 4;

function copyBoard(board) {
  if (typeof structuredClone === 'function') {
    return structuredClone(board);
  }

  return JSON.parse(JSON.stringify(board));
}

function createEmptyBoard() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

class Game {
  constructor(initialState) {
    this.initialState = initialState
      ? copyBoard(initialState)
      : createEmptyBoard();

    if (!this._loadState()) {
      this._resetState();
    }
  }

  _resetState() {
    this.board = copyBoard(this.initialState);
    this.score = 0;
    this.status = 'idle';
  }

  _loadState() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = window.localStorage.getItem('2048_game_state');

        if (data) {
          const savedState = JSON.parse(data);

          this.board = savedState.board;
          this.score = savedState.score;
          this.status = savedState.status;

          return true;
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load save:', error);
    }

    return false;
  }

  saveState() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(
          '2048_game_state',
          JSON.stringify({
            board: this.board,
            score: this.score,
            status: this.status,
          }),
        );
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to save state:', error);
    }
  }

  getScore() {
    return this.score;
  }

  getState() {
    return this.board;
  }

  getStatus() {
    return this.status;
  }

  _executeMove(moveLogic) {
    if (this.status !== 'playing') {
      return false;
    }

    const oldBoard = JSON.stringify(this.board);

    moveLogic();

    const isChanged = oldBoard !== JSON.stringify(this.board);

    if (isChanged) {
      this.afterMove();
    }

    return isChanged;
  }

  moveLeft() {
    return this._executeMove(() => {
      this.board = this.board.map((row) => this.processRow(row));
    });
  }

  moveRight() {
    return this._executeMove(() => {
      this.board = this.board.map((row) => {
        const reversed = [...row].reverse();

        return this.processRow(reversed).reverse();
      });
    });
  }

  moveUp() {
    return this._executeMove(() => {
      for (let i = 0; i < GRID_SIZE; i++) {
        const column = this.board.map((row) => row[i]);
        const processedColumn = this.processRow(column);

        for (let j = 0; j < GRID_SIZE; j++) {
          this.board[j][i] = processedColumn[j];
        }
      }
    });
  }

  moveDown() {
    return this._executeMove(() => {
      for (let i = 0; i < GRID_SIZE; i++) {
        const column = this.board.map((row) => row[i]);
        const processedColumn = this.processRow(
          [...column].reverse(),
        ).reverse();

        for (let j = 0; j < GRID_SIZE; j++) {
          this.board[j][i] = processedColumn[j];
        }
      }
    });
  }

  start() {
    this.board = copyBoard(this.initialState);
    this.status = 'playing';
    this.score = 0;
    this.addRandomTile();
    this.addRandomTile();
    this.saveState();
  }

  restart() {
    this._resetState();

    try {
      window.localStorage.removeItem('2048_game_state');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }

  processRow(row) {
    const numbers = row.filter((cell) => cell !== 0);

    for (let i = 0; i < numbers.length - 1; i++) {
      if (numbers[i].value === numbers[i + 1].value) {
        const sum = numbers[i].value * 2;

        numbers[i].value = sum;
        numbers[i].mergedId = numbers[i + 1].id;
        numbers[i + 1] = 0;

        this.score += sum;
        i++;
      }
    }

    const result = numbers.filter((n) => n !== 0);

    while (result.length < GRID_SIZE) {
      result.push(0);
    }

    return result;
  }

  addRandomTile() {
    const emptyCells = [];

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (this.board[row][col] === 0) {
          emptyCells.push({
            row,
            col,
          });
        }
      }
    }

    if (emptyCells.length === 0) {
      return;
    }

    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const { row: targetRow, col: targetCol } = emptyCells[randomIndex];

    this.board[targetRow][targetCol] = {
      id: Math.random().toString(36).substring(2, 10),
      value: Math.random() < 0.9 ? 2 : 4,
    };
  }

  afterMove() {
    this.addRandomTile();

    const win = this.board.some((row) =>
      row.some((cell) => cell !== 0 && cell.value === 2048),
    );

    if (win) {
      this.status = 'win';
    } else if (this.isGameOver()) {
      this.status = 'lose';
    }

    this.saveState();
  }

  isGameOver() {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (this.board[row][col] === 0) {
          return false;
        }
      }
    }

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const current = this.board[row][col].value;

        if (col < GRID_SIZE - 1 && current === this.board[row][col + 1].value) {
          return false;
        }

        if (row < GRID_SIZE - 1 && current === this.board[row + 1][col].value) {
          return false;
        }
      }
    }

    return true;
  }
}

module.exports = Game;
