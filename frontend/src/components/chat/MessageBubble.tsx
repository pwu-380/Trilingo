import { useEffect, useState } from "react";
import type { ChatMessage, Emotion, WordBoundary } from "../../types/chat";
import { segmentMessage } from "../../api/chat";
import ChineseText from "../shared/ChineseText";
import SpoilerBlock from "../shared/SpoilerBlock";
import FeedbackPanel from "./FeedbackPanel";
import WordPopup from "./WordPopup";
import AlIconNeutral from "../../assets/Al-profile-icon-small.png";
import AlIconConfused from "../../assets/Al-profile-icon-small-confused.png";
import AlIconMad from "../../assets/Al-profile-icon-small-mad.png";
import "./MessageBubble.css";

const AL_ICONS: Record<Emotion, string> = {
  neutral: AlIconNeutral,
  confused: AlIconConfused,
  mad: AlIconMad,
};

interface Props {
  message: ChatMessage;
  onAddCardFromWord?: (word: string) => Promise<{ duplicate: boolean }>;
}

interface PopupInfo {
  word: string;
  pinyin: string;
  rect: DOMRect;
}

export default function MessageBubble({ message, onAddCardFromWord }: Props) {
  const isAssistant = message.role === "assistant";
  const [words, setWords] = useState<WordBoundary[] | null>(null);
  const [popup, setPopup] = useState<PopupInfo | null>(null);

  // Fetch segmentation for assistant messages that have pinyin
  useEffect(() => {
    if (isAssistant && message.pinyin && message.id > 0 && onAddCardFromWord) {
      segmentMessage(message.id)
        .then((res) => setWords(res.words))
        .catch(() => {});
    }
  }, [isAssistant, message.id, message.pinyin, onAddCardFromWord]);

  const handleWordClick = (word: string, pinyin: string, rect: DOMRect) => {
    setPopup({ word, pinyin, rect });
  };

  return (
    <div className={`message-bubble ${message.role}`}>
      {isAssistant && (
        <img
          className="al-avatar"
          src={AL_ICONS[message.emotion ?? "neutral"]}
          alt="Alister"
        />
      )}
      <div className="message-content">
        {isAssistant && message.pinyin ? (
          <ChineseText
            pairs={message.pinyin}
            words={words ?? undefined}
            onWordClick={onAddCardFromWord ? handleWordClick : undefined}
          />
        ) : (
          <span className="message-text">{message.content}</span>
        )}

        {isAssistant && message.translation && (
          <SpoilerBlock>{message.translation}</SpoilerBlock>
        )}

        {isAssistant && message.feedback && (
          <FeedbackPanel feedback={message.feedback} />
        )}
      </div>

      {popup && onAddCardFromWord && (
        <WordPopup
          word={popup.word}
          pinyin={popup.pinyin}
          rect={popup.rect}
          onAdd={onAddCardFromWord}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}
