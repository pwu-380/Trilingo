import { useState } from "react";
import "./ChatInput.css";

interface Props {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      {/* 
        DO NOT ADD `autoFocus` TO THIS INPUT.
        
        On mobile browsers (Chrome/Firefox on Android/iOS), autofocusing an input 
        on mount instantly pops open the virtual keyboard. This forces the browser's 
        Visual Viewport to translate down to center the input, physically dragging 
        the top of the screen—including fixed headers and tab bars—up and out of view.
        
        If a chat is too short to have a scrollbar, the user cannot scroll up to trigger 
        the browser's scroll-chaining heuristics to snap the viewport back into place. 
        This leaves the app header permanently stuck off-screen.
        
        Removing autoFocus ensures the layout remains perfectly stable and pinned 
        when opening a chat session.
      */}
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type in Chinese..."
        disabled={disabled}
      />
      <button type="submit" disabled={disabled || !text.trim()}>
        {disabled ? "..." : "Send"}
      </button>
    </form>
  );
}
