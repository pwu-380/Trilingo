import { useState } from "react";
import "./TabShell.css";

type Tab = "chat" | "flashcards" | "games";

const TABS: { id: Tab; label: string; enabled: boolean }[] = [
  { id: "chat", label: "Chat", enabled: true },
  { id: "flashcards", label: "Flash Cards", enabled: true },
  { id: "games", label: "Games", enabled: true },
];

interface Props {
  children: React.ReactNode;
  flashcardsContent?: React.ReactNode;
  gamesContent?: React.ReactNode;
}

export default function TabShell({ children, flashcardsContent, gamesContent }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  return (
    <div className="tab-shell">
      <nav className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""} ${!tab.enabled ? "disabled" : ""}`}
            onClick={() => tab.enabled && setActiveTab(tab.id)}
            disabled={!tab.enabled}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="tab-content">
        {activeTab === "chat" && children}
        {activeTab === "flashcards" && flashcardsContent}
        {activeTab === "games" && gamesContent}
      </div>
    </div>
  );
}
