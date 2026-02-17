import type { GameSession } from "../../hooks/useGames";
import "./GameSession.css";

interface Props {
  session: GameSession;
  onEndSession: () => void;
}

export default function GameSummary({ session, onEndSession }: Props) {
  const pct = Math.round((session.score / session.totalRounds) * 100);

  let emoji = "";
  let message = "";
  if (pct === 100) {
    emoji = "!";
    message = "Perfect score!";
  } else if (pct >= 80) {
    message = "Great job!";
  } else if (pct >= 60) {
    message = "Good effort!";
  } else {
    message = "Keep practicing!";
  }

  return (
    <div className="game-summary">
      <div className="game-summary-card">
        <h2 className="game-summary-title">
          {emoji} {message}
        </h2>
        <div className="game-summary-score">
          {session.score} / {session.totalRounds}
        </div>
        <div className="game-summary-pct">{pct}% correct</div>
        <button className="game-summary-btn" onClick={onEndSession}>
          Back to Lobby
        </button>
      </div>
    </div>
  );
}
