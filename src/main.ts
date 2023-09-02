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

import { fromEvent, interval, merge, BehaviorSubject } from "rxjs";
import { map, filter, scan, takeWhile, take } from "rxjs/operators";
import {
  Viewport,
  Constants,
  Block,
  Key,
  Event,
  Direction,
  State,
  colourMapping,
} from "./types";
import {
  processEvent,
  TickEvent,
  InputEvent,
  clearGame,
  updateScore,
  updatePosition,
  createNewState,
} from "./state";

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
  props: Record<string, string> = {}
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
  const gameGrid = svg.querySelector("#gameGrid") as SVGGraphicsElement &
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

  levelText.textContent = "0";
  scoreText.textContent = "0";
  highScoreText.textContent = "0";

  /** User input */

  const key$ = fromEvent<KeyboardEvent>(document, "keydown");

  const fromKey = (keyCode: Key, direction: Direction) =>
    key$.pipe(
      filter(({ code }) => code === keyCode),
      map(() => new InputEvent(direction))
    );

  const left$ = fromKey("ArrowLeft", "left");
  const up$ = fromKey("ArrowUp", "up");
  const right$ = fromKey("ArrowRight", "right");
  const down$ = fromKey("ArrowDown", "down");
  const input$ = merge(left$, up$, right$, down$);

  /** Observables */

  /** Determines the rate of time steps */
  const tick$ = interval(Constants.TICK_RATE_MS).pipe(
    map(() => new TickEvent())
  );

  /**
   * Renders the current state to the canvas.
   *
   * In MVC terms, this updates the View using the Model.
   *
   * @param s Current state
   */
  function render(onFinish: () => void) {
    return function (s: State): void {
      gameGrid.innerHTML = ""; // clear previous elements
      preview.innerHTML = "";
      levelText.textContent = `${s.level}`;
      scoreText.textContent = `${s.score}`;
      const gridShown = clearGame();

      const createBlock = (
        row: number,
        col: number,
        colourIndex: number,
        elem: string
      ) => {
        const block = createSvgElement(svg.namespaceURI, "rect", {
          height: `${Block.HEIGHT}`,
          width: `${Block.WIDTH}`,
          x: `${Block.WIDTH * col}`, // 20px each block
          y: `${Block.HEIGHT * row}`,
          style: `fill: ${colourMapping[colourIndex]}`,
        });
        switch (elem) {
          case "grid":
            gameGrid.appendChild(block);
            break;
          case "preview":
            preview.appendChild(block);
            break;
        }
      };

      s.grid.forEach((row, i) =>
        row.forEach((col, j) => (gridShown[i][j] = col))
      );

      s.currentTetromino.forEach((row, i) =>
        row.forEach((col, j) => {
          if (col !== 0) {
            gridShown[i + s.row][j + s.col] = updatePosition(
              gridShown[i + s.row][j + s.col],
              col
            );
          }
        })
      );

      s.nextTetromino.forEach((row, i) =>
        row.forEach((col, j) => {
          if (col !== 0) {
            createBlock(i + 1, j + 2, col, "preview");
          }
        })
      );

      gridShown.forEach((row, i) =>
        row.forEach((col, j) =>
          gridShown[i][j] != 0 ? createBlock(i, j, col, "grid") : 0
        )
      );

      if (s.gameEnd) {
        show(gameover);
        onFinish();
      } else {
        hide(gameover);
      }
    };
  }

  const restartButton = document.getElementById("restartButton") as HTMLElement;
  fromEvent(restartButton, "click").subscribe(restartGame);
  const currentScore$ = new BehaviorSubject(0);
  const highScore$ = new BehaviorSubject(0);
  const gameOngoing$ = new BehaviorSubject(true);
  const source$ = merge(input$, tick$);

  startGame();

  function startGame() {
    const state$ = source$.pipe(
      scan((s: State, event) => {
        const newState = processEvent(event, s);
        return updateScore(newState);
      }, createNewState()),
      takeWhile(gameOngoing)
    );

    const score$ = state$.pipe(map((state) => state.score));

    state$.subscribe(render(() => gameOngoing$.next(false)));
    score$.subscribe((score) => currentScore$.next(score));
  }

  function gameOngoing() {
    return gameOngoing$.getValue();
  }

  function restartGame() {
    gameOngoing$.next(true);
    startGame();
    currentScore$.pipe(take(1)).subscribe((currentScore) => {
      const currentHighScore = highScore$.getValue();
      if (currentScore > currentHighScore) {
        highScore$.next(currentScore);
      }
      highScoreText.textContent = `${highScore$.getValue()}`;
    });
  }
}

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}
