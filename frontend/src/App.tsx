import { useChat } from "./hooks/useChat";
import ChatPanel from "./components/chat/ChatPanel";

function App() {
  const chat = useChat();

  return (
    <ChatPanel
      sessions={chat.sessions}
      currentSessionId={chat.currentSessionId}
      messages={chat.messages}
      loading={chat.loading}
      sending={chat.sending}
      error={chat.error}
      onSelectSession={chat.selectSession}
      onCreateSession={chat.createSession}
      onSendMessage={chat.sendMessage}
      onClearError={chat.clearError}
    />
  );
}

export default App;
