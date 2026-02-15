import "./WordPopup.css";

interface Props {
  word: string;
  pinyin: string;
  rect: DOMRect;
  onAdd: (word: string) => void;
  onClose: () => void;
}

export default function WordPopup({ word, pinyin, rect, onAdd, onClose }: Props) {
  const handleAdd = () => {
    onAdd(word);
    onClose();
  };

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
          <button className="word-popup-add-btn" onClick={handleAdd}>
            Add to Flash Cards
          </button>
        </div>
      </div>
    </>
  );
}
