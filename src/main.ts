/**
 * Inside this file you will use the classes and functions from rx.js
 * to add visuals to the svg element in index.html, animate them, and make them interactive.
 *
 * Study and complete the tasks in observable exercises first to get ideas.
 *
 * Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/
 *
 * You will be marked on your functional programming style
 * as well as the functionality that you implement.
 *
 * Document your code!
 */

import "./style.css";

import { fromEvent, interval, merge } from "rxjs";
import { map, filter, scan } from "rxjs/operators";

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

const tetrominoGreen: Tetromino = { 
  shape: [
    [1], 
  ], 
  topLeft: {
    row: 0,
    col: 4
  },
  potentialX: 0,
  potentialY: 4,
  props: {
    height: Block.HEIGHT,
    width: Block.WIDTH,
    x: Block.WIDTH,
    y: Block.HEIGHT,
    style: "fill: green",
  }
};

const randomBrick = () => tetrominoGreen;

const clearGame = () =>
  Array(Constants.GRID_HEIGHT)
    .fill(0)
    .map(e => Array(Constants.GRID_WIDTH).fill(0));

const updatePosition = (position: number, column: number) =>
position === 0 ? column : position; // if col is 0, update with 1

/** State processing */

type State = Readonly<{
  grid: number[][];
  gameEnd: boolean;
  col: number;
  row: number;
  currentTetromino: Tetromino;
}>;

const initialState: State = {
  grid: clearGame(),
  gameEnd: false,
  col: 4, // starting topLeft x of green
  row: 0, // starting topLeft y of green
  currentTetromino: tetrominoGreen
} as const;

/**
 * Ensure the rectangle is within bounds.
 */
const checkBounds = (state: State): State => {
  const boundedX = boundX(state);
  const boundedXY = boundY(boundedX);
  return boundedXY;
};

const checkStacking = (state: State): State => {
  // checks whether the next potential position would go out of bound
  // if yes, stop falling and add current tetro to grid
  const isOnGround = state.row + state.currentTetromino.shape.length > Constants.GRID_HEIGHT - 1

  const isStackingOnBlocks = (state: State): boolean => {
    const isCollidingAtCell = (i: number, j: number, deltaRow: number): boolean => {
      if (state.currentTetromino.shape[i][j] !== 0) {
        return !isOnGround && state.grid[i + state.row + deltaRow][j + state.col] !== 0;
      }
      return false;
    };
    return state.currentTetromino.shape.some((row, i) => row.some((_, j) => isCollidingAtCell(i, j, 1)));
  };

  if (isStackingOnBlocks(state) || isOnGround) {
    return tetrominoLanded(state);
  }
  return state;
};

const checkSideCollisions = (state: State, direction: Direction): State => {
  const isCollidingAtCell = (i: number, j: number, deltaCol: number): boolean => {
    if (state.currentTetromino.shape[i][j] !== 0) {
      return state.grid[i + state.row][j + state.col + deltaCol] !== 0;
    }
    return false;
  };

  const deltaCol = direction === "left" ? -1 : 1

  if (state.currentTetromino.shape.some((row, i) => row.some((_, j) => isCollidingAtCell(i, j, deltaCol)))) {
    return state;
  }
  return { ...state, col: state.col + deltaCol };
}

