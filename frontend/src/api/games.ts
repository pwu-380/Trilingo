import { apiFetch } from "./client";
import type { MatchingRound, MadLibsRound, ScramblerRound, SentenceCount, TuneInRound, AudioCardCount, ScrambleHarderRound } from "../types/game";

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

export function getTuneInRound(level: number): Promise<TuneInRound> {
  return apiFetch(`/api/games/tunein?level=${level}`);
}

export function getAudioCardCount(): Promise<AudioCardCount> {
  return apiFetch(`/api/games/audio-card-count`);
}

export function getScrambleHarderRound(level: number): Promise<ScrambleHarderRound> {
  return apiFetch(`/api/games/scramble-harder?level=${level}`);
}
