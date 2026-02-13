import { useEffect, useState } from "react";
import { checkAuth } from "./api/client";
import { useChat } from "./hooks/useChat";
import { useFlashcards } from "./hooks/useFlashcards";
import ChatPanel from "./components/chat/ChatPanel";
import FlashcardPanel from "./components/flashcards/FlashcardPanel";
import TabShell from "./components/shared/TabShell";

function App() {
  const [authState, setAuthState] = useState<
    "checking" | "ok" | "forbidden"
  >("checking");

  useEffect(() => {
    checkAuth().then((ok) => setAuthState(ok ? "ok" : "forbidden"));
  }, []);

  if (authState === "checking") return null;

  if (authState === "forbidden") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          flexDirection: "column",
          color: "#666",
          fontFamily: "monospace",
        }}
      >
        <h1 style={{ fontSize: "5rem", margin: 0, color: "#444" }}>403</h1>
        <p style={{ fontSize: "1.2rem" }}>Forbidden</p>
      </div>
    );
  }

  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  const chat = useChat();
  const fc = useFlashcards();

  return (
    <TabShell
      flashcardsContent={
        <FlashcardPanel
          cards={fc.cards}
          loading={fc.loading}
          error={fc.error}
          review={fc.review}
          quizLoading={fc.quizLoading}
          onCreateCard={fc.createCard}
          onDeleteCard={fc.deleteCard}
          onToggleActive={fc.toggleActive}
          onStartReview={fc.startReview}
          onSubmitAnswer={fc.submitAnswer}
          onNextQuestion={fc.nextQuestion}
          onEndReview={fc.endReview}
          onDeactivateCard={fc.deactivateDuringReview}
          onClearError={fc.clearError}
          onRefresh={fc.refreshCards}
        />
      }
    >
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
