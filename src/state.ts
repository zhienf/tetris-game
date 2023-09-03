export {
  processEvent,
  TickEvent,
  InputEvent,
  clearGame,
  updateScore,
  updatePosition,
  createNewState,
};
import type { State, Direction, Tetromino } from "./types";
import { Constants, Tetrominos } from "./types";
import { RNG } from "./util";

/** Initial state set up */

/**
 * Creates and returns a new empty game grid, represented as a 2D array.
 * The dimensions of the grid are determined by Constants.GRID_HEIGHT and Constants.GRID_WIDTH.
 */
const clearGame = (): number[][] =>
  Array(Constants.GRID_HEIGHT)
    .fill(0)
    .map((_) => Array(Constants.GRID_WIDTH).fill(0));

/**
 * Generates a random Tetromino based on a given random number.
 */
const randomTetromino = (randomNumber: number): Tetromino =>
  Tetrominos[Math.floor(RNG.scale(randomNumber) * Tetrominos.length)];

/**
 * Creates a new game state, either from scratch or based on a previous state.
 *
 * @param {State | null} previousState - The previous game state to continue from or null to start a new game.
 * @returns {State} A new game state with the specified parameters.
 */
const createNewState = (previousState: State | null = null): State => {
  const seed = Date.now();

  // Generate random numbers for Tetromino selection
  const randomNumber1 = RNG.hash(seed);
  const randomNumber2 = RNG.hash(randomNumber1);

  // Generate initial Tetrominos
  const newTetromino1: Tetromino = randomTetromino(randomNumber1);
  const newTetromino2: Tetromino = randomTetromino(randomNumber2);

  if (previousState) {
    const newState: State = {
      ...previousState,
      col: Math.floor(
        (Constants.GRID_WIDTH - previousState.nextTetromino.length) / 2
      ),
      row: findFirstNonEmptyRowIndex(previousState.nextTetromino),
      currentTetromino: previousState.nextTetromino,
      nextTetromino: randomTetromino(previousState.seed),
      seed: RNG.hash(previousState.seed),
    };
    return newState;
  }

  const initialState: State = {
    grid: clearGame(),
    level: 0,
    score: 0,
    linesCleared: 0,
    gameEnd: false,
    col: Math.floor((Constants.GRID_WIDTH - newTetromino1.length) / 2),
    row: findFirstNonEmptyRowIndex(newTetromino1),
    currentTetromino: newTetromino1,
    nextTetromino: newTetromino2,
    seed: RNG.hash(randomNumber2),
  } as const;
  return initialState;
};

/** Processing state */

/**
 * Event that represents an input
 * Referred to FIT2102 tutorial 5 supplementary solution.
 * */
class InputEvent {
  constructor(public readonly direction: Direction) {}
}

/**
 * Event that represents a tick to update the tetromino's position
 * Referred to FIT2102 tutorial 5 supplementary solution.
 * */
class TickEvent {
  constructor() {}
}

/**
 * Update state based on the event that comes in.
 * Referred to FIT2102 tutorial 5 supplementary solution.
 */
const processEvent = (event: InputEvent | TickEvent, state: State): State => {
  if (event instanceof TickEvent) return tick(state);
  if (event instanceof InputEvent) return move(state, event.direction);
  return state;
};

/**
 * Updates the state by proceeding with one time step.
 *
 * @param s Current state
 * @returns Updated state
 */
const tick = (s: State): State =>
  checkBounds(checkCollisions({ ...s, row: s.row + 1 }));

/**
 * Update the state to change the direction the tetromino
 * is going in.
 * Referred to FIT2102 tutorial 5 supplementary solution.
 */
const move = (state: State, direction: Direction): State => {
  switch (direction) {
    case "left":
    case "right":
      return checkBounds(checkCollisions(state, direction));
    case "down":
      return checkBounds(checkCollisions({ ...state, row: state.row + 1 }));
    case "up":
      return checkBounds(rotate(state));
  }
};

/**
 * Updates the position of a cell in the game grid.
 *
 * @param {number} position - The current position of the cell (0 if empty or a color code if occupied).
 * @param {number} column - The new color code for the cell (0 if empty or a valid color code if occupied).
 * @returns {number} The updated position of the cell after considering the new column value.
 */
