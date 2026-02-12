import { useCallback, useEffect, useState } from "react";
import * as flashcardsApi from "../api/flashcards";
import type { Flashcard } from "../types/flashcard";

export function useFlashcards() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        return card;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create card");
        return null;
      }
    },
    [],
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

  return {
    cards,
    loading,
    error,
    refreshCards,
    createCard,
    deleteCard,
    clearError: () => setError(null),
  };
}
