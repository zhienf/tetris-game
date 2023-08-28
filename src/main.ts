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

// TODO: ? change x,y to Vec
type State = Readonly<{
  grid: number[][];
  gameEnd: boolean;
  x: number;
  y: number;
  currentTetromino: Tetromino;
}>;

// TODO: modify to consider other tetromino type width
const initialX = Math.floor(Viewport.CANVAS_WIDTH / 2) - Math.floor(Block.WIDTH / 2);
const nearestMultipleOfBlockWidth = Math.floor(initialX / Block.WIDTH) * Block.WIDTH;

const initialState: State = {
  grid: clearGame(),
  gameEnd: false,
  x: 4,
  y: 0,
  currentTetromino: tetrominoGreen
} as const;

let tetrominoElement: SVGElement | null = null; // TODO: let is mutable

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
    y: s.y + 1,
  });

  // // Check for collision with the bottom or other blocks
  // if (collisionDetected(newState)) {
  //   // Place the current tetromino on the grid
  //   updateGridWithTetromino(newState);

  //   // Spawn a new tetromino at the top
  //   const newTetromino = [
  //     [1], 
  //   ];
  //   newState.currentTetromino = newTetromino;
  //   newState.y = 0; // Reset y-coordinate to the top
  // }

  // if (newState.y + Block.HEIGHT > Viewport.CANVAS_HEIGHT) {
  //   tetrominoElement = null; 
  //   newState.x = nearestMultipleOfBlockWidth; // TODO: impure?
  //   newState.y = 0;
  // }
  
  return newState;
};

/**
 * Updates the state to ensure the rectangle stays within
 * the x-axis bounds. Will reflect the rectangle in the x-axis if
 * it was out of bounds.
 */
const boundX = (state: State): State => {
  const { x, ...rest } = state;

  if (x < 0) {
    return { x: 0, ...rest };
  }

  if (x + 1 > Constants.GRID_WIDTH) {
    return { x: Constants.GRID_WIDTH - 1, ...rest };
  }
  return state;
};

/**
 * Updates the state to ensure the rectangle stays within
 * the y-axis bounds. Will reflect the rectangle in the y-axis if
 * it was out of bounds.
 */
const boundY = (state: State): State => {
  const { y, ...rest } = state;

  if (y < 0) {
    return { y: 0, ...rest };
  }

  if (y + 1 > Constants.GRID_HEIGHT) {
    return { y: Constants.GRID_HEIGHT - 1, ...rest }; // TODO: need stop when collide
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
    // if (!tetrominoElement) {
    //   tetrominoElement = createSvgElement(svg.namespaceURI, "rect", s.currentTetromino.props, 1);
    //   svg.appendChild(tetrominoElement);
    // }

    // tetrominoElement.setAttribute("x", String(s.x));
    // tetrominoElement.setAttribute("y", String(s.y));
    svg.innerHTML = '';
    const gridShown = clearGame()

    const createBlock = (row: number, col: number) => {
      const block = createSvgElement(svg.namespaceURI, "rect", {
        height: Block.HEIGHT,
        width: Block.WIDTH,
        x: Block.WIDTH * row, // 20px each block
        y: Block.HEIGHT * col,
        style: "fill: green",
      }, 1);
      svg.appendChild(block);
    }
  
    s.grid.forEach((row, i) => 
      row.forEach((col, j) => 
        gridShown[i][j] = col));

    s.currentTetromino.shape.forEach((row, i) => 
      row.forEach((col, j) => 
        gridShown[i + s.x][j + s.y] = col));

    gridShown.forEach((row, i) => 
      row.forEach((col, j) => 
        (gridShown[i][j] != 0) ? createBlock(i, j) : 0));

    // s.grid.forEach((row, i) => 
    //   row.forEach((col, j) => 
    //     (s.grid[i][j] != 0) ? createBlock(i, j) : 0));
    
    // s.currentTetromino.shape.forEach((row, i) => 
    //   row.forEach((col, j) => {
    //     console.log(i + s.currentTetromino.topLeft.col),
    //     console.log(i + s.x),
    //     console.log(j + s.currentTetromino.topLeft.row),
    //     console.log(j + s.y),
    //     (s.currentTetromino.shape[i][j] != 0) ? createBlock(i + s.x, j + s.y) : 0
    //   })
    // );
  };

  const source$ = merge(input$, tick$)
    .pipe(scan((s: State, event) => {
      const newState = processEvent(event, s);
      return checkBounds(newState); // TODO: need check for collisions also
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
        return { ...state, x: state.x - 1 };
      case "right":
        return { ...state, x: state.x + 1 };
      case "down":
        return { ...state, y: state.y + 1 };
    }
  };

  /**
   * Ensure the rectangle is within bounds.
   */
  const checkBounds = (state: State): State => {
    const boundedX = boundX(state);
    const boundedXY = boundY(boundedX);
    return boundedXY;
  };
}

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}
