import { useEffect, useRef, useState } from "react";
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
  onDeleteSession: (id: number) => void;
  onSendMessage: (content: string) => void;
  onClearError: () => void;
  onAddCardFromWord?: (word: string) => void;
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
  onDeleteSession,
  onSendMessage,
  onClearError,
  onAddCardFromWord,
}: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const parent = messagesEndRef.current?.parentElement;
    if (parent) {
      parent.scrollTo({ top: parent.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="chat-panel">
      {sidebarOpen && (
        <div
          className="sidebar-overlay-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={`session-sidebar ${sidebarOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-mobile-header">
          <span>Chats</span>
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            &times;
          </button>
        </div>
        <button className="new-session-btn" onClick={onCreateSession}>
          + New Chat
        </button>
        <div className="session-list">
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`session-item ${s.id === currentSessionId ? "active" : ""}`}
              onClick={() => {
                onSelectSession(s.id);
                setSidebarOpen(false);
              }}
            >
              <span className="session-title">{s.title || "New conversation"}</span>
              <button
                className="session-delete"
                title="Delete chat"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(s.id);
                }}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </aside>

      <main className="chat-main">
        <div className="chat-header-mobile">
          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sessions"
          >
            ☰
          </button>
          <span className="chat-header-title">
            {sessions.find((s) => s.id === currentSessionId)?.title || "Trilingo Chat"}
          </span>
        </div>
        {error && (
          <div className="chat-error" onClick={onClearError}>
            {error}
          </div>
        )}

        {!currentSessionId ? (
          <div className="chat-welcome">
            <img src={AlProfilePic} alt="Alister" className="welcome-avatar" />
            <h2>Meet Alister</h2>
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
                <MessageBubble
                  key={m.id}
                  message={m}
                  onAddCardFromWord={onAddCardFromWord}
                />
              ))}
              {sending && (
                <div className="typing-indicator">Alister is typing</div>
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
