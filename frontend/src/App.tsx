import { useCallback, useEffect, useRef, useState } from "react";
import { checkAuth } from "./api/client";
import { createCardFromWord } from "./api/flashcards";
import { useChat } from "./hooks/useChat";
import { useFlashcards } from "./hooks/useFlashcards";
import { useGames } from "./hooks/useGames";
import ChatPanel from "./components/chat/ChatPanel";
import FlashcardPanel from "./components/flashcards/FlashcardPanel";
import GamesPanel from "./components/games/GamesPanel";
import TabShell from "./components/shared/TabShell";
import LoginPage from "./components/shared/LoginPage";
import ToastContainer, { type ToastData } from "./components/shared/Toast";

function App() {
  const [authState, setAuthState] = useState<
    "checking" | "ok" | "forbidden"
  >("checking");

  useEffect(() => {
    checkAuth().then((ok) => setAuthState(ok ? "ok" : "forbidden"));
  }, []);

  if (authState === "checking") return null;

  if (authState === "forbidden") {
    return <LoginPage onSuccess={() => setAuthState("ok")} />;
  }

  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  const chat = useChat();
  const fc = useFlashcards();
  const games = useGames();
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((message: string, type: ToastData["type"]) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleAddCardFromWord = useCallback(
    (word: string) => {
      createCardFromWord(word)
        .then((result) => {
          if (result.duplicate) {
            addToast(`'${word}' already in flash cards`, "info");
          } else {
            addToast(`Added '${word}' to flash cards`, "success");
          }
          fc.refreshCards();
          if (!result.duplicate && (!result.card.notes || !result.card.audio_path)) {
            fc.pollForAssets(result.card.id);
          }
        })
        .catch(() => {
          addToast(`Failed to add '${word}'`, "error");
        });
    },
    [fc, addToast],
  );

  return (
    <>
    <TabShell
      gamesContent={
        <GamesPanel
          session={games.session}
          hskLevel={games.hskLevel}
          totalRounds={games.totalRounds}
          onSetHskLevel={games.setHskLevel}
          onSetTotalRounds={games.setTotalRounds}
          onStartSession={games.startSession}
          onCompleteRound={games.completeRound}
          onEndSession={games.endSession}
          onAddCardFromWord={handleAddCardFromWord}
          onToast={addToast}
        />
      }
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
          onSeedCards={fc.seedCards}
          onRegenerateAssets={(id: number) => {
            fc.regenerateAssets(id).then(() => {
              addToast("Regenerating assets...", "info");
            });
          }}
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
        onAddCardFromWord={handleAddCardFromWord}
      />
    </TabShell>
    <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

export default App;
