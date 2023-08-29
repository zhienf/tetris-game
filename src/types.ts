export { Viewport, Constants, Block, Tetrominos }
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
      [1, 0, 0],
      [1, 1, 1],
    ],
    colour: 'blue',
  },
  { // L Tetromino
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    colour: 'orange',
  },
  { // O Tetromino
    shape: [
      [1, 1],
      [1, 1],
    ],
    colour: 'yellow',
  },
  { // S Tetromino
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    colour: 'green',
  },
  { // T Tetromino
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    colour: 'purple',
  },
  { // Z Tetromino
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    colour: 'red',
  },
];

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