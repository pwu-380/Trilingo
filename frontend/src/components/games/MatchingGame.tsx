import { useCallback, useMemo, useState } from "react";
import { authedUrl } from "../../api/client";
import type { MatchingRound } from "../../types/game";
import "./MatchingGame.css";

interface Props {
  round: MatchingRound;
  onComplete: (correct: boolean) => void;
}

export default function MatchingGame({ round, onComplete }: Props) {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [shakeLeft, setShakeLeft] = useState<number | null>(null);
  const [shakeRight, setShakeRight] = useState<number | null>(null);
  const [showPinyin, setShowPinyin] = useState(false);

  // Randomly decide if Chinese is on the left or right for this round
  const chineseOnLeft = useMemo(() => Math.random() < 0.5, [round]);

  // Shuffle the right-side column independently
  const shuffledRight = useMemo(() => {
    const indices = round.pairs.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }, [round]);

  const playAudio = useCallback(
    (pairIndex: number) => {
      const pair = round.pairs[pairIndex];
      if (pair.audio_path) {
        const audio = new Audio(authedUrl(`/assets/${pair.audio_path}`));
        audio.play().catch(() => {});
      }
    },
    [round],
  );

  const tryMatch = useCallback(
    (leftIdx: number, rightIdx: number) => {
      // leftIdx and rightIdx are both original pair indices
      if (leftIdx === rightIdx) {
        // Correct match
        setMatched((prev) => new Set([...prev, leftIdx]));
        setSelectedLeft(null);
        setSelectedRight(null);

        // Play audio on correct match
        playAudio(leftIdx);

        // Check if all matched
        if (matched.size + 1 === round.pairs.length) {
          setTimeout(() => onComplete(true), 400);
        }
      } else {
        // Wrong match — shake
        setShakeLeft(leftIdx);
        setShakeRight(rightIdx);
        setTimeout(() => {
          setShakeLeft(null);
          setShakeRight(null);
          setSelectedLeft(null);
          setSelectedRight(null);
        }, 500);
      }
    },
    [matched, round.pairs.length, onComplete, playAudio],
  );

  const handleLeftClick = useCallback(
    (pairIndex: number) => {
      if (matched.has(pairIndex)) return;
      setSelectedLeft(pairIndex);
      if (selectedRight !== null) {
        tryMatch(pairIndex, selectedRight);
      }
    },
    [matched, selectedRight, tryMatch],
  );

  const handleRightClick = useCallback(
    (pairIndex: number) => {
      if (matched.has(pairIndex)) return;
      setSelectedRight(pairIndex);
      if (selectedLeft !== null) {
        tryMatch(selectedLeft, pairIndex);
      }
    },
    [matched, selectedLeft, tryMatch],
  );

  const renderEnglishCard = (pairIndex: number, side: "left" | "right") => {
    const pair = round.pairs[pairIndex];
    const isSelected = side === "left" ? selectedLeft === pairIndex : selectedRight === pairIndex;
    const isShaking = side === "left" ? shakeLeft === pairIndex : shakeRight === pairIndex;
    const onClick = side === "left" ? handleLeftClick : handleRightClick;

    return (
      <button
        key={`en-${pairIndex}`}
        className={[
          "matching-card",
          matched.has(pairIndex) ? "matched" : "",
          isSelected ? "selected" : "",
          isShaking ? "shake" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() => onClick(pairIndex)}
        disabled={matched.has(pairIndex)}
      >
        {pair.english}
      </button>
    );
  };

  const renderChineseCard = (pairIndex: number, side: "left" | "right") => {
    const pair = round.pairs[pairIndex];
    const isSelected = side === "left" ? selectedLeft === pairIndex : selectedRight === pairIndex;
    const isShaking = side === "left" ? shakeLeft === pairIndex : shakeRight === pairIndex;
    const onClick = side === "left" ? handleLeftClick : handleRightClick;

    return (
      <button
        key={`zh-${pairIndex}`}
        className={[
          "matching-card matching-card-zh",
          matched.has(pairIndex) ? "matched" : "",
          isSelected ? "selected" : "",
          isShaking ? "shake" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() => onClick(pairIndex)}
        disabled={matched.has(pairIndex)}
      >
        {pair.chinese}
        {showPinyin && (
          <span className="matching-pinyin">{pair.pinyin}</span>
        )}
      </button>
    );
  };

  // Left column: original order, right column: shuffled
  const leftIndices = round.pairs.map((_, i) => i);
  const rightIndices = shuffledRight;

  return (
    <div className="matching-game">
      <div className="matching-columns">
        <div className="matching-column">
          {leftIndices.map((idx) =>
            chineseOnLeft
              ? renderChineseCard(idx, "left")
              : renderEnglishCard(idx, "left"),
          )}
        </div>
        <div className="matching-column">
          {rightIndices.map((idx) =>
            chineseOnLeft
              ? renderEnglishCard(idx, "right")
              : renderChineseCard(idx, "right"),
          )}
        </div>
      </div>
      <button
        className="matching-pinyin-btn"
        onClick={() => setShowPinyin((p) => !p)}
      >
        {showPinyin ? "Hide Pinyin" : "Show Pinyin"}
      </button>
    </div>
  );
}
