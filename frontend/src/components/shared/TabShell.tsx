import { useState } from "react";
import UnderConstruction from "../../assets/Al-under-construction.jpg";
import "./TabShell.css";

type Tab = "chat" | "flashcards" | "games";

const TABS: { id: Tab; label: string; enabled: boolean }[] = [
  { id: "chat", label: "Chat", enabled: true },
  { id: "flashcards", label: "Flash Cards", enabled: false },
  { id: "games", label: "Games", enabled: false },
];

interface Props {
  children: React.ReactNode;
}

export default function TabShell({ children }: Props) {
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
        {activeTab !== "chat" && (
          <div className="tab-placeholder">
            <img src={UnderConstruction} alt="Under construction" />
            <p>Coming soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
