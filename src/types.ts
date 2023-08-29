export { Viewport, Constants, Block, Tetrominos, colourMapping }
export type { Key, Event, Direction, State }

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

type Key = "ArrowLeft" | "ArrowUp" | "ArrowRight" | "ArrowDown";

type Event = "keydown" | "keyup" | "keypress";

/** Possible input directions */
type Direction = "left" | "up" | "right" | "down";

/** TETROMINO */

type Tetromino = number[][];

const Tetrominos: Tetromino[] = [ 
  [ // I Tetromino
    [1, 1, 1, 1],
  ],
  [ // J Tetromino
    [2, 0, 0],
    [2, 2, 2],
  ],
  [ // L Tetromino
    [0, 0, 3],
    [3, 3, 3],
  ],
  [ // O Tetromino
    [4, 4],
    [4, 4],
  ],
  [ // S Tetromino
    [0, 5, 5],
    [5, 5, 0],
  ],
  [ // T Tetromino
    [0, 6, 0],
    [6, 6, 6],
  ],
  [ // Z Tetromino
    [7, 7, 0],
    [0, 7, 7],
  ],
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
  currentTetromino: number[][];
}>;