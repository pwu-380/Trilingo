import { useEffect, useRef } from "react";
import type { ChatMessage, ChatSession } from "../../types/chat";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import AlProfilePic from "../../assets/Al-profile-pic-large.jpg";
import "./ChatPanel.css";

interface Props {
  sessions: ChatSession[];
  currentSessionId: number | null;
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  onSelectSession: (id: number) => void;
  onCreateSession: () => void;
  onSendMessage: (content: string) => void;
  onClearError: () => void;
}

export default function ChatPanel({
  sessions,
  currentSessionId,
  messages,
  loading,
  sending,
  error,
  onSelectSession,
  onCreateSession,
  onSendMessage,
  onClearError,
}: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-panel">
      <aside className="session-sidebar">
        <button className="new-session-btn" onClick={onCreateSession}>
          + New Chat
        </button>
        <div className="session-list">
          {sessions.map((s) => (
            <button
              key={s.id}
              className={`session-item ${s.id === currentSessionId ? "active" : ""}`}
              onClick={() => onSelectSession(s.id)}
            >
              {s.title || "New conversation"}
            </button>
          ))}
        </div>
      </aside>

      <main className="chat-main">
        {error && (
          <div className="chat-error" onClick={onClearError}>
            {error}
          </div>
        )}

        {!currentSessionId ? (
          <div className="chat-welcome">
            <img src={AlProfilePic} alt="Al" className="welcome-avatar" />
            <h2>Meet Al</h2>
            <p>Your AI Mandarin tutor. Start a new chat to begin practicing.</p>
            <button className="welcome-start-btn" onClick={onCreateSession}>
              Start Chatting
            </button>
          </div>
        ) : loading ? (
          <div className="chat-loading">Loading conversation...</div>
        ) : (
          <>
            <div className="messages-area">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {sending && (
                <div className="typing-indicator">Al is typing...</div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <ChatInput onSend={onSendMessage} disabled={sending} />
          </>
        )}
      </main>
    </div>
  );
}
