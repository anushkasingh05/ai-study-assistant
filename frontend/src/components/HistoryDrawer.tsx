import React, { useEffect, useState } from "react";
import type { HistoryItem, StudySet } from "../types/study";
import "./HistoryDrawer.css";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (studySet: StudySet) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  onSelectSession,
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const handleLoad = async (id: string) => {
    try {
      setLoadingId(id);
      const res = await fetch(`http://localhost:5000/api/history/${id}`);
      if (res.ok) {
        const fullSet = await res.json();
        onSelectSession(fullSet);
        onClose();
      }
    } catch (err) {
      console.error("Failed to load study set:", err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`http://localhost:5000/api/history/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete history item:", err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all study history?")) {
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/api/history", {
        method: "DELETE",
      });
      if (res.ok) {
        setHistory([]);
      }
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <span className="drawer-icon">📜</span>
            <div>
              <h3>Study History</h3>
              <p>Saved in database · Reload past decks anytime</p>
            </div>
          </div>

          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close history drawer"
          >
            ✕
          </button>
        </div>

        {/* Actions Bar */}
        {history.length > 0 && (
          <div className="drawer-sub-bar">
            <span className="history-count">{history.length} Saved Decks</span>
            <button
              type="button"
              className="clear-all-history-btn"
              onClick={handleClearAll}
            >
              Clear All
            </button>
          </div>
        )}

        {/* Content List */}
        <div className="drawer-content">
          {loading && (
            <div className="drawer-loading">
              <div className="drawer-spinner" />
              <p>Loading your study history...</p>
            </div>
          )}

          {!loading && history.length === 0 && (
            <div className="drawer-empty">
              <div className="drawer-empty-icon">📂</div>
              <h4>No Saved History Yet</h4>
              <p>Whenever you generate a flashcard set or quiz, it will automatically save here so you can review it anytime.</p>
            </div>
          )}

          {!loading && history.length > 0 && (
            <div className="history-list">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="history-card"
                  onClick={() => handleLoad(item.id)}
                >
                  <div className="history-card-top">
                    <h4 className="history-topic-title">{item.topicTitle}</h4>
                    <button
                      type="button"
                      className="history-delete-btn"
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Delete from history"
                      aria-label={`Delete ${item.topicTitle}`}
                    >
                      🗑️
                    </button>
                  </div>

                  {item.summary && (
                    <p className="history-summary">{item.summary}</p>
                  )}

                  <div className="history-card-footer">
                    <div className="history-badges">
                      <span className="h-badge cards-badge">
                        🗂️ {item.cardCount} Cards
                      </span>
                      <span className="h-badge quiz-badge">
                        📝 {item.quizCount} Quiz Qs
                      </span>
                    </div>

                    <button
                      type="button"
                      className="load-deck-btn"
                      disabled={loadingId === item.id}
                    >
                      {loadingId === item.id ? "Loading..." : "Load Deck →"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryDrawer;
