import { apiFetch } from "./client";
import type { Flashcard, QuizQuestion, QuizAnswerResponse } from "../types/flashcard";

export function listCards(active?: boolean): Promise<Flashcard[]> {
  const params = active !== undefined ? `?active=${active}` : "";
  return apiFetch(`/api/flashcards${params}`);
}

export function createCard(
  chinese: string,
  english: string,
  pinyin?: string,
): Promise<Flashcard> {
  return apiFetch("/api/flashcards", {
    method: "POST",
    body: JSON.stringify({ chinese, english, pinyin: pinyin ?? "" }),
  });
}

export function getCard(id: number): Promise<Flashcard> {
  return apiFetch(`/api/flashcards/${id}`);
}

export function updateCard(
  id: number,
  fields: Partial<Pick<Flashcard, "chinese" | "pinyin" | "english" | "notes" | "active">>,
): Promise<Flashcard> {
  return apiFetch(`/api/flashcards/${id}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  });
}

export async function deleteCard(id: number): Promise<void> {
  await apiFetch(`/api/flashcards/${id}`, { method: "DELETE" });
}

export function getQuiz(quizType?: string, excludeIds?: number[]): Promise<QuizQuestion> {
  const params = new URLSearchParams();
  if (quizType) params.set("quiz_type", quizType);
  if (excludeIds?.length) params.set("exclude", excludeIds.join(","));
  const qs = params.toString();
  return apiFetch(`/api/flashcards/quiz${qs ? `?${qs}` : ""}`);
}

export function submitAnswer(
  cardId: number,
  answer: string,
  quizType: string,
): Promise<QuizAnswerResponse> {
  return apiFetch("/api/flashcards/quiz/answer", {
    method: "POST",
    body: JSON.stringify({ card_id: cardId, answer, quiz_type: quizType }),
  });
}
