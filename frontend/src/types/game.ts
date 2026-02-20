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

export interface ScramblerRound {
  sentence_en: string;
  words: string[];
  correct_order: string[];
  full_sentence_zh: string;
  pinyin_sentence: string;
}

export interface SentenceCount {
  hsk_level: number;
  count: number;
}

export type GameType = "matching" | "madlibs" | "scrambler" | "random";
