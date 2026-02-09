import { useCallback, useEffect, useState } from "react";
import * as chatApi from "../api/chat";
import type { ChatMessage, ChatSession } from "../types/chat";

export function useChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load session list
  const refreshSessions = useCallback(async () => {
    try {
      const list = await chatApi.listSessions();
      setSessions(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sessions");
    }
  }, []);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  // Load a session's messages
  const selectSession = useCallback(async (id: number) => {
    setCurrentSessionId(id);
    setLoading(true);
    setError(null);
    try {
      const detail = await chatApi.getSession(id);
      setMessages(detail.messages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load session");
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new session
  const createSession = useCallback(async () => {
    setError(null);
    try {
      const session = await chatApi.createSession();
      setSessions((prev) => [session, ...prev]);
      setCurrentSessionId(session.id);
      setMessages([]);
      return session;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create session");
      return null;
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!currentSessionId || sending) return;
      setSending(true);
      setError(null);
      try {
        const res = await chatApi.sendMessage(currentSessionId, content);
        setMessages((prev) => [...prev, res.user_message, res.assistant_message]);
        // Refresh session list to pick up auto-title
        refreshSessions();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to send message");
      } finally {
        setSending(false);
      }
    },
    [currentSessionId, sending, refreshSessions]
  );

  return {
    sessions,
    currentSessionId,
    messages,
    loading,
    sending,
    error,
    selectSession,
    createSession,
    sendMessage,
    clearError: () => setError(null),
  };
}
