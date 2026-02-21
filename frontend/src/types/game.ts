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

export interface TuneInRound {
  audio_path: string;
  correct: string;
  correct_pinyin: string;
  correct_english: string;
  options: string[];
}

export interface AudioCardCount {
  count: number;
}

export interface ScrambleHarderRound {
  direction: string;         // "zh" or "en"
  prompt: string;
  words: string[];
  correct_order: string[];
  num_correct: number;
  full_sentence_zh: string;
  full_sentence_en: string;
  pinyin_sentence: string;
}

export interface DededeRound {
  sentence: string;
  english: string;
  pinyin: string;
  answer: string;   // "的", "得", or "地"
  audio_path: string | null;
}

export type GameType = "matching" | "madlibs" | "scrambler" | "tunein" | "scrambleharder" | "dedede" | "random";
