import { useCallback, useRef, useState } from "react";
import { authedUrl } from "../../api/client";
import type { Flashcard } from "../../types/flashcard";
import "./CardManager.css";

function EditableEnglish({ card, onSave }: { card: Flashcard; onSave: (id: number, english: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(card.english);
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== card.english) {
      onSave(card.id, trimmed);
    } else {
      setValue(card.english);
    }
    setEditing(false);
  };

  if (!editing) {
    return (
      <div
        className="cm-card-english cm-card-english-editable"
        onClick={() => { setEditing(true); setTimeout(() => inputRef.current?.focus(), 0); }}
        title="Click to edit"
      >
        {card.english}
      </div>
    );
  }

  return (
    <input
      ref={inputRef}
      className="cm-card-english-input"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") { setValue(card.english); setEditing(false); }
      }}
    />
  );
}

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
  onSeedCards: (level: number, count: number) => Promise<number>;
  onUpdateEnglish: (id: number, english: string) => void;
  onRegenerateAssets: (id: number) => void;
}

export default function CardManager({
  cards,
  loading,
  onCreateCard,
  onDeleteCard,
  onToggleActive,
  onSeedCards,
  onUpdateEnglish,
  onRegenerateAssets,
}: Props) {
  const [chinese, setChinese] = useState("");
  const [english, setEnglish] = useState("");
  const [creating, setCreating] = useState(false);
  const [showPool, setShowPool] = useState<"active" | "inactive">("active");
  const [seedLevel, setSeedLevel] = useState(1);
  const [seeding, setSeeding] = useState(false);

  const playAudio = useCallback((cardId: number) => {
    const audio = new Audio(authedUrl(`/api/flashcards/${cardId}/audio`));
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

      <div className="cm-toolbar">
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
        <div className="cm-seed">
          <button
            className="cm-seed-btn"
            disabled={seeding}
            onClick={async () => {
              setSeeding(true);
              await onSeedCards(seedLevel, 10);
              setSeeding(false);
            }}
          >
            {seeding ? "Seeding..." : "Autoseed 10 Cards"}
          </button>
          <label className="cm-seed-label">
            HSK Level:
            <select
              className="cm-seed-select"
              value={seedLevel}
              onChange={(e) => setSeedLevel(Number(e.target.value))}
              disabled={seeding}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </label>
        </div>
      </div>

      {loading && <div className="cm-loading">Loading cards...</div>}

      <div className="cm-grid">
        {displayCards.map((card) => (
          <div key={card.id} className="cm-card">
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
                <button
                  className="cm-card-toggle"
                  onClick={() => onRegenerateAssets(card.id)}
                  title="Regenerate audio, image, and tip"
                >
                  Regen
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
            {(() => { const img = parseImagePath(card.image_path); return img ? (
              <div className="cm-card-image">
                <img src={`/assets/${img.path}?v=${encodeURIComponent(card.image_path || "")}`} alt={card.english} />
                <span className="cm-card-attribution">{img.creator} / {img.license}</span>
              </div>
            ) : null; })()}
            <EditableEnglish card={card} onSave={onUpdateEnglish} />
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
