import { useCallback, useEffect, useRef, useState } from "react";
import { authedUrl } from "../../api/client";
import type { QuizQuestion, QuizAnswerResponse } from "../../types/flashcard";
import type { ReviewMode } from "../../hooks/useFlashcards";
import { playCorrect, playIncorrect } from "../../hooks/useSounds";
import CongratulationImg from "../../assets/Congratulation.jpg";
import "./QuizView.css";

function parseImagePath(imagePath: string | null) {
  if (!imagePath) return null;
  const [path, creator, license] = imagePath.split("|");
  return { path, creator: creator || "Unknown", license: license || "CC" };
}

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
  review: ReviewSession;
  quizLoading: boolean;
  onSubmitAnswer: (answer: string) => void;
  onNextQuestion: () => void;
  onEndReview: () => void;
  onDeactivateCard: (cardId: number) => void;
}

export default function QuizView({
  review,
  quizLoading,
  onSubmitAnswer,
  onNextQuestion,
  onEndReview,
  onDeactivateCard,
}: Props) {
  const [pinyinRevealed, setPinyinRevealed] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const prevResult = useRef<QuizAnswerResponse | null>(null);

  const playAudio = useCallback((cardId: number) => {
    const audio = new Audio(authedUrl(`/api/flashcards/${cardId}/audio`));
    audio.play().catch(() => {});
  }, []);

  useEffect(() => {
    if (review.lastResult && review.lastResult !== prevResult.current) {
      if (review.lastResult.correct) playCorrect();
      else playIncorrect();
      // Auto-play Chinese audio on correct answer in zh_to_en mode
      if (
        review.lastResult.correct &&
        review.currentQuestion?.quiz_type === "zh_to_en" &&
        review.currentQuestion?.audio_path
      ) {
        playAudio(review.currentQuestion.card_id);
      }
    }
    prevResult.current = review.lastResult;
  }, [review.lastResult, review.currentQuestion, playAudio]);

  const q = review.currentQuestion;

  // Session finished
  if (review.finished) {
    const pct = review.answered > 0 ? Math.round((review.correct / review.answered) * 100) : 0;
    return (
      <div className="qv">
        <div className="qv-finished">
          {pct === 100 && (
            <img
              className="qv-congrats-img"
              src={CongratulationImg}
              alt="Congratulations"
            />
          )}
          <h2>Review Complete</h2>
          <div className="qv-score">
            {review.correct} / {review.answered} correct ({pct}%)
          </div>
          <button className="qv-btn qv-btn-primary" onClick={onEndReview}>
            Back to Cards
          </button>
        </div>
      </div>
    );
  }

  if (quizLoading || !q) {
    return (
      <div className="qv">
        <div className="qv-loading">Loading question...</div>
      </div>
    );
  }

  const showingChinese = q.quiz_type === "zh_to_en";
  const hasResult = review.lastResult !== null;

  const handleOptionClick = (option: string) => {
    if (hasResult) return;
    setSelectedAnswer(option);
    onSubmitAnswer(option);
    // Play audio when clicking Chinese answers (en_to_zh)
    if (!showingChinese && q.audio_path) {
      playAudio(q.card_id);
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setPinyinRevealed(false);
    onNextQuestion();
  };

  const getOptionClass = (option: string) => {
    if (!hasResult) return "";
    if (option === review.lastResult!.correct_answer) return "correct";
    if (option === selectedAnswer && !review.lastResult!.correct) return "wrong";
    return "dimmed";
  };

  return (
    <div className="qv">
      <div className="qv-header">
        <div className="qv-progress">
          {review.mode !== "endless"
            ? `${review.answered + (hasResult ? 0 : 0)} / ${review.mode}`
            : `${review.answered} answered`}
          {" "}
          <span className="qv-score-inline">
            ({review.correct} correct)
          </span>
        </div>
        <button className="qv-btn qv-btn-end" onClick={onEndReview}>
          End Review
        </button>
      </div>

      <div className="qv-question">
        <div className="qv-label">
          {showingChinese ? "What does this mean?" : "Which is the correct translation?"}
        </div>
        {!showingChinese && (() => {
          const img = parseImagePath(q.image_path);
          return img ? (
            <div className="qv-image">
              <img src={`/assets/${img.path}`} alt="" />
            </div>
          ) : null;
        })()}
        <div className="qv-prompt-row">
          <div
            className={`qv-prompt ${showingChinese ? "qv-prompt-chinese" : ""}`}
            onClick={() => showingChinese && setPinyinRevealed((r) => !r)}
            title={showingChinese ? "Click to reveal pinyin" : undefined}
          >
            {q.prompt}
          </div>
          {showingChinese && (
            <button
              className="qv-speaker"
              onClick={() => playAudio(q.card_id)}
              title="Play audio"
            >
              &#x1f50a;
            </button>
          )}
        </div>
        {showingChinese && pinyinRevealed && q.pinyin && (
          <div className="qv-pinyin-reveal">{q.pinyin}</div>
        )}
      </div>

      <div className="qv-options">
        {q.options.map((option, i) => (
          <button
            key={i}
            className={`qv-option ${getOptionClass(option)}`}
            onClick={() => handleOptionClick(option)}
            disabled={hasResult}
          >
            {option}
          </button>
        ))}
      </div>

      {hasResult && (
        <div className="qv-result-row">
          <div className={`qv-result ${review.lastResult!.correct ? "qv-correct" : "qv-wrong"}`}>
            {review.lastResult!.correct ? "Correct!" : `Wrong — answer: ${review.lastResult!.correct_answer}`}
          </div>
          <div className="qv-result-actions">
            <button
              className="qv-btn qv-btn-shelve"
              onClick={() => onDeactivateCard(q.card_id)}
              title="I know this one — remove from active pool"
            >
              Shelve Card
            </button>
            <button className="qv-btn qv-btn-primary" onClick={handleNext}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
