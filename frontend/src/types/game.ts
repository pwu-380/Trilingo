export interface MatchingPair {
  chinese: string;
  pinyin: string;
  english: string;
  audio_path: string | null;
}

export interface MatchingRound {
  pairs: MatchingPair[];
}

export interface MadLibsRound {
  sentence_zh: string;
  sentence_en: string;
  pinyin_sentence: string;
  vocab_word: string;
  options: string[];
  rate_limited: boolean;
}

export type GameType = "matching" | "madlibs" | "random";
