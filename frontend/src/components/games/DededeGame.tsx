import { useCallback, useState } from "react";
import { authedUrl } from "../../api/client";
import type { DededeRound } from "../../types/game";
import { playCorrect, playIncorrect } from "../../hooks/useSounds";
import "./DededeGame.css";

const OPTIONS = ["的", "得", "地"] as const;

const GRAMMAR_RULES: Record<string, { rule: string; pattern: string }> = {
  "的": { rule: "Possessive / noun modifier", pattern: "A 的 B — A's B, or adjective 的 noun" },
  "得": { rule: "Degree / result complement", pattern: "verb 得 complement — describes how well or to what degree" },
  "地": { rule: "Adverbial modifier", pattern: "adverb 地 verb — describes how an action is done" },
};

interface Props {
  round: DededeRound;
  onComplete: (correct: boolean) => void;
}

export default function DededeGame({ round, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [disabled, setDisabled] = useState<Set<string>>(new Set());
  const [wasWrong, setWasWrong] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [hintLevel, setHintLevel] = useState(0); // 0=none, 1=pinyin, 2=english

  const handleSelect = useCallback(
    (option: string) => {
      if (answered || disabled.has(option)) return;

      setSelected(option);

      if (option === round.answer) {
        setAnswered(true);
        playCorrect();
        if (round.audio_path) {
          new Audio(authedUrl(`/assets/${round.audio_path}`)).play().catch(() => {});
        }
        setTimeout(() => onComplete(!wasWrong), 1300);
      } else {
        setWasWrong(true);
        playIncorrect();
        setDisabled((prev) => new Set([...prev, option]));
        setTimeout(() => setSelected(null), 400);
      }
    },
    [answered, disabled, round.answer, wasWrong, onComplete],
  );

  // Build display sentence: replace ____ with answer when correct
  const displaySentence = answered
    ? round.sentence.replace("____", round.answer)
    : round.sentence;

  const showEnglish = answered || hintLevel >= 2;

  return (
    <div className="dedede-game">
      <div className="dedede-sentence-area">
        {hintLevel >= 1 && (
          <div className="dedede-pinyin">{round.pinyin}</div>
        )}
        <div className="dedede-sentence">{displaySentence}</div>
        {showEnglish && (
          <div className="dedede-english">{round.english}</div>
        )}
      </div>

      <div className="dedede-options">
        {OPTIONS.map((option) => {
          let cls = "dedede-option";
          if (answered && option === round.answer) cls += " correct";
          else if (selected === option && option !== round.answer) cls += " wrong";
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

      <div className="dedede-actions">
        {!answered && hintLevel < 2 && (
          <button className="dedede-hint-btn" onClick={() => setHintLevel((p) => Math.min(p + 1, 2))}>
            Hint {hintLevel === 0 ? "(pinyin)" : "(english)"}
          </button>
        )}
      </div>

      <div className="dedede-explainer">
        {OPTIONS.map((p) => (
          <div key={p} className="dedede-explainer-row">
            <span className="dedede-explainer-char">{p}</span>
            <span className="dedede-explainer-rule">{GRAMMAR_RULES[p].rule}</span>
            <span className="dedede-explainer-pattern">{GRAMMAR_RULES[p].pattern}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
