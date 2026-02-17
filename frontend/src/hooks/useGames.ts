import { useCallback, useState } from "react";
import type { GameType } from "../types/game";

export interface GameSession {
  hskLevel: number;
  totalRounds: number;
  gameType: GameType;
  currentRound: number;
  score: number;
  gameSequence: ("matching" | "madlibs")[];
}

export function useGames() {
  const [session, setSession] = useState<GameSession | null>(null);
  const [hskLevel, setHskLevel] = useState(1);
  const [totalRounds, setTotalRounds] = useState(10);

  const startSession = useCallback(
    (gameType: GameType) => {
      // Pre-generate the game type sequence
      const sequence: ("matching" | "madlibs")[] = [];
      const types: ("matching" | "madlibs")[] = ["matching", "madlibs"];
      for (let i = 0; i < totalRounds; i++) {
        if (gameType === "random") {
          sequence.push(types[Math.floor(Math.random() * types.length)]);
        } else {
          sequence.push(gameType as "matching" | "madlibs");
        }
      }
      setSession({
        hskLevel,
        totalRounds,
        gameType,
        currentRound: 0,
        score: 0,
        gameSequence: sequence,
      });
    },
    [hskLevel, totalRounds],
  );

  const completeRound = useCallback((correct: boolean) => {
    setSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        currentRound: prev.currentRound + 1,
        score: correct ? prev.score + 1 : prev.score,
      };
    });
  }, []);

  const endSession = useCallback(() => {
    setSession(null);
  }, []);

  return {
    session,
    hskLevel,
    totalRounds,
    setHskLevel,
    setTotalRounds,
    startSession,
    completeRound,
    endSession,
  };
}
