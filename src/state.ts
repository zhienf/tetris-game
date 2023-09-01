export { processEvent, TickEvent, InputEvent, clearGame, updateScore, updatePosition, createNewState }
import type { State, Direction, Tetromino } from "./types"
import { Constants, Block, Tetrominos } from "./types";

/** Event that represents an input */
class InputEvent {
  constructor(public readonly direction: Direction) {}
}

/** Event that represents a tick to update the rectangle position */
class TickEvent {
  constructor() {}
}

// const randomTetromino = (randomNumber: number): Tetromino => Tetrominos[Math.floor(RNG.scale(randomNumber) * Tetrominos.length)];
const randomTetromino = (randomNumber: number) => Tetrominos[Math.floor(Math.random() * Tetrominos.length)];

/**
 * A random number generator which provides two pure functions
 * `hash` and `scaleToRange`.  Call `hash` repeatedly to generate the
 * sequence of hashes.
 */
abstract class RNG {
  // LCG using GCC's constants
  private static m = 0x80000000; // 2**31
  private static a = 1103515245;
  private static c = 12345;

  /**
   * Call `hash` repeatedly to generate the sequence of hashes.
   * @param seed
   * @returns a hash of the seed
   */
  public static hash = (seed: number) => (RNG.a * seed + RNG.c) % RNG.m;

  /**
   * Takes hash value and scales it to the range [0, 1)
   */
  // public static scale = (hash: number) => (2 * hash) / (RNG.m - 1) - 1;
  public static scale = (hash: number) => (hash + RNG.m) / (2 * RNG.m);
}

const clearGame = () =>
  Array(Constants.GRID_HEIGHT)
    .fill(0)
    .map(block => Array(Constants.GRID_WIDTH).fill(0));

const createNewState = (previousState: State | null = null): State => {
  const seed =  12345678
  const randomNumber1 = RNG.hash(seed);
  const randomNumber2 = RNG.hash(randomNumber1);
  const newTetromino1: Tetromino = randomTetromino(randomNumber1);
  const newTetromino2: Tetromino = randomTetromino(randomNumber2);

  if (previousState) {
    const newState: State = {
      ...previousState, 
      col: Math.floor((Constants.GRID_WIDTH - previousState.nextTetromino.length) / 2), 
      row: 0, 
      currentTetromino: previousState.nextTetromino,
      nextTetromino: randomTetromino(previousState.seed),
      seed: RNG.hash(previousState.seed)
    }
    return newState;
  }
  const initialState: State = {
    grid: clearGame(),
    level: 0,
    score: 0,
    highscore: 0,
    linesCleared: 0,
    gameEnd: false,
    col: Math.floor((Constants.GRID_WIDTH - newTetromino1.length) / 2), 
    row: 0, 
    currentTetromino: newTetromino1,
    nextTetromino: newTetromino2,
    seed: RNG.hash(randomNumber2)
  } as const;
  return initialState;
};

/** Processing state */

/**
 * Update state based on the event that comes in.
 */
const processEvent = (event: InputEvent | TickEvent, state: State): State => {
  console.log(state.seed, RNG.scale(state.seed))
  if (event instanceof TickEvent) 
    return tick(state);
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

  return checkBounds(checkCollisions(newState));
};

/**
 * Update the state to change the direction the rectangle
 * is going in.
 */
