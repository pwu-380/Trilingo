import { useCallback, useState } from "react";
import type { Flashcard } from "../../types/flashcard";
import "./CardManager.css";

function parseImagePath(imagePath: string | null) {
  if (!imagePath) return null;
  const [path, creator, license] = imagePath.split("|");
  return { path, creator: creator || "Unknown", license: license || "CC" };
}

interface Props {
  cards: Flashcard[];
  loading: boolean;
  onCreateCard: (chinese: string, english: string) => Promise<Flashcard | null>;
  onDeleteCard: (id: number) => void;
  onToggleActive: (id: number, active: boolean) => void;
}

export default function CardManager({
  cards,
  loading,
  onCreateCard,
  onDeleteCard,
  onToggleActive,
}: Props) {
  const [chinese, setChinese] = useState("");
  const [english, setEnglish] = useState("");
  const [creating, setCreating] = useState(false);
  const [showPool, setShowPool] = useState<"active" | "inactive">("active");

  const playAudio = useCallback((cardId: number) => {
    const audio = new Audio(`/api/flashcards/${cardId}/audio`);
    audio.play().catch(() => {});
  }, []);

  const activeCards = cards.filter((c) => c.active);
  const inactiveCards = cards.filter((c) => !c.active);
  const displayCards = showPool === "active" ? activeCards : inactiveCards;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chinese.trim() || !english.trim()) return;
    setCreating(true);
    const card = await onCreateCard(chinese.trim(), english.trim());
    if (card) {
      setChinese("");
      setEnglish("");
    }
    setCreating(false);
  };

  return (
    <div className="cm">
      <form className="cm-add-form" onSubmit={handleSubmit}>
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

      <div className="cm-pool-toggle">
        <button
          className={`cm-pool-btn ${showPool === "active" ? "active" : ""}`}
          onClick={() => setShowPool("active")}
        >
          Active ({activeCards.length})
        </button>
        <button
          className={`cm-pool-btn ${showPool === "inactive" ? "active" : ""}`}
          onClick={() => setShowPool("inactive")}
        >
          Inactive ({inactiveCards.length})
        </button>
      </div>

      {loading && <div className="cm-loading">Loading cards...</div>}

      <div className="cm-grid">
        {displayCards.map((card) => (
          <div key={card.id} className="cm-card">
            {(() => { const img = parseImagePath(card.image_path); return img ? (
              <div className="cm-card-image">
                <img src={`/assets/${img.path}`} alt={card.english} />
                <span className="cm-card-attribution">{img.creator} / {img.license}</span>
              </div>
            ) : null; })()}
            <div className="cm-card-top">
              <div className="cm-card-chinese">
                {card.chinese}
                {card.audio_path && (
                  <button
                    className="cm-card-speaker"
                    onClick={() => playAudio(card.id)}
                    title="Play audio"
                  >
                    &#x1f50a;
                  </button>
                )}
              </div>
              <div className="cm-card-actions">
                <button
                  className="cm-card-toggle"
                  onClick={() => onToggleActive(card.id, !card.active)}
                  title={card.active ? "Move to inactive" : "Reactivate"}
                >
                  {card.active ? "Shelve" : "Activate"}
                </button>
                {!card.active && (
                  <button
                    className="cm-card-delete"
                    onClick={() => onDeleteCard(card.id)}
                    title="Delete card"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>
            <div className="cm-card-pinyin">{card.pinyin}</div>
            <div className="cm-card-english">{card.english}</div>
            {card.notes && <div className="cm-card-notes">{card.notes}</div>}
            {card.source !== "manual" && (
              <div className="cm-card-source">{card.source}</div>
            )}
          </div>
        ))}
      </div>

      {!loading && displayCards.length === 0 && (
        <div className="cm-empty">
          {showPool === "active"
            ? "No active cards. Add one above or reactivate from the inactive pool."
            : "No inactive cards."}
        </div>
      )}
    </div>
  );
}
