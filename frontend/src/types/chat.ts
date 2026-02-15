export interface PinyinPair {
  char: string;
  pinyin: string;
}

export type Emotion = "neutral" | "confused" | "mad";

export interface ChatMessage {
  id: number;
  session_id: number;
  role: "user" | "assistant";
  content: string;
  pinyin: PinyinPair[] | null;
  translation: string | null;
  feedback: string | null;
  emotion: Emotion | null;
  created_at: string;
}

export interface ChatSession {
  id: number;
  created_at: string;
  title: string | null;
}

export interface ChatSessionDetail extends ChatSession {
  messages: ChatMessage[];
}

export interface SendMessageResponse {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
}

export interface WordBoundary {
  start: number;
  end: number;
  word: string;
}

export interface SegmentedMessageResponse {
  message_id: number;
  words: WordBoundary[];
}
