export { Viewport, Constants, Block, Tetrominos, colourMapping }
export type { Key, Event, Direction, TetrominoType, State }

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
};

/** User input */

type Key = "KeyS" | "KeyA" | "KeyD";

type Event = "keydown" | "keyup" | "keypress";

/** Possible input directions */
type Direction = "left" | "right" | "down";

/** Utility functions */

/** TETROMINO */
type TetrominoType = Readonly<{
  shape: number[][];
  colour: string;
}>;

const Tetrominos: TetrominoType[] = [
  { // I Tetromino
    shape: [
      [1, 1, 1, 1],
    ],
    colour: 'cyan',
  },
  { // J Tetromino
    shape: [
      [2, 0, 0],
      [2, 2, 2],
    ],
    colour: 'blue',
  },
  { // L Tetromino
    shape: [
      [0, 0, 3],
      [3, 3, 3],
    ],
    colour: 'orange',
  },
  { // O Tetromino
    shape: [
      [4, 4],
      [4, 4],
    ],
    colour: 'yellow',
  },
  { // S Tetromino
    shape: [
      [0, 5, 5],
      [5, 5, 0],
    ],
    colour: 'green',
  },
  { // T Tetromino
    shape: [
      [0, 6, 0],
      [6, 6, 6],
    ],
    colour: 'purple',
  },
  { // Z Tetromino
    shape: [
      [7, 7, 0],
      [0, 7, 7],
    ],
    colour: 'red',
  },
];

const colourMapping: Record<number, string> = {
  1: 'cyan',          
  2: 'blue',
  3: 'orange',
  4: 'yellow',
  5: 'green',
  6: 'purple',
  7: 'red'
};

/** State processing */

type State = Readonly<{
  grid: number[][];
  level: number;
  score: number;
  highscore: number;
  linesCleared: number;
  gameEnd: boolean;
  col: number;
  row: number;
  currentTetromino: TetrominoType;
}>;