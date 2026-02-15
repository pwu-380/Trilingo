import { apiFetch } from "./client";
import type {
  ChatSession,
  ChatSessionDetail,
  SegmentedMessageResponse,
  SendMessageResponse,
} from "../types/chat";

export function createSession(): Promise<ChatSession> {
  return apiFetch("/api/chat/sessions", { method: "POST" });
}

export function listSessions(): Promise<ChatSession[]> {
  return apiFetch("/api/chat/sessions");
}

export function getSession(id: number): Promise<ChatSessionDetail> {
  return apiFetch(`/api/chat/sessions/${id}`);
}

export async function deleteSession(id: number): Promise<void> {
  await apiFetch(`/api/chat/sessions/${id}`, { method: "DELETE" });
}

export function sendMessage(
  sessionId: number,
  content: string
): Promise<SendMessageResponse> {
  return apiFetch(`/api/chat/sessions/${sessionId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export function segmentMessage(
  messageId: number
): Promise<SegmentedMessageResponse> {
  return apiFetch(`/api/chat/messages/${messageId}/segment`, {
    method: "POST",
  });
}
