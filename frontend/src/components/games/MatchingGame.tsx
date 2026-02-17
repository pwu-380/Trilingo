import { useCallback, useMemo, useState } from "react";
import { authedUrl } from "../../api/client";
import type { MatchingRound } from "../../types/game";
import "./MatchingGame.css";

interface Props {
  round: MatchingRound;
  onComplete: (correct: boolean) => void;
}

export default function MatchingGame({ round, onComplete }: Props) {
  const [selectedEnglish, setSelectedEnglish] = useState<number | null>(null);
  const [selectedChinese, setSelectedChinese] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [shakeEnglish, setShakeEnglish] = useState<number | null>(null);
  const [shakeChinese, setShakeChinese] = useState<number | null>(null);

  // Shuffle the Chinese side independently
  const shuffledChinese = useMemo(() => {
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
    (englishIdx: number, chineseIdx: number) => {
      if (englishIdx === chineseIdx) {
        // Correct match
        setMatched((prev) => new Set([...prev, englishIdx]));
        setSelectedEnglish(null);
        setSelectedChinese(null);

        // Play audio on correct match
        playAudio(englishIdx);

        // Check if all matched
        if (matched.size + 1 === round.pairs.length) {
          setTimeout(() => onComplete(true), 400);
        }
      } else {
        // Wrong match — shake
        setShakeEnglish(englishIdx);
        setShakeChinese(chineseIdx);
        setTimeout(() => {
          setShakeEnglish(null);
          setShakeChinese(null);
          setSelectedEnglish(null);
          setSelectedChinese(null);
        }, 500);
      }
    },
    [matched, round.pairs.length, onComplete, playAudio],
  );

  const handleEnglishClick = useCallback(
    (idx: number) => {
      if (matched.has(idx)) return;
      setSelectedEnglish(idx);
      if (selectedChinese !== null) {
        tryMatch(idx, selectedChinese);
      }
    },
    [matched, selectedChinese, tryMatch],
  );

  const handleChineseClick = useCallback(
    (pairIndex: number) => {
      if (matched.has(pairIndex)) return;
      playAudio(pairIndex);
      setSelectedChinese(pairIndex);
      if (selectedEnglish !== null) {
        tryMatch(selectedEnglish, pairIndex);
      }
    },
    [matched, selectedEnglish, tryMatch, playAudio],
  );

  return (
    <div className="matching-game">
      <div className="matching-columns">
        <div className="matching-column">
          {round.pairs.map((pair, i) => (
            <button
              key={`en-${i}`}
              className={[
                "matching-card",
                matched.has(i) ? "matched" : "",
                selectedEnglish === i ? "selected" : "",
                shakeEnglish === i ? "shake" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => handleEnglishClick(i)}
              disabled={matched.has(i)}
            >
              {pair.english}
            </button>
          ))}
        </div>
        <div className="matching-column">
          {shuffledChinese.map((pairIndex) => (
            <button
              key={`zh-${pairIndex}`}
              className={[
                "matching-card matching-card-zh",
                matched.has(pairIndex) ? "matched" : "",
                selectedChinese === pairIndex ? "selected" : "",
                shakeChinese === pairIndex ? "shake" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => handleChineseClick(pairIndex)}
              disabled={matched.has(pairIndex)}
            >
              <span className="matching-chinese">{round.pairs[pairIndex].chinese}</span>
              <span className="matching-pinyin">{round.pairs[pairIndex].pinyin}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
