export { render, highScoreText, restartButton };
import { State, Block, colourMapping, Viewport } from "./types";
import { clearGame, updatePosition } from "./state";

// Canvas elements
const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
  HTMLElement;
const preview = document.querySelector("#svgPreview") as SVGGraphicsElement &
  HTMLElement;
const gameover = document.querySelector("#gameOver") as SVGGraphicsElement &
  HTMLElement;
const gameGrid = svg.querySelector("#gameGrid") as SVGGraphicsElement &
  HTMLElement;

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

// Restart button
const restartButton = document.getElementById("restartButton") as HTMLElement;

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
 * Renders the current state to the canvas.
 *
 * In MVC terms, this updates the View using the Model.
 *
 * @param s Current state
 */
function render(onFinish: () => void) {
  return function (s: State): void {
    // clear previous elements
    gameGrid.innerHTML = "";
    preview.innerHTML = "";

    // set score and level text
    levelText.textContent = `${s.level}`;
    scoreText.textContent = `${s.score}`;

    // reset game grid to render
    const gridShown = clearGame();

    // draw each tetromino block that exists in the game grid or preview section
    const createBlock = (
      row: number,
      col: number,
      colourIndex: number,
      elem: string
    ) => {
      const block = createSvgElement(svg.namespaceURI, "rect", {
        height: `${Block.HEIGHT}`,
        width: `${Block.WIDTH}`,
        x: `${Block.WIDTH * col}`,
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

    // copy game grid to gridShown
    s.grid.forEach((row, i) =>
      row.forEach((col, j) => (gridShown[i][j] = col))
    );

    // copy current tetromino blocks to gridShown
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

    // draw each block of next tetromino in preview
    s.nextTetromino.forEach((row, i) =>
      row.forEach((col, j) => {
        if (col !== 0) {
          createBlock(i + 1, j + 2, col, "preview");
        }
      })
    );

    // draw each block that exists in gridShown
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
