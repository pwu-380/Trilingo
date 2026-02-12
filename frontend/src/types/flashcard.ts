export interface Flashcard {
  id: number;
  chinese: string;
  pinyin: string;
  english: string;
  notes: string | null;
  audio_path: string | null;
  image_path: string | null;
  active: boolean;
  created_at: string;
  source: string;
}

export interface QuizQuestion {
  card_id: number;
  quiz_type: "en_to_zh" | "zh_to_en";
  prompt: string;
  pinyin: string | null;
  options: string[];
}

export interface QuizAnswerResponse {
  correct: boolean;
  correct_answer: string;
}
