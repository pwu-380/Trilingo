import { apiFetch } from "./client";
import type { MatchingRound, MadLibsRound } from "../types/game";

export function getMatchingRound(level: number): Promise<MatchingRound> {
  return apiFetch(`/api/games/matching?level=${level}`);
}

export function getMadLibsRound(level: number): Promise<MadLibsRound> {
  return apiFetch(`/api/games/madlibs?level=${level}`);
}
