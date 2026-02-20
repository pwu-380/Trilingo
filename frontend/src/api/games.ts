import { apiFetch } from "./client";
import type { MatchingRound, MadLibsRound, ScramblerRound, SentenceCount } from "../types/game";

export function getMatchingRound(level: number): Promise<MatchingRound> {
  return apiFetch(`/api/games/matching?level=${level}`);
}

export function getMadLibsRound(level: number): Promise<MadLibsRound> {
  return apiFetch(`/api/games/madlibs?level=${level}`);
}

export function getScramblerRound(level: number): Promise<ScramblerRound> {
  return apiFetch(`/api/games/scrambler?level=${level}`);
}

export function getSentenceCount(level: number): Promise<SentenceCount> {
  return apiFetch(`/api/games/sentence-count?level=${level}`);
}
