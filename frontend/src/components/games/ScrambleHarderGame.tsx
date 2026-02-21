import { useCallback, useState } from "react";
import type { ScrambleHarderRound } from "../../types/game";
import { playCorrect, playIncorrect } from "../../hooks/useSounds";
import "./ScrambleHarderGame.css";

interface Props {
  round: ScrambleHarderRound;
  onComplete: (correct: boolean) => void;
}

export default function ScrambleHarderGame({ round, onComplete }: Props) {
  const [placedIndices, setPlacedIndices] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hasRetried, setHasRetried] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const allPlaced = placedIndices.length === round.num_correct;

  const handlePlaceWord = useCallback(
    (idx: number) => {
      if (submitted || placedIndices.length >= round.num_correct) return;
      setPlacedIndices((prev) => [...prev, idx]);
    },
    [submitted, placedIndices.length, round.num_correct],
  );

  const handleRemoveWord = useCallback(
    (positionIdx: number) => {
      if (submitted) return;
      setPlacedIndices((prev) => prev.filter((_, i) => i !== positionIdx));
    },
    [submitted],
  );

  const handleClear = useCallback(() => {
    if (submitted) return;
    setPlacedIndices([]);
  }, [submitted]);

  const handleCheck = useCallback(() => {
    const userOrder = placedIndices.map((i) => round.words[i]);
    const correct =
      userOrder.length === round.correct_order.length &&
      userOrder.every((w, i) => w === round.correct_order[i]);

    setSubmitted(true);
    setIsCorrect(correct);

    if (correct) {
      playCorrect();
      setTimeout(() => onComplete(!hasRetried), 1500);
    } else {
      playIncorrect();
      setHasRetried(true);
      setTimeout(() => {
        setSubmitted(false);
        setIsCorrect(false);
        setPlacedIndices([]);
      }, 1000);
    }
  }, [placedIndices, round, hasRetried, onComplete]);

  const usedSet = new Set(placedIndices);

  const dirLabel = round.direction === "zh" ? "Chinese" : "English";

  return (
    <div className="shg-game">
      {/* Prompt */}
      <div className="shg-prompt-area">
        <div className="shg-direction-label">Unscramble the {dirLabel}</div>
        <div className={`shg-prompt ${round.direction === "zh" ? "" : "shg-prompt-zh"}`}>
          {round.prompt}
        </div>
      </div>

      {/* Pinyin hint above answer area */}
      {showHint && round.direction === "zh" && (
        <div className="shg-pinyin">{round.pinyin_sentence}</div>
      )}

      {/* Answer area */}
      <div className="shg-answer-area">
        {placedIndices.map((wordIdx, posIdx) => {
          let cls = "shg-tile shg-placed";
          if (submitted && isCorrect) cls += " correct";
          if (submitted && !isCorrect) cls += " wrong";
          return (
            <button
              key={`placed-${posIdx}`}
              className={cls}
              onClick={() => handleRemoveWord(posIdx)}
              disabled={submitted}
            >
              {round.words[wordIdx]}
            </button>
          );
        })}
        {!allPlaced &&
          Array.from({ length: round.num_correct - placedIndices.length }).map(
            (_, i) => (
              <div key={`slot-${i}`} className="shg-slot" />
            ),
          )}
      </div>

      {/* Word bank */}
      <div className="shg-word-bank">
        {round.words.map((word, idx) => (
          <button
            key={idx}
            className={`shg-tile shg-bank${usedSet.has(idx) ? " used" : ""}`}
            onClick={() => handlePlaceWord(idx)}
            disabled={usedSet.has(idx) || submitted || (allPlaced && !usedSet.has(idx))}
          >
            {word}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="shg-actions">
        {!submitted && !isCorrect && round.direction === "zh" && (
          <button className="shg-action-btn" onClick={() => setShowHint((h) => !h)}>
            {showHint ? "Hide pinyin" : "Hint (pinyin)"}
          </button>
        )}
        {!submitted && placedIndices.length > 0 && (
          <button className="shg-action-btn" onClick={handleClear}>
            Clear
          </button>
        )}
        {!submitted && allPlaced && (
          <button className="shg-action-btn shg-check-btn" onClick={handleCheck}>
            Check
          </button>
        )}
      </div>

      {/* Result after correct */}
      {submitted && isCorrect && (
        <div className="shg-result">
          <div className="shg-result-zh">{round.full_sentence_zh}</div>
          <div className="shg-result-pinyin">{round.pinyin_sentence}</div>
          <div className="shg-result-en">{round.full_sentence_en}</div>
        </div>
      )}
    </div>
  );
}
