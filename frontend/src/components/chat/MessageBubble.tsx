import type { ChatMessage, Emotion } from "../../types/chat";
import ChineseText from "../shared/ChineseText";
import SpoilerBlock from "../shared/SpoilerBlock";
import FeedbackPanel from "./FeedbackPanel";
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
}

export default function MessageBubble({ message }: Props) {
  const isAssistant = message.role === "assistant";

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
          <ChineseText pairs={message.pinyin} />
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
    </div>
  );
}
