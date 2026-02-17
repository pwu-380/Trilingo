import correctSrc from "../assets/correct.mp3";
import incorrectSrc from "../assets/incorrect.wav";

export function playCorrect() {
  new Audio(correctSrc).play().catch(() => {});
}

export function playIncorrect() {
  new Audio(incorrectSrc).play().catch(() => {});
}
