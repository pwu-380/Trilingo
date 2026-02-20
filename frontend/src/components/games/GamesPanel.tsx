import { useEffect, useState } from "react";
import type { GameType } from "../../types/game";
import type { GameSession } from "../../hooks/useGames";
import { getSentenceCount } from "../../api/games";
import GameSessionComponent from "./GameSession";
import "./GamesPanel.css";

interface Props {
  session: GameSession | null;
  hskLevel: number;
  totalRounds: number;
  onSetHskLevel: (level: number) => void;
  onSetTotalRounds: (rounds: number) => void;
  onStartSession: (gameType: GameType, excludeFromRandom?: ("matching" | "madlibs" | "sentence-builder")[]) => void;
  onCompleteRound: (correct: boolean) => void;
  onEndSession: () => void;
  onAddCardFromWord?: (word: string) => void;
  onToast?: (message: string, type: "info" | "error" | "success") => void;
}

const SENTENCE_BUILDER_MIN = 10;

interface GameButton {
  type: GameType;
  label: string;
  desc: string;
  lockable?: boolean;
}

const GAME_BUTTONS: GameButton[] = [
  { type: "matching", label: "Matching", desc: "Match Chinese to English" },
  { type: "madlibs", label: "MadLibs", desc: "Fill in the blank" },
  { type: "sentence-builder", label: "Sentence Builder", desc: "Arrange words in order", lockable: true },
  { type: "random", label: "Random", desc: "Mix of all games" },
];

export default function GamesPanel({
  session,
  hskLevel,
  totalRounds,
  onSetHskLevel,
  onSetTotalRounds,
  onStartSession,
  onCompleteRound,
  onEndSession,
  onAddCardFromWord,
  onToast,
}: Props) {
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [sentenceCount, setSentenceCount] = useState(0);

  // Fetch sentence count when returning to lobby or HSK level changes
  useEffect(() => {
    if (session) return;
    getSentenceCount(hskLevel)
      .then((data) => setSentenceCount(data.count))
      .catch(() => setSentenceCount(0));
  }, [hskLevel, session]);

  const sentenceBuilderUnlocked = sentenceCount >= SENTENCE_BUILDER_MIN;

  if (session) {
    if (session.currentRound >= session.totalRounds) {
      return (
        <GameSessionComponent
          session={session}
          onCompleteRound={onCompleteRound}
          onEndSession={onEndSession}
          onAddCardFromWord={onAddCardFromWord}
          onToast={onToast}
        />
      );
    }

    return (
      <div className="games-panel">
        <div className="games-session-header">
          <button
            className="games-back-btn"
            onClick={() => {
              if (confirmQuit) {
                setConfirmQuit(false);
                onEndSession();
              } else {
                setConfirmQuit(true);
              }
            }}
          >
            {confirmQuit ? "Confirm quit?" : "Back"}
          </button>
          {confirmQuit && (
            <button
              className="games-cancel-btn"
              onClick={() => setConfirmQuit(false)}
            >
              Cancel
            </button>
          )}
        </div>
        <GameSessionComponent
          session={session}
          onCompleteRound={onCompleteRound}
          onEndSession={onEndSession}
          onAddCardFromWord={onAddCardFromWord}
          onToast={onToast}
        />
      </div>
    );
  }

  // Lobby
  return (
    <div className="games-panel">
      <div className="games-lobby">
        <div className="games-config">
          <label className="games-config-item">
            <span>HSK Level</span>
            <select
              value={hskLevel}
              onChange={(e) => onSetHskLevel(Number(e.target.value))}
            >
              <option value={1}>HSK 1</option>
              <option value={2}>HSK 2</option>
              <option value={3}>HSK 3</option>
            </select>
          </label>
          <label className="games-config-item">
            <span>Rounds</span>
            <select
              value={totalRounds}
              onChange={(e) => onSetTotalRounds(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
            </select>
          </label>
        </div>

        <div className="games-grid">
          {GAME_BUTTONS.map((g) => {
            const locked = g.lockable && !sentenceBuilderUnlocked;
            return (
              <button
                key={g.type}
                className={`games-type-btn${locked ? " locked" : ""}`}
                disabled={locked}
                onClick={() => {
                  const exclude: ("matching" | "madlibs" | "sentence-builder")[] = [];
                  if (!sentenceBuilderUnlocked) exclude.push("sentence-builder");
                  onStartSession(g.type, exclude);
                }}
              >
                <span className="games-type-label">
                  {locked ? "\u{1F512} " : ""}{g.label}
                </span>
                <span className="games-type-desc">
                  {locked
                    ? `${sentenceCount}/${SENTENCE_BUILDER_MIN} sentences needed`
                    : g.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