const updatePosition = (position: number, column: number) =>
  position === 0 ? column : position;

/**
 * Ensure the tetromino is within bounds.
 * Referred to FIT2102 tutorial 5 supplementary solution.
 */
const checkBounds = (state: State): State => {
  const boundedX = boundX(state);
  const boundedXY = boundY(boundedX);
  return boundedXY;
};

/**
 * Updates the state to ensure the tetromino stays within
 * the x-axis bounds. Will reposition the rectangle in the x-axis if
 * it was out of bounds.
 * Referred to FIT2102 tutorial 5 supplementary solution.
 */
const boundX = (state: State): State => {
  const { col: x, ...rest } = state;
  // if out of horizontal bounds, 
  // check if the part of tetromino going out of bound is all empty cells,
  // if yes allow it to be out of bound,
  // else reposition it back to previous position to stay in bound.
  // this also allows wall kicks.
  if (x < 0)
    return state.currentTetromino.every(
      (row) => row.length > 0 && row[-x - 1] === 0
    )
      ? state
      : { col: 0, ...rest };

  if (x > Constants.GRID_WIDTH - state.currentTetromino.length)
    return state.currentTetromino.every(
      (row) => row.length > 0 && row[Constants.GRID_WIDTH - x] === 0
    )
      ? state
      : { col: Constants.GRID_WIDTH - state.currentTetromino.length, ...rest };

  return state;
};

/**
 * Updates the state to ensure the tetromino stays within
 * the y-axis bounds. Will reposition the tetromino in the y-axis if
 * it was out of bounds.
 * Referred to FIT2102 tutorial 5 supplementary solution.
 */
const boundY = (state: State): State => {
  const { row: y, ...rest } = state;
  // if out of vertical bounds, 
  // check if the part of tetromino going out of bound is all empty cells,
  // if yes allow it to be out of bound,
  // else reposition it back to previous position to stay in bound.
  // this also allows floor kicks.
  if (y < 0)
    return state.currentTetromino[-y - 1].every((col) => col === 0)
      ? state
      : { row: 0, ...rest };

  if (y > Constants.GRID_HEIGHT - state.currentTetromino.length)
    return state.currentTetromino[Constants.GRID_HEIGHT - y].every(
      (col) => col === 0
    )
      ? state
      : { row: Constants.GRID_HEIGHT - state.currentTetromino.length, ...rest };

  return state;
};

/**
 * Find index of the first non-empty row of tetromino
 */
const findFirstNonEmptyRowIndex = (tetromino: Tetromino): number =>
  -tetromino.findIndex((row) => row.some((block) => block !== 0));

/**
 * Find index of the last non-empty row of tetromino
 * by reducing the array to a single value
 * based on the input array and an initial value
 */
const findLastNonEmptyRowIndex = (state: State): number =>
  state.currentTetromino.reduceRight(
    (result, row, index) =>
      result === -1 && row.some((block) => block !== 0) ? index : result,
    -1
  );

/**
 * Check if the tetromino is on the ground.
 */
const isOnGround = (state: State): boolean =>
  state.row + findLastNonEmptyRowIndex(state) === Constants.GRID_HEIGHT - 1;

/**
 * Check if there's a collision at a specific cell of the tetromino.
 *
 * @param {State} state - The current game state.
 * @param {number} i - The row index of the cell.
 * @param {number} j - The column index of the cell.
 * @param {number} deltaRow - Optional. Row offset.
 * @param {number} deltaCol - Optional. Column offset.
 * @returns {boolean} True if there's a collision at the cell, false otherwise.
 */
const isCollidingAtCell = (
  state: State,
  i: number,
  j: number,
  deltaRow: number = 0,
  deltaCol: number = 0
): boolean =>
  state.currentTetromino[i][j] !== 0
    ? !isOnGround(state) &&
      state.grid[i + state.row + deltaRow][j + state.col + deltaCol] !== 0
    : false;

/**
 * Check if the tetromino is stacking on blocks below it.
 */
