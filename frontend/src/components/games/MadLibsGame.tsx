import { useCallback, useState } from "react";
import type { MadLibsRound } from "../../types/game";
import { playCorrect, playIncorrect } from "../../hooks/useSounds";
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
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const handleSelect = useCallback(
    (option: string) => {
      if (answered || disabled.has(option)) return;

      setSelected(option);

      if (option === round.vocab_word) {
        // Correct
        setAnswered(true);
        playCorrect();
        setTimeout(() => onComplete(!wasWrong), 1300);
      } else {
        // Wrong
        setWasWrong(true);
        playIncorrect();
        setDisabled((prev) => new Set([...prev, option]));
        setTimeout(() => setSelected(null), 400);
      }
    },
    [answered, disabled, round.vocab_word, wasWrong, onComplete],
  );

  const toggleHint = useCallback(() => {
    setHintLevel((prev) => Math.min(prev + 1, 2));
  }, []);

  const toggleCheck = useCallback((option: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(option)) next.delete(option);
      else next.add(option);
      return next;
    });
  }, []);

  const handleAddCards = useCallback(() => {
    if (!onAddCardFromWord) return;
    for (const word of checked) {
      onAddCardFromWord(word);
    }
    setChecked(new Set());
  }, [checked, onAddCardFromWord]);

  // Build the display sentence, replacing ____ with the answer if correct
  const displaySentence = answered
    ? round.sentence_zh.replace("____", round.vocab_word)
    : round.sentence_zh;

  // Show English on correct answer or if hint level >= 2
  const showEnglish = answered || hintLevel >= 2;

  return (
    <div className="madlibs-game">
      <div className="madlibs-sentence-area">
        {hintLevel >= 1 && (
          <div className="madlibs-pinyin">{round.pinyin_sentence}</div>
        )}
        <div className="madlibs-sentence">{displaySentence}</div>
        {showEnglish && (
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
            <div key={option} className="madlibs-option-row">
              {onAddCardFromWord && (
                <input
                  type="checkbox"
                  className="madlibs-checkbox"
                  checked={checked.has(option)}
                  onChange={() => toggleCheck(option)}
                />
              )}
              <button
                className={cls}
                onClick={() => handleSelect(option)}
                disabled={disabled.has(option) || answered}
              >
                {option}
              </button>
            </div>
          );
        })}
      </div>

      <div className="madlibs-actions">
        {!answered && hintLevel < 2 && (
          <button className="madlibs-hint-btn" onClick={toggleHint}>
            Hint {hintLevel === 0 ? "(pinyin)" : "(english)"}
          </button>
        )}
        {onAddCardFromWord && checked.size > 0 && (
          <button className="madlibs-add-btn" onClick={handleAddCards}>
            Add to Flash Cards ({checked.size})
          </button>
        )}
      </div>
    </div>
  );
}
