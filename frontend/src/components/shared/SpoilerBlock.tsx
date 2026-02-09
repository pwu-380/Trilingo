import { useState } from "react";
import "./SpoilerBlock.css";

interface Props {
  label?: string;
  children: React.ReactNode;
}

export default function SpoilerBlock({ label = "Translation", children }: Props) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div
      className={`spoiler-block ${revealed ? "revealed" : ""}`}
      onClick={() => setRevealed((r) => !r)}
    >
      {revealed ? (
        <div className="spoiler-content">{children}</div>
      ) : (
        <span className="spoiler-label">Click to reveal {label.toLowerCase()}</span>
      )}
    </div>
  );
}