const move = (state: State, direction: Direction): State => {
  switch (direction) {
    case "left":
    case "right":
      return checkBounds(checkCollisions(state, direction))
    case "down":
      return checkBounds(checkCollisions({ ...state, row: state.row + 1 }));
    case "up":
      return checkBounds(rotate(state));
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

  if (x < 0) 
    return (state.currentTetromino.every(row => row.length > 0 && row[-x - 1] === 0)) 
      ? state : { col: 0, ...rest };

  if (x > Constants.GRID_WIDTH - state.currentTetromino.length)
    return (state.currentTetromino.every(row => row.length > 0 && row[Constants.GRID_WIDTH - x] === 0))
      ? state : { col: Constants.GRID_WIDTH - state.currentTetromino.length, ...rest };

  return state;
};

/**
 * Updates the state to ensure the rectangle stays within
 * the y-axis bounds. Will reflect the rectangle in the y-axis if
 * it was out of bounds.
 */
const boundY = (state: State): State => {
  const { row: y, ...rest } = state;

  if (y < 0) 
    return (state.currentTetromino[-y - 1].every(col => col === 0)) 
      ? state : { row: 0, ...rest };

  if (y > Constants.GRID_HEIGHT - state.currentTetromino.length) 
    return (state.currentTetromino[Constants.GRID_HEIGHT - y].every(col => col === 0)) 
      ? state : { row: Constants.GRID_HEIGHT - state.currentTetromino.length, ...rest }; 

  return state;
};

/**  
 * reducing the array to a single value (the index of the last non-empty row) 
 * based on the input array and an initial value
 */ 
const findLastNonEmptyRowIndex = (state: State): number => 
  state.currentTetromino.reduceRight((result, row, index) => 
    (result === -1 && row.some(block => block !== 0)) ? index : result, -1);

const isOnGround = (state: State): boolean => 
  state.row + findLastNonEmptyRowIndex(state) === Constants.GRID_HEIGHT - 1;

const isCollidingAtCell = (
  state: State, 
  i: number, 
  j: number, 
  deltaRow: number = 0, 
  deltaCol: number = 0): boolean => 
    state.currentTetromino[i][j] !== 0 
    ? !isOnGround(state) && state.grid[i + state.row + deltaRow][j + state.col + deltaCol] !== 0
    : false;

const isStackingOnBlocks = (state: State): boolean => 
  (state.currentTetromino.some((row, i) => 
    row.some((_, j) => isCollidingAtCell(state, i, j, 1, 0))));

const checkStackingOnBlocks = (state: State): State => 
  isStackingOnBlocks(state) ? tetrominoLanded(state) : state;

const isSideColliding = (state: State, deltaCol: number): boolean => 
  state.currentTetromino.some((row, i) => 
    row.some((_, j) => isCollidingAtCell(state, i, j, 0, deltaCol)));

const checkSideCollisions = (state: State, direction: Direction): State => {
  const deltaCol = direction === "left" ? -1 : 1
  return isSideColliding(state, deltaCol) 
    ? state : checkStackingOnBlocks({ ...state, col: state.col + deltaCol });
};

const checkCollisions = (state: State, direction: Direction | null = null): State => 
  direction ? checkSideCollisions(state, direction) 
    : isOnGround(state) ? tetrominoLanded(state) 
    : checkStackingOnBlocks(state);

/** Lands the current tetromino and adds it to grid */
const tetrominoLanded = (s: State): State => {
  const newGrid = clearGame();

  s.grid.forEach((row, i) => 
    row.forEach((col, j) => 
      newGrid[i][j] = col));

  s.currentTetromino.forEach((row, i) => 
    row.forEach((col, j) => {
      // filtering out of bound columns
      if (col !== 0) {
        newGrid[i + s.row][j + s.col] = updatePosition(newGrid[i + s.row][j + s.col], col)
      }
    }));

  const newState = createNewState({ 
    ...s, 
    grid: newGrid, 
  })
  // end game if newly generated tetromino immediately collides with row below
  return isStackingOnBlocks((newState)) 
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
  })(state.grid.findIndex(row => row.every(block => block !== 0)));

const rotate = (state: State): State => {
  const rotatedTetromino = state.currentTetromino[0].map((_, j) =>
    state.currentTetromino.map(row => row[j]).reverse()
  );
  const newState = checkBounds({ ...state, currentTetromino: rotatedTetromino });

  return isSideColliding(newState, 0) ? state : checkCollisions(newState);
};