const isStackingOnBlocks = (state: State): boolean =>
  state.currentTetromino.some((row, i) =>
    row.some((_, j) => isCollidingAtCell(state, i, j, 1, 0))
  );

const checkStackingOnBlocks = (state: State): State =>
  // if is stacking on blocks, land it, else update the new position
  isStackingOnBlocks(state) ? tetrominoLanded(state) : state;

/**
 * Check if there's a side collision for the tetromino.
 */
const isSideColliding = (state: State, deltaCol: number): boolean =>
  state.currentTetromino.some((row, i) =>
    row.some((_, j) => isCollidingAtCell(state, i, j, 0, deltaCol))
  );

const checkSideCollisions = (state: State, direction: Direction): State =>
  ((deltaCol) =>
    // check if the potential position would cause collision
    // if yes revert back to previous position
    // else update new position and check for stacking on blocks
    isSideColliding(state, deltaCol)
      ? state
      : checkStackingOnBlocks({ ...state, col: state.col + deltaCol }))(
    direction === "left" ? -1 : 1
  );

/**
 * Check for collisions in the specified direction or handle landing when the tetromino is on the ground.
 *
 * @param {State} state - The current game state.
 * @param {Direction | null} direction - Optional. The direction of movement (left or right).
 * @returns {State} The updated game state after handling collisions.
 */
const checkCollisions = (
  state: State,
  direction: Direction | null = null
): State =>
  // if direction (left / right) is specified, check for side collisions,
  // else check if it is on ground yet, 
  // if yes land it, if not check whether it's stacking on other blocks
  direction
    ? checkSideCollisions(state, direction)
    : isOnGround(state)
    ? tetrominoLanded(state)
    : checkStackingOnBlocks(state);

/**
 * Lands the current tetromino and adds it to grid
 */
const tetrominoLanded = (s: State): State => {
  const newGrid = clearGame();

  // Copy the existing grid into the new grid
  s.grid.forEach((row, i) => row.forEach((col, j) => (newGrid[i][j] = col)));

  // Copy the current tetromino onto the new grid, updating positions
  s.currentTetromino.forEach((row, i) =>
    row.forEach((col, j) => {
      // filtering out of bound columns
      if (col !== 0)
        newGrid[i + s.row][j + s.col] = updatePosition(
          newGrid[i + s.row][j + s.col],
          col
        );
    })
  );

  // Create a new state with the updated game grid
  const newState = createNewState({
    ...s,
    grid: newGrid,
  });

  // End game if newly generated tetromino exceeds top of the grid
  return isStackingOnBlocks(newState)
    ? { ...newState, gameEnd: true }
    : newState;
};

/**
 * Update the game score and level based on filled rows.
 */
const updateScore = (state: State): State =>
  ((filledRowIndex) => {
    if (filledRowIndex > -1) {
      // Find the index of the filled row.
      // If no row is filled, filledRowIndex will be -1.
      // concatenating the rows before and after the filled row,
      // and adding a new empty row at the beginning.
      const newGrid = [
        Array(Constants.GRID_WIDTH).fill(0),
        ...state.grid.slice(0, filledRowIndex),
        ...state.grid.slice(filledRowIndex + 1),
      ];

      const shouldIncreaseLevel = state.linesCleared + 1 === 10;

      return {
        ...state,
        grid: newGrid,
        level: shouldIncreaseLevel ? state.level + 1 : state.level,
        score: state.score + 10,
        linesCleared: shouldIncreaseLevel ? 0 : state.linesCleared + 1,
      };
    }
    return state;
  })(state.grid.findIndex((row) => row.every((block) => block !== 0)));

/**
 * Rotate the current tetromino clockwise.
 */
const rotate = (state: State): State => {
  // Create a new rotated tetromino by swapping rows and columns using matrix transpose
  const rotatedTetromino = state.currentTetromino[0].map((_, j) =>
    state.currentTetromino.map((row) => row[j]).reverse()
  );

  const newState = checkBounds({
    ...state,
    currentTetromino: rotatedTetromino,
  });

  // Check if there are side collisions after rotation.
  // If there are side collisions, revert to the previous state.
  return isSideColliding(newState, 0) ? state : checkCollisions(newState);
};
