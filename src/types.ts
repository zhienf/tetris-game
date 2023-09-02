export { Viewport, Constants, Block, Tetrominos, colourMapping };
export type { Key, Event, Direction, State, Tetromino };

/** Constants */

const Viewport = {
  CANVAS_WIDTH: 200,
  CANVAS_HEIGHT: 400,
  PREVIEW_WIDTH: 160,
  PREVIEW_HEIGHT: 80,
} as const;

const Constants = {
  TICK_RATE_MS: 1000,
  GRID_WIDTH: 10,
  GRID_HEIGHT: 20,
} as const;

const Block = {
  WIDTH: Viewport.CANVAS_WIDTH / Constants.GRID_WIDTH,
  HEIGHT: Viewport.CANVAS_HEIGHT / Constants.GRID_HEIGHT,
} as const;

/**
 * String literal type for each key used in game control
 */
type Key = "ArrowLeft" | "ArrowUp" | "ArrowRight" | "ArrowDown";

/**
 * Input event
 */
type Event = "keydown";

/**
 * Possible input directions
 */
type Direction = "left" | "up" | "right" | "down";

/**
 * State representing the current game state
 */
type State = Readonly<{
  grid: number[][];
  level: number;
  score: number;
  linesCleared: number;
  gameEnd: boolean;
  col: number;
  row: number;
  currentTetromino: Tetromino;
  nextTetromino: Tetromino;
  seed: number;
}>;

/**
 * 2D array representation of a Tetromino
 */
type Tetromino = number[][];

/**
 * An array of Tetrominos representing their shapes
 * */
const Tetrominos: readonly Tetromino[] = [
  [
    // I Tetromino
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    // J Tetromino
    [2, 0, 0],
    [2, 2, 2],
    [0, 0, 0],
  ],
  [
    // L Tetromino
    [0, 0, 3],
    [3, 3, 3],
    [0, 0, 0],
  ],
  [
    // O Tetromino
    [4, 4],
    [4, 4],
  ],
  [
    // S Tetromino
    [0, 5, 5],
    [5, 5, 0],
    [0, 0, 0],
  ],
  [
    // T Tetromino
    [0, 6, 0],
    [6, 6, 6],
    [0, 0, 0],
  ],
  [
    // Z Tetromino
    [7, 7, 0],
    [0, 7, 7],
    [0, 0, 0],
  ],
];

/**
 * Maps numbers to string color names for Tetrominoes.
 */
const colourMapping: Record<number, string> = {
  1: "cyan",
  2: "blue",
  3: "orange",
  4: "yellow",
  5: "green",
  6: "purple",
  7: "red",
} as const;
