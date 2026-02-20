import { useCallback, useState } from "react";
import type { SentenceBuilderRound } from "../../types/game";
import { playCorrect, playIncorrect } from "../../hooks/useSounds";
import "./SentenceBuilderGame.css";

interface Props {
  round: SentenceBuilderRound;
  onComplete: (correct: boolean) => void;
}

export default function SentenceBuilderGame({ round, onComplete }: Props) {
  const [placedIndices, setPlacedIndices] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hasRetried, setHasRetried] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const allPlaced = placedIndices.length === round.words.length;

  const handlePlaceWord = useCallback(
    (idx: number) => {
      if (submitted) return;
      setPlacedIndices((prev) => [...prev, idx]);
    },
    [submitted],
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

  return (
    <div className="sb-game">
      {/* English prompt */}
      <div className="sb-prompt-area">
        <div className="sb-english">{round.sentence_en}</div>
      </div>

      {/* Pinyin hint above answer area */}
      {showHint && (
        <div className="sb-pinyin">{round.pinyin_sentence}</div>
      )}

      {/* Answer area */}
      <div className="sb-answer-area">
        {placedIndices.map((wordIdx, posIdx) => {
          let cls = "sb-tile sb-placed";
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
          Array.from({ length: round.words.length - placedIndices.length }).map(
            (_, i) => (
              <div key={`slot-${i}`} className="sb-slot" />
            ),
          )}
      </div>

      {/* Word bank */}
      <div className="sb-word-bank">
        {round.words.map((word, idx) => (
          <button
            key={idx}
            className={`sb-tile sb-bank${usedSet.has(idx) ? " used" : ""}`}
            onClick={() => handlePlaceWord(idx)}
            disabled={usedSet.has(idx) || submitted}
          >
            {word}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="sb-actions">
        {!submitted && !isCorrect && (
          <button className="sb-action-btn" onClick={() => setShowHint((h) => !h)}>
            {showHint ? "Hide pinyin" : "Hint (pinyin)"}
          </button>
        )}
        {!submitted && placedIndices.length > 0 && (
          <button className="sb-action-btn" onClick={handleClear}>
            Clear
          </button>
        )}
        {!submitted && allPlaced && (
          <button className="sb-action-btn sb-check-btn" onClick={handleCheck}>
            Check
          </button>
        )}
      </div>

      {/* Result after correct */}
      {submitted && isCorrect && (
        <div className="sb-result">
          <div className="sb-result-zh">{round.full_sentence_zh}</div>
          <div className="sb-result-pinyin">{round.pinyin_sentence}</div>
          <div className="sb-result-en">{round.sentence_en}</div>
        </div>
      )}
    </div>
  );
}
