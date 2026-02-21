import { useCallback, useState } from "react";
import type { GameType } from "../types/game";

type ConcreteGame = "matching" | "madlibs" | "scrambler" | "tunein" | "scrambleharder" | "dedede";

export interface GameSession {
  hskLevel: number;
  totalRounds: number;
  gameType: GameType;
  currentRound: number;
  score: number;
  gameSequence: ConcreteGame[];
}

export function useGames() {
  const [session, setSession] = useState<GameSession | null>(null);
  const [hskLevel, setHskLevel] = useState(1);
  const [totalRounds, setTotalRounds] = useState(10);

  const startSession = useCallback(
    (gameType: GameType, excludeFromRandom: ConcreteGame[] = []) => {
      const allTypes: ConcreteGame[] = ["matching", "madlibs", "scrambler", "tunein", "scrambleharder", "dedede"];
      const available = allTypes.filter((t) => !excludeFromRandom.includes(t));

      const sequence: ConcreteGame[] = [];
      for (let i = 0; i < totalRounds; i++) {
        if (gameType === "random") {
          sequence.push(available[Math.floor(Math.random() * available.length)]);
        } else {
          sequence.push(gameType as ConcreteGame);
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
