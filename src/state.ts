export { processEvent, TickEvent, InputEvent, clearGame, initialState, updateScore, updatePosition }
import type { State, Direction } from "./types"
import { Constants, Block, Tetrominos } from "./types";

/** Event that represents an input */
class InputEvent {
  constructor(public readonly direction: Direction) {}
}

/** Event that represents a tick to update the rectangle position */
class TickEvent {
  constructor() {}
}

// TODO: create a pseudo-random number sequence Observable that we have complete control over
const randomTetromino = () => Tetrominos[Math.floor(Math.random() * Tetrominos.length)];

const clearGame = () =>
  Array(Constants.GRID_HEIGHT)
    .fill(0)
    .map(block => Array(Constants.GRID_WIDTH).fill(0));

const initialState: State = {
  grid: clearGame(),
  level: 0,
  score: 0,
  highscore: 0,
  linesCleared: 0,
  gameEnd: false,
  col: 4, // starting topLeft x of green
  row: 0, // starting topLeft y of green
  currentTetromino: randomTetromino()
} as const;

/** Processing state */

/**
 * Update state based on the event that comes in.
 */
const processEvent = (event: InputEvent | TickEvent, state: State): State => {
  if (event instanceof TickEvent) return tick(state);
  if (event instanceof InputEvent)
    return move(state, event.direction);

  return state;
};

/**
 * Updates the state by proceeding with one time step.
 *
 * @param s Current state
 * @returns Updated state
 */
const tick = (s: State): State => {
  // Update the tetromino's position
  const newState = ({
    ...s,
    row: s.row + 1,
  });

  return checkCollisions(newState);
};

/**
 * Update the state to change the direction the rectangle
 * is going in.
 */
const move = (state: State, direction: Direction): State => {
  switch (direction) {
    case "left":
    case "right":
      return checkCollisions(checkBounds(state), direction);
    case "down":
      return checkCollisions(checkBounds({ ...state, row: state.row + 1 }));
    case "up":
      return state;
  }
};

const updatePosition = (position: number, column: number) =>
  position === 0 ? column : position;

/**
 * Ensure the rectangle is within bounds.
 */
const checkBounds = (state: State): State => {
  const boundedX = boundX(state);
  const boundedXY = boundY(boundedX);
  return boundedXY;
};

/**
 * Updates the state to ensure the rectangle stays within
 * the x-axis bounds. Will reflect the rectangle in the x-axis if
 * it was out of bounds.
 */
const boundX = (state: State): State => {
  const { col: x, ...rest } = state;

  if (x < 0) {
    return { col: 0, ...rest };
  }

  if (x > Constants.GRID_WIDTH - 1) {
    return { col: Constants.GRID_WIDTH - 1, ...rest };
  }
  return state;
};

/**
 * Updates the state to ensure the rectangle stays within
 * the y-axis bounds. Will reflect the rectangle in the y-axis if
 * it was out of bounds.
 */
const boundY = (state: State): State => {
  const { row: y, ...rest } = state;

  if (y < 0) {
    return { row: 0, ...rest };
  }

  if (y > Constants.GRID_HEIGHT - 1) {
    return { row: Constants.GRID_HEIGHT - 1, ...rest }; 
  }
  return state;
};

const isCollidingAtCell = (
  state: State, 
  i: number, 
  j: number, 
  deltaRow: number = 0, 
  deltaCol: number = 0): boolean => {
  const isOnGround = state.row + state.currentTetromino.length > Constants.GRID_HEIGHT - 1
  if (state.currentTetromino[i][j] !== 0) {
    return !isOnGround && state.grid[i + state.row + deltaRow][j + state.col + deltaCol] !== 0;
  }
  return false;
};

const isStackingOnBlocks = (state: State): boolean => {
  return (state.currentTetromino.some((row, i) => 
    row.some((_, j) => isCollidingAtCell(state, i, j, 1, 0))))
}

const checkStackingOnBlocks = (state: State): State => {
  if (isStackingOnBlocks(state)) {
    return tetrominoLanded(state);
  }
  return state;
};

const checkSideCollisions = (state: State, direction: Direction): State => {
  const deltaCol = direction === "left" ? -1 : 1

  if (state.currentTetromino.some((row, i) => 
    row.some((_, j) => isCollidingAtCell(state, i, j, 0, deltaCol)))) {
    return state;
  }
  return checkStackingOnBlocks({ ...state, col: state.col + deltaCol });
};

const checkCollisions = (state: State, direction: Direction | null = null): State => {
  const isOnGround = state.row + state.currentTetromino.length > Constants.GRID_HEIGHT - 1

  return direction 
  ? checkSideCollisions(state, direction) 
  : isOnGround ? tetrominoLanded(state) : checkStackingOnBlocks(state);
}

/** Lands the current tetromino and adds it to grid */
const tetrominoLanded = (s: State): State => {
  const newGrid = clearGame();

  s.grid.forEach((row, i) => 
    row.forEach((col, j) => 
      newGrid[i][j] = col));

  s.currentTetromino.forEach((row, i) => 
    row.forEach((col, j) => 
      newGrid[i + s.row][j + s.col] = updatePosition(newGrid[i + s.row][j + s.col], col)));

  const newState = { 
    ...s, 
    grid: newGrid, 
    col: 4, 
    row: 0, 
    currentTetromino: randomTetromino() 
  }
  // end game if newly generated tetromino immediately collides with row below
  return isStackingOnBlocks(newState) 
  ? { ...newState, highscore: newState.score, gameEnd: true } 
  : newState;
};

const updateScore = (state: State): State => (filledRowIndex => {
    if (filledRowIndex > -1) {
      // concatenating the rows before and after the filled row, 
      // and adding a new empty row at the beginning.
      const newGrid = [
        Array(Constants.GRID_WIDTH).fill(0),
        ...state.grid.slice(0, filledRowIndex),
        ...state.grid.slice(filledRowIndex + 1)
      ];

      const shouldIncreaseLevel = state.linesCleared + 1 === 10

      return { 
        ...state, 
        grid: newGrid, 
        level: shouldIncreaseLevel ? state.level + 1 : state.level, 
        score: state.score + 10, 
        linesCleared: shouldIncreaseLevel ? 0 : state.linesCleared + 1 
      };
    }
    return state;
  })(state.grid.findIndex(row => row.every(block => block > 0)));