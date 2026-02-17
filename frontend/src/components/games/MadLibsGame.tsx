import { useCallback, useState } from "react";
import type { MadLibsRound } from "../../types/game";
import "./MadLibsGame.css";

interface Props {
  round: MadLibsRound;
  onComplete: (correct: boolean) => void;
  onAddCardFromWord?: (word: string) => void;
}

export default function MadLibsGame({ round, onComplete, onAddCardFromWord }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [disabled, setDisabled] = useState<Set<string>>(new Set());
  const [wasWrong, setWasWrong] = useState(false);
  const [hintLevel, setHintLevel] = useState(0); // 0=none, 1=pinyin, 2=english
  const [answered, setAnswered] = useState(false);

  const handleSelect = useCallback(
    (option: string) => {
      if (answered || disabled.has(option)) return;

      setSelected(option);

      if (option === round.vocab_word) {
        // Correct
        setAnswered(true);
        setTimeout(() => onComplete(!wasWrong), 800);
      } else {
        // Wrong
        setWasWrong(true);
        setDisabled((prev) => new Set([...prev, option]));
        setTimeout(() => setSelected(null), 400);
      }
    },
    [answered, disabled, round.vocab_word, wasWrong, onComplete],
  );

  const toggleHint = useCallback(() => {
    setHintLevel((prev) => Math.min(prev + 1, 2));
  }, []);

  // Build the display sentence, replacing ____ with the answer if correct
  const displaySentence = answered
    ? round.sentence_zh.replace("____", round.vocab_word)
    : round.sentence_zh;

  return (
    <div className="madlibs-game">
      <div className="madlibs-sentence-area">
        {hintLevel >= 1 && (
          <div className="madlibs-pinyin">{round.pinyin_sentence}</div>
        )}
        <div className="madlibs-sentence">{displaySentence}</div>
        {hintLevel >= 2 && (
          <div className="madlibs-english">{round.sentence_en}</div>
        )}
      </div>

      <div className="madlibs-options">
        {round.options.map((option) => {
          let cls = "madlibs-option";
          if (answered && option === round.vocab_word) cls += " correct";
          else if (selected === option && option !== round.vocab_word) cls += " wrong";
          if (disabled.has(option)) cls += " disabled";
          return (
            <button
              key={option}
              className={cls}
              onClick={() => handleSelect(option)}
              disabled={disabled.has(option) || answered}
            >
              {option}
            </button>
          );
        })}
      </div>

      <div className="madlibs-actions">
        {!answered && hintLevel < 2 && (
          <button className="madlibs-hint-btn" onClick={toggleHint}>
            Hint {hintLevel === 0 ? "(pinyin)" : "(english)"}
          </button>
        )}
        {answered && onAddCardFromWord && (
          <button
            className="madlibs-add-btn"
            onClick={() => onAddCardFromWord(round.vocab_word)}
          >
            Add to Flash Cards
          </button>
        )}
      </div>
    </div>
  );
}
