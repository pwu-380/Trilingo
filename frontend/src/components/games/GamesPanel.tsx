import { useState } from "react";
import type { GameType } from "../../types/game";
import type { GameSession } from "../../hooks/useGames";
import GameSessionComponent from "./GameSession";
import "./GamesPanel.css";

interface Props {
  session: GameSession | null;
  hskLevel: number;
  totalRounds: number;
  onSetHskLevel: (level: number) => void;
  onSetTotalRounds: (rounds: number) => void;
  onStartSession: (gameType: GameType) => void;
  onCompleteRound: (correct: boolean) => void;
  onEndSession: () => void;
  onAddCardFromWord?: (word: string) => void;
  onToast?: (message: string, type: "info" | "error" | "success") => void;
}

const GAME_BUTTONS: { type: GameType; label: string; desc: string }[] = [
  { type: "matching", label: "Matching", desc: "Match Chinese to English" },
  { type: "madlibs", label: "MadLibs", desc: "Fill in the blank" },
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

  if (session) {
    if (session.currentRound >= session.totalRounds) {
      // Show summary
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
          {GAME_BUTTONS.map((g) => (
            <button
              key={g.type}
              className="games-type-btn"
              onClick={() => onStartSession(g.type)}
            >
              <span className="games-type-label">{g.label}</span>
              <span className="games-type-desc">{g.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
