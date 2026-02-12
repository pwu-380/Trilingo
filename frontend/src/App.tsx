import { useChat } from "./hooks/useChat";
import ChatPanel from "./components/chat/ChatPanel";
import TabShell from "./components/shared/TabShell";

function App() {
  const chat = useChat();

  return (
    <TabShell>
      <ChatPanel
        sessions={chat.sessions}
        currentSessionId={chat.currentSessionId}
        messages={chat.messages}
        loading={chat.loading}
        sending={chat.sending}
        error={chat.error}
        onSelectSession={chat.selectSession}
        onCreateSession={chat.createSession}
        onDeleteSession={chat.deleteSession}
        onSendMessage={chat.sendMessage}
        onClearError={chat.clearError}
      />
    </TabShell>
  );
}

export default App;
