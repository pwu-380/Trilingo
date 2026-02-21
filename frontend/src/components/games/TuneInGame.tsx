import { useCallback, useEffect, useRef, useState } from "react";
import { authedUrl } from "../../api/client";
import type { TuneInRound } from "../../types/game";
import { playCorrect, playIncorrect } from "../../hooks/useSounds";
import "./TuneInGame.css";

interface Props {
  round: TuneInRound;
  onComplete: (correct: boolean) => void;
}

export default function TuneInGame({ round, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [disabled, setDisabled] = useState<Set<string>>(new Set());
  const [wasWrong, setWasWrong] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [showPinyin, setShowPinyin] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playWordAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  // Auto-play audio when round loads
  useEffect(() => {
    const audio = new Audio(authedUrl(`/assets/${round.audio_path}`));
    audioRef.current = audio;
    audio.play().catch(() => {});
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [round]);

  const handleSelect = useCallback(
    (option: string) => {
      if (answered || disabled.has(option)) return;

      setSelected(option);

      if (option === round.correct) {
        setAnswered(true);
        playCorrect();
        setTimeout(() => onComplete(!wasWrong), 1300);
      } else {
        setWasWrong(true);
        playIncorrect();
        setDisabled((prev) => new Set([...prev, option]));
        setTimeout(() => setSelected(null), 400);
      }
    },
    [answered, disabled, round.correct, wasWrong, onComplete],
  );

  return (
    <div className="tunein-game">
      <div className="tunein-prompt-area">
        <button className="tunein-play-btn" onClick={playWordAudio}>
          &#9654; Play Audio
        </button>
        {answered && (
          <div className="tunein-reveal">
            <span className="tunein-reveal-pinyin">{round.correct_pinyin}</span>
            <span className="tunein-reveal-english">{round.correct_english}</span>
          </div>
        )}
      </div>

      <div className="tunein-options">
        {round.options.map((option) => {
          let cls = "tunein-option";
          if (answered && option === round.correct) cls += " correct";
          else if (selected === option && option !== round.correct) cls += " wrong";
          if (disabled.has(option)) cls += " disabled";
          return (
            <button
              key={option}
              className={cls}
              onClick={() => handleSelect(option)}
              disabled={disabled.has(option) || answered}
            >
              {option}
              {showPinyin && (
                <span className="tunein-option-pinyin">
                  {option === round.correct ? round.correct_pinyin : ""}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="tunein-actions">
        {!answered && (
          <button className="tunein-hint-btn" onClick={() => setShowPinyin((p) => !p)}>
            {showPinyin ? "Hide Pinyin" : "Hint (pinyin)"}
          </button>
        )}
      </div>
    </div>
  );
}
