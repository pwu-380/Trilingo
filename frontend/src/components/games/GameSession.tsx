import { useCallback, useEffect, useState } from "react";
import type { GameSession as GameSessionType } from "../../hooks/useGames";
import type { MatchingRound, MadLibsRound } from "../../types/game";
import { getMatchingRound, getMadLibsRound } from "../../api/games";
import MatchingGame from "./MatchingGame";
import MadLibsGame from "./MadLibsGame";
import GameSummary from "./GameSummary";
import "./GameSession.css";

interface Props {
  session: GameSessionType;
  onCompleteRound: (correct: boolean) => void;
  onEndSession: () => void;
  onAddCardFromWord?: (word: string) => void;
  onToast?: (message: string, type: "info" | "error" | "success") => void;
}

export default function GameSession({
  session,
  onCompleteRound,
  onEndSession,
  onAddCardFromWord,
  onToast,
}: Props) {
  const [matchingData, setMatchingData] = useState<MatchingRound | null>(null);
  const [madlibsData, setMadlibsData] = useState<MadLibsRound | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentGameType =
    session.currentRound < session.totalRounds
      ? session.gameSequence[session.currentRound]
      : null;

  // Fetch round data when the round changes
  useEffect(() => {
    if (session.currentRound >= session.totalRounds) return;
    if (!currentGameType) return;

    setLoading(true);
    setError(null);
    setMatchingData(null);
    setMadlibsData(null);

    const fetchRound = async () => {
      try {
        if (currentGameType === "matching") {
          const data = await getMatchingRound(session.hskLevel);
          setMatchingData(data);
        } else {
          const data = await getMadLibsRound(session.hskLevel);
          if (data.rate_limited && onToast) {
            onToast("AI rate limit reached — using saved questions", "info");
          }
          setMadlibsData(data);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load round");
      } finally {
        setLoading(false);
      }
    };

    fetchRound();
  }, [session.currentRound, session.totalRounds, session.hskLevel, currentGameType]);

  const handleComplete = useCallback(
    (correct: boolean) => {
      onCompleteRound(correct);
    },
    [onCompleteRound],
  );

  // Summary screen
  if (session.currentRound >= session.totalRounds) {
    return <GameSummary session={session} onEndSession={onEndSession} />;
  }

  // Progress bar
  const progress = (session.currentRound / session.totalRounds) * 100;

  return (
    <div className="game-session">
      <div className="game-session-status">
        <div className="game-session-progress-bar">
          <div
            className="game-session-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="game-session-info">
          <span>
            Round {session.currentRound + 1} / {session.totalRounds}
          </span>
          <span>Score: {session.score}</span>
        </div>
      </div>

      <div className="game-session-content">
        {loading && <div className="game-session-loading">Generating question<span className="ellipsis-anim" /></div>}
        {error && <div className="game-session-error">{error}</div>}

        {!loading && !error && currentGameType === "matching" && matchingData && (
          <MatchingGame round={matchingData} onComplete={handleComplete} />
        )}

        {!loading && !error && currentGameType === "madlibs" && madlibsData && (
          <MadLibsGame
            round={madlibsData}
            onComplete={handleComplete}
            onAddCardFromWord={onAddCardFromWord}
          />
        )}
      </div>
    </div>
  );
}
