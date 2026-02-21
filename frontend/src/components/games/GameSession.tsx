import { useCallback, useEffect, useRef, useState } from "react";
import type { GameSession as GameSessionType } from "../../hooks/useGames";
import type { MatchingRound, MadLibsRound, ScramblerRound, TuneInRound, ScrambleHarderRound, DededeRound } from "../../types/game";
import { getMatchingRound, getMadLibsRound, getScramblerRound, getTuneInRound, getScrambleHarderRound, getDededeRound } from "../../api/games";
import MatchingGame from "./MatchingGame";
import MadLibsGame from "./MadLibsGame";
import ScramblerGame from "./ScramblerGame";
import TuneInGame from "./TuneInGame";
import ScrambleHarderGame from "./ScrambleHarderGame";
import DededeGame from "./DededeGame";
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
  const [scramblerData, setScramblerData] = useState<ScramblerRound | null>(null);
  const [tuneinData, setTuneinData] = useState<TuneInRound | null>(null);
  const [scrambleHarderData, setScrambleHarderData] = useState<ScrambleHarderRound | null>(null);
  const [dededeData, setDededeData] = useState<DededeRound | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGenerating, setShowGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generatingTimer = useRef<ReturnType<typeof setTimeout>>();

  const currentGameType =
    session.currentRound < session.totalRounds
      ? session.gameSequence[session.currentRound]
      : null;

  // Fetch round data when the round changes
  useEffect(() => {
    if (session.currentRound >= session.totalRounds) return;
    if (!currentGameType) return;

    setLoading(true);
    setShowGenerating(false);
    setError(null);
    setMatchingData(null);
    setMadlibsData(null);
    setScramblerData(null);
    setTuneinData(null);
    setScrambleHarderData(null);
    setDededeData(null);

    // Only show "Generating question..." if the request takes >500ms (i.e. LLM call)
    clearTimeout(generatingTimer.current);
    generatingTimer.current = setTimeout(() => setShowGenerating(true), 500);

    const fetchRound = async () => {
      try {
        if (currentGameType === "matching") {
          const data = await getMatchingRound(session.hskLevel);
          setMatchingData(data);
        } else if (currentGameType === "scrambler") {
          const data = await getScramblerRound(session.hskLevel);
          setScramblerData(data);
        } else if (currentGameType === "tunein") {
          const data = await getTuneInRound(session.hskLevel);
          setTuneinData(data);
        } else if (currentGameType === "scrambleharder") {
          const data = await getScrambleHarderRound(session.hskLevel);
          setScrambleHarderData(data);
        } else if (currentGameType === "dedede") {
          const data = await getDededeRound();
          setDededeData(data);
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
        clearTimeout(generatingTimer.current);
        setShowGenerating(false);
        setLoading(false);
      }
    };

    fetchRound();
    return () => clearTimeout(generatingTimer.current);
  }, [session.currentRound, session.totalRounds, session.hskLevel, currentGameType, onToast]);

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
        {showGenerating && <div className="game-session-loading">Generating question<span className="ellipsis-anim" /></div>}
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

        {!loading && !error && currentGameType === "scrambler" && scramblerData && (
          <ScramblerGame
            round={scramblerData}
            onComplete={handleComplete}
          />
        )}

        {!loading && !error && currentGameType === "tunein" && tuneinData && (
          <TuneInGame
            round={tuneinData}
            onComplete={handleComplete}
          />
        )}

        {!loading && !error && currentGameType === "scrambleharder" && scrambleHarderData && (
          <ScrambleHarderGame
            round={scrambleHarderData}
            onComplete={handleComplete}
          />
        )}

        {!loading && !error && currentGameType === "dedede" && dededeData && (
          <DededeGame
            round={dededeData}
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  );
}
