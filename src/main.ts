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
import { Constants, Key, Direction, State } from "./types";
import {
  processEvent,
  TickEvent,
  InputEvent,
  updateScore,
  createNewState,
} from "./state";
import { render, highScoreText, restartButton } from "./view";

/**
 * This is the function called on page load. Your main game loop
 * should be called here.
 */
export function main() {
  // Observable for restart button click always subscribed to
  fromEvent(restartButton, "click").subscribe(restartGame);

  // Observables
  const tick$ = interval(Constants.TICK_RATE_MS).pipe(
      map(() => new TickEvent())
    ),
    key$ = (keyCode: Key, direction: Direction) =>
      fromEvent<KeyboardEvent>(document, "keydown").pipe(
        filter(({ code }) => code === keyCode),
        map(() => new InputEvent(direction))
      ),
    left$ = key$("ArrowLeft", "left"),
    up$ = key$("ArrowUp", "up"),
    right$ = key$("ArrowRight", "right"),
    down$ = key$("ArrowDown", "down"),
    input$ = merge(left$, up$, right$, down$),
    currentScore$ = new BehaviorSubject(0),
    highScore$ = new BehaviorSubject(0),
    gameOngoing$ = new BehaviorSubject(true);

  startGame();

  /**
   * Initializes and starts the Tetris game loop.
   * This function sets up Observables for user input and the game tick.
   * It also manages the game's state, score, and rendering loop.
   */
  function startGame() {
    const source$ = merge(input$, tick$);

    // Observable to manage the game's state changes over time
    const state$ = source$.pipe(
      scan((s: State, event) => {
        const newState = processEvent(event, s);
        return updateScore(newState);
      }, createNewState()),
      takeWhile(gameOngoing)
    );

    // Observable for the game score from the state
    const score$ = state$.pipe(map((state) => state.score));

    state$.subscribe(render(() => gameOngoing$.next(false)));
    score$.subscribe((score) => currentScore$.next(score));
  }

  /**
   * Checks if the game is currently ongoing by inspecting the gameOngoing$ BehaviorSubject's value.
   * @returns {boolean} True if the game is ongoing, otherwise false.
   */
  function gameOngoing() {
    return gameOngoing$.getValue();
  }

  /**
   * Restarts the Tetris game.
   */
  function restartGame() {
    gameOngoing$.next(true);
    startGame();

    // Subscribe to the current score Observable to compare it to the high score,
    // and if it's higher, the high score is updated.
    // The high score is also updated in the displayed UI.
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
