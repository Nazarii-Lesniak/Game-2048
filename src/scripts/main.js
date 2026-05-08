'use strict';

const Game = require('../modules/Game.class.js');

const game = new Game();

const elements = {
  score: document.querySelector('.header__score'),
  tileContainer: document.querySelector('.tile-container'),
  gameBoard: document.querySelector('.game-board'),
  startButton: document.querySelector('.header__button--start'),
  messages: [...document.querySelectorAll('.message')],
  winMessage: document.querySelector('.message-win'),
  loseMessage: document.querySelector('.message-lose'),
};

const CLASSES = {
  BUTTON_START: 'header__button--start',
  BUTTON_RESTART: 'header__button--restart',
  TILE: 'tile',
  TILE_NEW: 'tile-new',
  TILE_MERGED: 'tile-merged',
  HIDDEN: 'hidden',
};

const touchStart = {
  x: 0, y: 0,
};

function setTileAttributes(tile, value, col, row) {
  tile.textContent = value.value;

  tile.className = [
    CLASSES.TILE,
    `tile--${value.value}`,
    `tile-position-${col}-${row}`,
  ].join(' ');
}

function handleMergedTile(value, col, row, activeIds) {
  if (!value.mergedId) {
    return;
  }

  const deadTile = document.getElementById(value.mergedId);

  if (deadTile) {
    deadTile.className = [
      CLASSES.TILE,
      `tile--${deadTile.textContent}`,
      `tile-position-${col}-${row}`,
    ].join(' ');

    activeIds.push(value.mergedId);
    setTimeout(() => deadTile.remove(), 150);
  }

  return true;
}

function drawGame() {
  const board = game.getState();

  elements.score.textContent = game.getScore();

  const activeIds = [];

  board.forEach((rowArr, row) => {
    rowArr.forEach((value, col) => {
      if (value === 0) {
        return;
      }

      activeIds.push(value.id);

      let tile = document.getElementById(value.id);

      if (!tile) {
        tile = document.createElement('div');
        tile.id = value.id;
        setTileAttributes(tile, value, col, row);
        elements.tileContainer.appendChild(tile);
        tile.classList.add(CLASSES.TILE_NEW);
      } else {
        setTileAttributes(tile, value, col, row);
      }

      if (handleMergedTile(value, col, row, activeIds)) {
        tile.style.zIndex = 10;
        tile.classList.add(CLASSES.TILE_MERGED);
        setTimeout(() => tile.classList.remove(CLASSES.TILE_MERGED), 200);
        delete value.mergedId;
      }
    });
  });

  elements.tileContainer
    .querySelectorAll(`.${CLASSES.TILE}`)
    .forEach((tile) => {
      if (!activeIds.includes(tile.id)) {
        tile.remove();
      }
    });
}

function showStatusMessage(status) {
  elements.messages.forEach((m) => m.classList.add(CLASSES.HIDDEN));

  if (status === 'win') {
    elements.winMessage.classList.remove(CLASSES.HIDDEN);
  }

  if (status === 'lose') {
    elements.loseMessage.classList.remove(CLASSES.HIDDEN);
  }
}

function updateButtonToRestart() {
  if (elements.startButton.classList.contains(CLASSES.BUTTON_START)) {
    elements.startButton.classList.replace(
      CLASSES.BUTTON_START,
      CLASSES.BUTTON_RESTART,
    );
    elements.startButton.textContent = 'Restart';
  }
}

elements.startButton.addEventListener('click', (event) => {
  event.preventDefault();
  elements.messages.forEach((m) => m.classList.add(CLASSES.HIDDEN));

  if (elements.startButton.classList.contains(CLASSES.BUTTON_START)) {
    game.start();
    updateButtonToRestart();
  } else {
    game.restart();
    game.start();
  }
  drawGame();
});

document.addEventListener('keydown', (event) => {
  const keyMap = {
    ArrowUp: () => game.moveUp(),
    ArrowDown: () => game.moveDown(),
    ArrowLeft: () => game.moveLeft(),
    ArrowRight: () => game.moveRight(),
  };

  if (!keyMap[event.key] || game.getStatus() !== 'playing') {
    return;
  }

  event.preventDefault();

  if (keyMap[event.key]()) {
    drawGame();
    updateButtonToRestart();
    showStatusMessage(game.getStatus());
  }
});

elements.gameBoard.addEventListener(
  'touchstart',
  (event) => {
    touchStart.x = event.touches[0].screenX;
    touchStart.y = event.touches[0].screenY;
  },
  { passive: true },
);

elements.gameBoard.addEventListener(
  'touchend',
  (event) => {
    const dx = event.changedTouches[0].screenX - touchStart.x;
    const dy = event.changedTouches[0].screenY - touchStart.y;
    const threshold = 30;

    if (Math.abs(dx) <= threshold && Math.abs(dy) <= threshold) {
      return;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      dx > 0 ? game.moveRight() : game.moveLeft();
    } else {
      dy > 0 ? game.moveDown() : game.moveUp();
    }

    drawGame();
    showStatusMessage(game.getStatus());
  },
  { passive: true },
);

function init() {
  const status = game.getStatus();

  if (status === 'idle') {
    return;
  }

  elements.messages.forEach((m) => m.classList.add(CLASSES.HIDDEN));
  updateButtonToRestart();
  drawGame();
  showStatusMessage(status);
}

init();
