import { useState } from "react";
import type { Flashcard } from "../../types/flashcard";
import "./FlashcardPanel.css";

interface Props {
  cards: Flashcard[];
  loading: boolean;
  error: string | null;
  onCreateCard: (chinese: string, english: string) => Promise<Flashcard | null>;
  onDeleteCard: (id: number) => void;
  onClearError: () => void;
  onRefresh: () => void;
}

export default function FlashcardPanel({
  cards,
  loading,
  error,
  onCreateCard,
  onDeleteCard,
  onClearError,
  onRefresh,
}: Props) {
  const [chinese, setChinese] = useState("");
  const [english, setEnglish] = useState("");
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chinese.trim() || !english.trim()) return;
    setCreating(true);
    const card = await onCreateCard(chinese.trim(), english.trim());
    if (card) {
      setChinese("");
      setEnglish("");
      // Refresh after a short delay to pick up AI-generated notes
      setTimeout(onRefresh, 3000);
    }
    setCreating(false);
  };

  return (
    <div className="fc-panel">
      <div className="fc-header">
        <h2>Flash Cards</h2>
        <span className="fc-count">{cards.length} cards</span>
      </div>

      {error && (
        <div className="fc-error" onClick={onClearError}>
          {error}
        </div>
      )}

      <form className="fc-add-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Chinese (e.g. 你好)"
          value={chinese}
          onChange={(e) => setChinese(e.target.value)}
          disabled={creating}
        />
        <input
          type="text"
          placeholder="English (e.g. hello)"
          value={english}
          onChange={(e) => setEnglish(e.target.value)}
          disabled={creating}
        />
        <button type="submit" disabled={creating || !chinese.trim() || !english.trim()}>
          {creating ? "Adding..." : "Add Card"}
        </button>
      </form>

      {loading && <div className="fc-loading">Loading cards...</div>}

      <div className="fc-grid">
        {cards.map((card) => (
          <div key={card.id} className="fc-card">
            <button
              className="fc-card-delete"
              onClick={() => onDeleteCard(card.id)}
              title="Delete card"
            >
              &times;
            </button>
            <div className="fc-card-chinese">{card.chinese}</div>
            <div className="fc-card-pinyin">{card.pinyin}</div>
            <div className="fc-card-english">{card.english}</div>
            {card.notes && <div className="fc-card-notes">{card.notes}</div>}
          </div>
        ))}
      </div>

      {!loading && cards.length === 0 && (
        <div className="fc-empty">No cards yet. Add one above!</div>
      )}
    </div>
  );
}
