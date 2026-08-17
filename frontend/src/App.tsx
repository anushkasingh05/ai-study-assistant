import { useState, useRef, useEffect } from "react";
import TopicInput from "./components/TopicInput";
import FlashcardDeck from "./components/Flashcard";
import Quiz from "./components/Quiz";
import KeyTakeaways from "./components/KeyTakeaways";
import ErrorMessage from "./components/ErrorMessage";
import HistoryDrawer from "./components/HistoryDrawer";
import type { StudySet, ApiErrorResponse } from "./types/study";
import "./App.css";

const LOCAL_STORAGE_KEY = "studyai_current_session";
const THEME_STORAGE_KEY = "studyai_theme";

export function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem(THEME_STORAGE_KEY) === "dark";
  });

  const [studySet, setStudySet] = useState<StudySet | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<"flashcards" | "quiz" | "takeaways">("flashcards");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<{ message: string; code?: string } | null>(null);
  const [lastTopic, setLastTopic] = useState<string>("");
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Refs for race-condition and stale-response prevention
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef<number>(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Sync dark mode class & localStorage
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, darkMode ? "dark" : "light");
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Persist study set to localStorage
  useEffect(() => {
    if (studySet) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(studySet));
    }
  }, [studySet]);

  const handleGenerate = async (topic: string) => {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) return;

    // 1. Cancel previous in-flight request to prevent race conditions & stale overwrite
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 2. Track monotonically increasing request ID
    requestSeqRef.current += 1;
    const currentSeqId = requestSeqRef.current;

    setLastTopic(trimmedTopic);
    setLoading(true);
    setErrorState(null);

    try {
      const response = await fetch("http://localhost:5000/api/generate-flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic: trimmedTopic }),
        signal: controller.signal,
      });

      const data = await response.json();

      // Check if another request was triggered while this one was pending
      if (currentSeqId !== requestSeqRef.current) {
        console.warn("Ignoring stale response from previous request.");
        return;
      }

      if (!response.ok) {
        const errorData = data as ApiErrorResponse;
        throw {
          message: errorData.error || "Failed to generate study set.",
          code: errorData.code,
        };
      }

      // Validate required data shape defensively
      const validFlashcards = Array.isArray(data.flashcards) ? data.flashcards : [];
      const validQuiz = Array.isArray(data.quiz) ? data.quiz : [];
      const validTakeaways = Array.isArray(data.keyTakeaways) ? data.keyTakeaways : [];

      const newStudySet: StudySet = {
        topicTitle: data.topicTitle || trimmedTopic,
        summary: data.summary || "",
        keyTakeaways: validTakeaways,
        flashcards: validFlashcards,
        quiz: validQuiz,
      };

      setStudySet(newStudySet);
      setActiveTab("flashcards");

      // Auto-scroll smoothly to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    } catch (err: any) {
      // Ignore AbortError caused by intentional user cancellation
      if (err.name === "AbortError") {
        console.log("Request was cancelled by a newer request.");
        return;
      }

      if (currentSeqId !== requestSeqRef.current) {
        return;
      }

      console.error("Study set generation error:", err);

      setErrorState({
        message: err.message || (typeof err === "string" ? err : "Unable to connect to the study assistant server."),
        code: err.code || "UNKNOWN_ERROR",
      });
    } finally {
      if (currentSeqId === requestSeqRef.current) {
        setLoading(false);
      }
    }
  };

  const handleRetry = () => {
    if (lastTopic) {
      handleGenerate(lastTopic);
    }
  };

  const handleClearSession = () => {
    setStudySet(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setErrorState(null);
  };

  const handleSelectHistorySession = (session: StudySet) => {
    setStudySet(session);
    setActiveTab("flashcards");
    setErrorState(null);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);
  };

  return (
    <main className={`app ${darkMode ? "dark" : ""}`}>
      {/* ================= NAVBAR ================= */}
      <nav className="navbar">
        <div className="brand">
          <div className="brand-icon">✦</div>
          <span className="brand-name">StudyAI</span>
          <span className="brand-badge">Assistant</span>
        </div>

        <div className="nav-actions">
          <button
            type="button"
            className="history-nav-btn"
            onClick={() => setIsHistoryOpen(true)}
            id="open-history-button"
            title="View database history"
          >
            📜 History
          </button>

          {studySet && (
            <button
              type="button"
              className="clear-session-btn"
              onClick={handleClearSession}
              title="Clear current study set"
            >
              🗑️ Clear
            </button>
          )}

          <button
            type="button"
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle dark mode"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </nav>

      {/* ================= HERO SECTION ================= */}
      <section className="hero">
        <div className="hero-badge">
          <span>✨</span>
          Interactive Flashcards & Quiz Generator
        </div>

        <h1>
          Learn smarter.
          <br />
          <span className="gradient-text">Remember more.</span>
        </h1>

        <p className="subtitle">
          Turn your notes, topics, or questions into active-recall flashcards, interactive quizzes, and key takeaways.
        </p>

        {/* Free-form Input Area */}
        <TopicInput onGenerate={handleGenerate} loading={loading} />

        {/* Error Handling UI with Retry */}
        {errorState && (
          <ErrorMessage
            error={errorState.message}
            code={errorState.code}
            onRetry={handleRetry}
            onDismiss={() => setErrorState(null)}
          />
        )}

        {/* Loading State Animation */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p className="loading-text">✨ AI is analyzing your topic and synthesizing questions...</p>
            <span className="loading-subtext">Building flashcards, multiple-choice quiz, and key takeaways</span>
          </div>
        )}

        {/* ================= RESULTS / STUDY SET ================= */}
        {!loading && studySet && (
          <section className="study-results-section" ref={resultsRef}>
            <div className="study-set-header">
              <span className="study-set-tag">📚 Study Set</span>
              <h2 className="study-set-title">{studySet.topicTitle}</h2>
            </div>

            {/* Study Mode Tab Switcher */}
            <div className="study-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "flashcards"}
                className={`tab-btn ${activeTab === "flashcards" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("flashcards")}
                id="tab-flashcards"
              >
                🗂️ Flashcards ({studySet.flashcards.length})
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "quiz"}
                className={`tab-btn ${activeTab === "quiz" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("quiz")}
                id="tab-quiz"
              >
                📝 Interactive Quiz ({studySet.quiz.length})
              </button>

              {studySet.keyTakeaways.length > 0 && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "takeaways"}
                  className={`tab-btn ${activeTab === "takeaways" ? "tab-active" : ""}`}
                  onClick={() => setActiveTab("takeaways")}
                  id="tab-takeaways"
                >
                  📋 Key Takeaways ({studySet.keyTakeaways.length})
                </button>
              )}
            </div>

            {/* Active Tab Views */}
            <div className="tab-content-area">
              {activeTab === "flashcards" && (
                <FlashcardDeck
                  cards={studySet.flashcards}
                  topicTitle={studySet.topicTitle}
                />
              )}

              {activeTab === "quiz" && (
                <Quiz
                  questions={studySet.quiz}
                  topicTitle={studySet.topicTitle}
                />
              )}

              {activeTab === "takeaways" && (
                <KeyTakeaways
                  summary={studySet.summary}
                  takeaways={studySet.keyTakeaways}
                  topicTitle={studySet.topicTitle}
                />
              )}
            </div>
          </section>
        )}

        {/* Empty State when no deck is loaded */}
        {!loading && !studySet && !errorState && (
          <div className="empty-state-card">
            <div className="empty-state-icon">💡</div>
            <h3>Ready to learn anything</h3>
            <p>
              Type any topic or paste study notes above to generate flashcards with 3D flip, an interactive quiz with wrong-answer retesting, and key takeaways.
            </p>
          </div>
        )}

        {/* Trust Badges */}
        <div className="trust-row">
          <span>✦ Structured JSON AI</span>
          <span>•</span>
          <span>🛡️ Resilient Error Handling</span>
          <span>•</span>
          <span>🔄 Wrong-Answer Re-test</span>
          <span>•</span>
          <span>📜 MongoDB History</span>
        </div>
      </section>

      {/* ================= FEATURES GRID ================= */}
      <section className="features" id="features">
        <div className="feature-card">
          <div className="feature-icon">🧠</div>
          <h3>Active Recall Flashcards</h3>
          <p>
            Flip through 3D interactive flashcards with hints and mastery tracking to reinforce learning.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🎯</div>
          <h3>Adaptive Quiz & Re-testing</h3>
          <p>
            Take instant multiple-choice quizzes with clear explanations and re-test only the questions you missed.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📜</div>
          <h3>Persistent Database History</h3>
          <p>
            Every search and study deck is automatically saved to the database so you can reload and practice anytime.
          </p>
        </div>
      </section>

      {/* ================= HISTORY DRAWER ================= */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectSession={handleSelectHistorySession}
      />

      {/* ================= FOOTER ================= */}
      <footer>
        StudyAI · Frontend Internship Assignment · Built with React 19, TypeScript, Node.js & MongoDB
      </footer>
    </main>
  );
}

export default App;