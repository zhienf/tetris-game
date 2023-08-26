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

/** TETROMINO */
type Tetromino = Readonly<{
  tetrominoType: TetrominoType,
  pos: Vec
}>

type TetrominoType = {
  shape: number[][];
  color: string;
};

class Vec {
  constructor(public readonly x: number = 0, public readonly y: number = 0) { }
  add = (b: Vec) => new Vec(this.x + b.x, this.y + b.y)
  sub = (b: Vec) => this.add(b.scale(-1))
  len = () => Math.sqrt(this.x * this.x + this.y * this.y)
  scale = (s: number) => new Vec(this.x * s, this.y * s)
  ortho = () => new Vec(this.y, -this.x)
  rotate = (deg: number) =>
      (rad => (
          (cos, sin, { x, y }) => new Vec(x * cos - y * sin, x * sin + y * cos)
      )(Math.cos(rad), Math.sin(rad), this)
      )(Math.PI * deg / 180)

  static unitVecInDirection = (deg: number) => new Vec(0, -1).rotate(deg)
  static Zero = new Vec();
}

/** User input */

type Key = "KeyS" | "KeyA" | "KeyD";

type Event = "keydown" | "keyup" | "keypress";

/** Utility functions */

/** State processing */

type State = Readonly<{
  gameEnd: boolean;
  // tetrominoPos: Vec;
  x: number;
  y: number;
  dx: number;
  dy: number;
}>;

const initialState: State = {
  gameEnd: false,
  // tetrominoPos: new Vec(0, 0),
  x: 0,
  y: 0,
  dx: Block.WIDTH,
  dy: Block.HEIGHT
} as const;

/**
 * Updates the state by proceeding with one time step.
 *
 * @param s Current state
 * @returns Updated state
 */
const tick = (s: State): State => ({
  ...s,
  y: s.y + s.dy,
});

/**
 * Updates the state to ensure the rectangle stays within
 * the x-axis bounds. Will reflect the rectangle in the x-axis if
 * it was out of bounds.
 */
const boundX = (state: State): State => {
  const { x, ...rest } = state;

  if (x + Block.WIDTH > Viewport.CANVAS_WIDTH) {
    return { x: Viewport.CANVAS_WIDTH - Block.WIDTH, ...rest };
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

  if (y + Block.HEIGHT > Viewport.CANVAS_HEIGHT) {
    return { y: Viewport.CANVAS_HEIGHT - Block.HEIGHT, ...rest };
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
  props: Record<string, string> = {} // refer to tute3 RectProps
) => {
  const elem = document.createElementNS(namespace, name) as SVGElement;
  Object.entries(props).forEach(([k, v]) => elem.setAttribute(k, v));
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

  /** Possible input directions */
  type Direction = "left" | "right" | "down";

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
    key$.pipe(filter(({ code }) => code === keyCode),
    map(() => new InputEvent(direction)));

  const left$ = fromKey("KeyA", "left");
  // .pipe(
  //   map(() => new Vec(-Block.WIDTH, 0)) // Move left
  // );
  const right$ = fromKey("KeyD", "right");
  // .pipe(
  //   map(() => new Vec(Block.WIDTH, 0)) // Move right
  // );
  const down$ = fromKey("KeyS", "down");
  // .pipe(
  //   map(() => new Vec(0, Block.HEIGHT)) // Move down
  // );
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
    // Add blocks to the main grid canvas
    const cube = createSvgElement(svg.namespaceURI, "rect", {
      height: `${Block.HEIGHT}`,
      width: `${Block.WIDTH}`,
      x: "0",
      y: "0",
      style: "fill: green",
    });
    svg.appendChild(cube);
    const cube2 = createSvgElement(svg.namespaceURI, "rect", {
      height: `${Block.HEIGHT}`,
      width: `${Block.WIDTH}`,
      x: `${Block.WIDTH * (3 - 1)}`,
      y: `${Block.HEIGHT * (20 - 1)}`,
      style: "fill: red",
    });
    svg.appendChild(cube2);
    const cube3 = createSvgElement(svg.namespaceURI, "rect", {
      height: `${Block.HEIGHT}`,
      width: `${Block.WIDTH}`,
      x: `${Block.WIDTH * (4 - 1)}`,
      y: `${Block.HEIGHT * (20 - 1)}`,
      style: "fill: red",
    });s
    svg.appendChild(cube3);

    // Add a block to the preview canvas
    const cubePreview = createSvgElement(preview.namespaceURI, "rect", {
      height: `${Block.HEIGHT}`,
      width: `${Block.WIDTH}`,
      x: `${Block.WIDTH * 2}`,
      y: `${Block.HEIGHT}`,
      style: "fill: green",
    });
    preview.appendChild(cubePreview);

    cube.setAttribute("x", String(s.x))
    cube.setAttribute("y", String(s.y))
  };

  const source$ = merge(input$, tick$)
    .pipe(scan((s: State, event) => {
      // if (!s.gameEnd) {
      //   let newPosition: Vec;

      //   if (typeof move === "number") {
      //     // Handle tick (no movement)
      //     newPosition = s.tetrominoPos; // No change in position
      //   } else {
      //     // Handle user input
      //     newPosition = s.tetrominoPos.add(move); // Assuming Vec has an add method

      //     // Check for collisions or out of bounds before updating position
      //   }

      //   return { ...s, tetrominoPos: newPosition };
      // }
      // return s;
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
        return { ...state, x: state.x - Block.WIDTH };
      case "right":
        return { ...state, x: state.x + Block.WIDTH };
      case "down":
        return { ...state, y: state.y + Block.HEIGHT };
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