/** Lands the current tetromino and adds it to grid */
const tetrominoLanded = (s: State): State => {
  const newGrid = clearGame();

  s.grid.forEach((row, i) => 
    row.forEach((col, j) => 
      newGrid[i][j] = col));

  s.currentTetromino.shape.forEach((row, i) => 
    row.forEach((col, j) => {
      console.log(s.row, s.col)
      newGrid[i + s.row][j + s.col] = col
    }))

  const newState = { ...s, grid: newGrid, col: 4, row: 0, currentTetromino: randomBrick() }
  return newState;
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

  return checkStacking(newState); // check if tetromino should land
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

/** Rendering (side effects) */

/**
 * Displays a SVG element on the canvas. Brings to foreground.
 * @param elem SVG element to display
 */
const show = (elem: SVGGraphicsElement) => {
  elem.setAttribute("visibility", "visible");
  elem.parentNode!.appendChild(elem);
};

/**
 * Hides a SVG element on the canvas.
 * @param elem SVG element to hide
 */
const hide = (elem: SVGGraphicsElement) =>
  elem.setAttribute("visibility", "hidden");

/**
 * Creates an SVG element with the given properties.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/SVG/Element for valid
 * element names and properties.
 *
 * @param namespace Namespace of the SVG element
 * @param name SVGElement name
 * @param props Properties to set on the SVG element
 * @returns SVG element
 */
const createSvgElement = (
  namespace: string | null,
  name: string,
  props: TetrominoProps,
  column: number
) => {
  const elem = document.createElementNS(namespace, name) as SVGElement;
  if (column === 1) {
    Object.entries(props).forEach(([k, v]) => elem.setAttribute(k, String(v)));
  }
  return elem;
};

/**
 * This is the function called on page load. Your main game loop
 * should be called here.
 */
export function main() {
  // Canvas elements
  const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
    HTMLElement;
  const preview = document.querySelector("#svgPreview") as SVGGraphicsElement &
    HTMLElement;
  const gameover = document.querySelector("#gameOver") as SVGGraphicsElement &
    HTMLElement;
  const container = document.querySelector("#main") as HTMLElement;

  svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`);
  svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`);
  preview.setAttribute("height", `${Viewport.PREVIEW_HEIGHT}`);
  preview.setAttribute("width", `${Viewport.PREVIEW_WIDTH}`);

  // Text fields
  const levelText = document.querySelector("#levelText") as HTMLElement;
  const scoreText = document.querySelector("#scoreText") as HTMLElement;
  const highScoreText = document.querySelector("#highScoreText") as HTMLElement;

  /** Event that represents an input */
  class InputEvent {
    constructor(public readonly direction: Direction) {}
  }

  /** Event that represents a tick to update the rectangle position */
  class TickEvent {
    constructor() {}
  }

  /** User input */

  const key$ = fromEvent<KeyboardEvent>(document, "keypress");

  const fromKey = (keyCode: Key, direction: Direction) =>
    key$.pipe(
      filter(({ code }) => code === keyCode),
      map(() => new InputEvent(direction))
    );

  const left$ = fromKey("KeyA", "left");
  const right$ = fromKey("KeyD", "right");
  const down$ = fromKey("KeyS", "down");
  const input$ = merge(left$, right$, down$);

  /** Observables */

  /** Determines the rate of time steps */
  const tick$ = interval(Constants.TICK_RATE_MS).pipe(map(() => new TickEvent()));

  /**
   * Renders the current state to the canvas.
   *
   * In MVC terms, this updates the View using the Model.
   *
   * @param s Current state
   */
  const render = (s: State) => {
    svg.innerHTML = ''; // clear previous elements
    const gridShown = clearGame()

    const createBlock = (row: number, col: number) => {
      const block = createSvgElement(svg.namespaceURI, "rect", {
        height: Block.HEIGHT,
        width: Block.WIDTH,
        x: Block.WIDTH * col, // 20px each block
        y: Block.HEIGHT * row,
        style: "fill: green",
      }, 1);
      svg.appendChild(block);
    }
  
    s.grid.forEach((row, i) => 
      row.forEach((col, j) => 
        gridShown[i][j] = col));

    s.currentTetromino.shape.forEach((row, i) => 
      row.forEach((col, j) => 
        gridShown[i + s.row][j + s.col] = col));

    gridShown.forEach((row, i) => 
      row.forEach((col, j) => 
        (gridShown[i][j] != 0) ? createBlock(i, j) : 0));
  };

  const source$ = merge(input$, tick$)
    .pipe(scan((s: State, event) => {
      const newState = processEvent(event, s);
      return checkBounds(newState); 
    }, initialState))
    .subscribe((s: State) => {
      render(s);

      if (s.gameEnd) {
        show(gameover);
      } else {
        hide(gameover);
      }
    });

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
   * Update the state to change the direction the rectangle
   * is going in.
   */
  const move = (state: State, direction: Direction): State => {
    switch (direction) {
      case "left":
        return checkStacking(checkSideCollisions(checkBounds(state), direction));
      case "right":
        return checkStacking(checkSideCollisions(checkBounds(state), direction));
      case "down":
        return checkStacking(checkBounds({ ...state, row: state.row + 1 }));
    }
  };
}

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}
