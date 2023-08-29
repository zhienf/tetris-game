export { Viewport, Constants, Block }
export type { Key, Event, Direction, TetrominoProps, Tetromino, State }

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
type TetrominoProps = Readonly<{
  height: number,
  width: number,
  x: number,
  y: number,
  style: string,
}>;

type Tetromino = Readonly<{
  shape: number[][],
  topLeft: { row: number, col: number }
  potentialX: number,
  potentialY: number,
  props: TetrominoProps
}>;

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
  currentTetromino: Tetromino;
}>;