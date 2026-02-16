import { useCallback, useEffect, useState } from "react";
import * as flashcardsApi from "../api/flashcards";
import type { Flashcard, QuizQuestion, QuizAnswerResponse } from "../types/flashcard";

export type ReviewMode = 10 | 20 | "endless";

interface ReviewSession {
  mode: ReviewMode;
  answered: number;
  correct: number;
  seenIds: number[];
  currentQuestion: QuizQuestion | null;
  lastResult: QuizAnswerResponse | null;
  finished: boolean;
}

export function useFlashcards() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<ReviewSession | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);

  // Poll a card until notes + assets are generated, then update it in state
  const pollForAssets = useCallback((cardId: number) => {
    let attempts = 0;
    const maxAttempts = 15;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const card = await flashcardsApi.getCard(cardId);
        const done = (card.notes && card.audio_path) || attempts >= maxAttempts;
        // Always update state with latest data (partial assets may have arrived)
        setCards((prev) => prev.map((c) => (c.id === cardId ? card : c)));
        if (done) clearInterval(interval);
      } catch {
        clearInterval(interval);
      }
    }, 2000);
  }, []);

  const refreshCards = useCallback(async () => {
    setLoading(true);
    try {
      const list = await flashcardsApi.listCards();
      setCards(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load cards");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCards();
  }, [refreshCards]);

  const createCard = useCallback(
    async (chinese: string, english: string) => {
      setError(null);
      try {
        const card = await flashcardsApi.createCard(chinese, english);
        setCards((prev) => [...prev, card]);
        if (!card.notes || !card.audio_path) pollForAssets(card.id);
        return card;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create card");
        return null;
      }
    },
    [pollForAssets],
  );

  const deleteCard = useCallback(async (id: number) => {
    setError(null);
    try {
      await flashcardsApi.deleteCard(id);
      setCards((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete card");
    }
  }, []);

  const toggleActive = useCallback(async (id: number, active: boolean) => {
    setError(null);
    try {
      const updated = await flashcardsApi.updateCard(id, { active });
      setCards((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update card");
    }
  }, []);

  const regenerateAssets = useCallback(
    async (id: number) => {
      setError(null);
      try {
        const updated = await flashcardsApi.regenerateAssets(id);
        setCards((prev) => prev.map((c) => (c.id === id ? updated : c)));
        pollForAssets(id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to regenerate assets");
      }
    },
    [pollForAssets],
  );

  // --- Review session ---

  const loadNextQuestion = useCallback(async (session: ReviewSession) => {
    // Check if session is done
    if (session.mode !== "endless" && session.answered >= session.mode) {
      setReview({ ...session, finished: true, currentQuestion: null });
      return;
    }

    setQuizLoading(true);
    try {
      // For non-endless, exclude already-seen cards to avoid repeats
      const excludeIds = session.mode !== "endless" ? session.seenIds : undefined;
      const question = await flashcardsApi.getQuiz(undefined, excludeIds);
      setReview({ ...session, currentQuestion: question, lastResult: null });
    } catch {
      // No more cards — session finished
      setReview({ ...session, finished: true, currentQuestion: null });
    } finally {
      setQuizLoading(false);
    }
  }, []);

  const startReview = useCallback(
    async (mode: ReviewMode) => {
      const session: ReviewSession = {
        mode,
        answered: 0,
        correct: 0,
        seenIds: [],
        currentQuestion: null,
        lastResult: null,
        finished: false,
      };
      setReview(session);
      await loadNextQuestion(session);
    },
    [loadNextQuestion],
  );

  const submitAnswer = useCallback(
    async (answer: string) => {
      if (!review?.currentQuestion) return;
      const q = review.currentQuestion;
      setError(null);
      try {
        const result = await flashcardsApi.submitAnswer(q.card_id, answer, q.quiz_type);
        const updated: ReviewSession = {
          ...review,
          answered: review.answered + 1,
          correct: review.correct + (result.correct ? 1 : 0),
          seenIds: [...review.seenIds, q.card_id],
          lastResult: result,
        };
        setReview(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to submit answer");
      }
    },
    [review],
  );

  const nextQuestion = useCallback(async () => {
    if (!review) return;
    await loadNextQuestion(review);
  }, [review, loadNextQuestion]);

  const endReview = useCallback(() => {
    setReview(null);
  }, []);

  // Deactivate card during review
  const deactivateDuringReview = useCallback(
    async (cardId: number) => {
      await toggleActive(cardId, false);
      if (review) {
        await loadNextQuestion(review);
      }
    },
    [review, toggleActive, loadNextQuestion],
  );

  return {
    cards,
    loading,
    error,
    review,
    quizLoading,
    refreshCards,
    createCard,
    deleteCard,
    toggleActive,
    startReview,
    submitAnswer,
    nextQuestion,
    endReview,
    deactivateDuringReview,
    pollForAssets,
    regenerateAssets,
    clearError: () => setError(null),
  };
}
