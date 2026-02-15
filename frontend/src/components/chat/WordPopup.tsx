import { useState } from "react";
import "./WordPopup.css";

type PopupState = "idle" | "adding" | "added" | "duplicate" | "error";

interface Props {
  word: string;
  pinyin: string;
  rect: DOMRect;
  onAdd: (word: string) => Promise<{ duplicate: boolean }>;
  onClose: () => void;
}

export default function WordPopup({ word, pinyin, rect, onAdd, onClose }: Props) {
  const [state, setState] = useState<PopupState>("idle");

  const handleAdd = async () => {
    setState("adding");
    try {
      const result = await onAdd(word);
      setState(result.duplicate ? "duplicate" : "added");
    } catch {
      setState("error");
    }
  };

  // Position the popup below the clicked word
  const style: React.CSSProperties = {
    position: "fixed",
    left: rect.left + rect.width / 2,
    top: rect.bottom + 8,
    transform: "translateX(-50%)",
  };

  return (
    <>
      <div className="word-popup-overlay" onClick={onClose} />
      <div className="word-popup" style={style}>
        <div className="word-popup-word">{word}</div>
        <div className="word-popup-pinyin">{pinyin}</div>
        <div className="word-popup-actions">
          {state === "idle" && (
            <button className="word-popup-add-btn" onClick={handleAdd}>
              Add to Flash Cards
            </button>
          )}
          {state === "adding" && (
            <span className="word-popup-status">Adding...</span>
          )}
          {state === "added" && (
            <span className="word-popup-status success">Card added!</span>
          )}
          {state === "duplicate" && (
            <span className="word-popup-status info">Already in your cards</span>
          )}
          {state === "error" && (
            <span className="word-popup-status error">Failed to add</span>
          )}
        </div>
      </div>
    </>
  );
}
