import { useChat } from "./hooks/useChat";
import { useFlashcards } from "./hooks/useFlashcards";
import ChatPanel from "./components/chat/ChatPanel";
import FlashcardPanel from "./components/flashcards/FlashcardPanel";
import TabShell from "./components/shared/TabShell";

function App() {
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
