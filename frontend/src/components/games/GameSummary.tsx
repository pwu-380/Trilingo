import type { GameSession } from "../../hooks/useGames";
import CongratulationImg from "../../assets/Congratulation.jpg";
import "./GameSession.css";

interface Props {
  session: GameSession;
  onEndSession: () => void;
}

export default function GameSummary({ session, onEndSession }: Props) {
  const pct = Math.round((session.score / session.totalRounds) * 100);

  let message = "";
  if (pct === 100) {
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
        {pct === 100 && (
          <img
            className="game-summary-img"
            src={CongratulationImg}
            alt="Congratulations"
          />
        )}
        <h2 className="game-summary-title">{message}</h2>
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
