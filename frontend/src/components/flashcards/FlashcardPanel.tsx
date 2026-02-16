import type { Flashcard, QuizQuestion, QuizAnswerResponse } from "../../types/flashcard";
import type { ReviewMode } from "../../hooks/useFlashcards";
import CardManager from "./CardManager";
import QuizView from "./QuizView";
import "./FlashcardPanel.css";

interface ReviewSession {
  mode: ReviewMode;
  answered: number;
  correct: number;
  seenIds: number[];
  currentQuestion: QuizQuestion | null;
  lastResult: QuizAnswerResponse | null;
  finished: boolean;
}

interface Props {
  cards: Flashcard[];
  loading: boolean;
  error: string | null;
  review: ReviewSession | null;
  quizLoading: boolean;
  onCreateCard: (chinese: string, english: string) => Promise<Flashcard | null>;
  onDeleteCard: (id: number) => void;
  onToggleActive: (id: number, active: boolean) => void;
  onStartReview: (mode: ReviewMode) => void;
  onSubmitAnswer: (answer: string) => void;
  onNextQuestion: () => void;
  onEndReview: () => void;
  onDeactivateCard: (cardId: number) => void;
  onClearError: () => void;
  onRegenerateAssets: (id: number) => void;
}

export default function FlashcardPanel({
  cards,
  loading,
  error,
  review,
  quizLoading,
  onCreateCard,
  onDeleteCard,
  onToggleActive,
  onStartReview,
  onSubmitAnswer,
  onNextQuestion,
  onEndReview,
  onDeactivateCard,
  onClearError,
  onRegenerateAssets,
}: Props) {
  const activeCount = cards.filter((c) => c.active).length;
  const inReview = review !== null;

  return (
    <div className="fc-panel">
      {error && (
        <div className="fc-error" onClick={onClearError}>
          {error}
        </div>
      )}

      {!inReview && (
        <>
          <div className="fc-header">
            <h2>Flash Cards</h2>
            <div className="fc-review-buttons">
              <span className="fc-review-label">Review:</span>
              {([10, 20, "endless"] as ReviewMode[]).map((mode) => (
                <button
                  key={String(mode)}
                  className="fc-review-btn"
                  onClick={() => onStartReview(mode)}
                  disabled={activeCount < 1}
                  title={activeCount < 1 ? "Need at least 1 active card" : undefined}
                >
                  {mode === "endless" ? "Endless" : `${mode} Cards`}
                </button>
              ))}
            </div>
          </div>

          <CardManager
            cards={cards}
            loading={loading}
            onCreateCard={onCreateCard}
            onDeleteCard={onDeleteCard}
            onToggleActive={onToggleActive}
            onRegenerateAssets={onRegenerateAssets}
          />
        </>
      )}

      {inReview && (
        <QuizView
          review={review}
          quizLoading={quizLoading}
          onSubmitAnswer={onSubmitAnswer}
          onNextQuestion={onNextQuestion}
          onEndReview={onEndReview}
          onDeactivateCard={onDeactivateCard}
        />
      )}
    </div>
  );
}
