import { useState, useEffect, useCallback } from "react";
import type { Flashcard as FlashcardType } from "../types/study";
import "./Flashcard.css";

interface FlashcardDeckProps {
  cards: FlashcardType[];
  topicTitle?: string;
}

export function FlashcardDeck({ cards }: FlashcardDeckProps) {
  const [deck, setDeck] = useState<FlashcardType[]>(cards);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [masteredIds, setMasteredIds] = useState<Set<number>>(new Set());

  // Sync state if cards prop changes
  useEffect(() => {
    setDeck(cards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setMasteredIds(new Set());
  }, [cards]);

  const currentCard = deck[currentIndex];
  const total = deck.length;
  const isMastered = currentCard ? masteredIds.has(currentCard.id) : false;

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setIsFlipped(false);
      setShowHint(false);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, total]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setShowHint(false);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const toggleMastery = () => {
    if (!currentCard) return;
    setMasteredIds((prev) => {
      const next = new Set(prev);
      if (next.has(currentCard.id)) {
        next.delete(currentCard.id);
      } else {
        next.add(currentCard.id);
      }
      return next;
    });
  };

  const handleShuffle = () => {
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in a textarea or input
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        handleFlip();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlip, handleNext, handlePrevious]);

  if (!currentCard) {
    return (
      <div className="flashcard-empty">
        <p>No flashcards in this deck.</p>
      </div>
    );
  }

  return (
    <div className="flashcard-deck-wrapper">
      {/* Deck Controls Header */}
      <div className="deck-header">
        <div className="deck-stats">
          <span className="deck-counter">
            Card {currentIndex + 1} of {total}
          </span>
          {masteredIds.size > 0 && (
            <span className="mastered-badge">
              ✓ {masteredIds.size} Mastered
            </span>
          )}
        </div>

        <button
          type="button"
          className="shuffle-btn"
          onClick={handleShuffle}
          title="Shuffle deck order"
        >
          🔀 Shuffle
        </button>
      </div>

      {/* 3D Flip Card Container */}
      <div className="flip-card-perspective">
        <div
          className={`flip-card-inner ${isFlipped ? "flipped" : ""}`}
          onClick={handleFlip}
          role="button"
          tabIndex={0}
          aria-label="Flashcard. Press Space to flip."
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleFlip();
            }
          }}
        >
          {/* Card Front (Question) */}
          <div className="flip-card-face flip-card-front">
            <div className="card-face-header">
              <span className="card-side-label question-label">QUESTION</span>
              {isMastered && <span className="mastered-icon">⭐ Mastered</span>}
            </div>

            <div className="card-body">
              <h3 className="card-question-text">{currentCard.question}</h3>

              {currentCard.hint && (
                <div
                  className="hint-container"
                  onClick={(e) => {
                    e.stopPropagation(); // Don't flip when clicking hint toggle
                    setShowHint(!showHint);
                  }}
                >
                  <button type="button" className="hint-toggle-btn">
                    💡 {showHint ? "Hide Hint" : "Show Hint"}
                  </button>
                  {showHint && <p className="hint-text">{currentCard.hint}</p>}
                </div>
              )}
            </div>

            <div className="card-face-footer">
              <span className="flip-prompt">Click or press Space to reveal answer ↺</span>
            </div>
          </div>

          {/* Card Back (Answer) */}
          <div className="flip-card-face flip-card-back">
            <div className="card-face-header">
              <span className="card-side-label answer-label">ANSWER</span>
              {isMastered && <span className="mastered-icon">⭐ Mastered</span>}
            </div>

            <div className="card-body">
              <p className="card-answer-text">{currentCard.answer}</p>
            </div>

            <div className="card-face-footer">
              <span className="flip-prompt">Click or press Space to see question ↺</span>
            </div>
          </div>
        </div>
      </div>

      {/* Deck Actions & Navigation */}
      <div className="deck-nav-bar">
        <button
          type="button"
          className="nav-btn prev-btn"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          aria-label="Previous card"
        >
          ← Prev
        </button>

        <div className="center-actions">
          <button
            type="button"
            className={`mastery-toggle-btn ${isMastered ? "is-mastered" : ""}`}
            onClick={toggleMastery}
          >
            {isMastered ? "⭐ Mastered" : "☆ Mark as Mastered"}
          </button>

          <button
            type="button"
            className="flip-btn"
            onClick={handleFlip}
          >
            {isFlipped ? "Show Question" : "Reveal Answer"}
          </button>
        </div>

        <button
          type="button"
          className="nav-btn next-btn"
          onClick={handleNext}
          disabled={currentIndex === total - 1}
          aria-label="Next card"
        >
          Next →
        </button>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="keyboard-shortcuts-guide">
        <span><kbd>Space</kbd> Flip</span>
        <span>•</span>
        <span><kbd>←</kbd> / <kbd>→</kbd> Navigate</span>
      </div>
    </div>
  );
}

export default FlashcardDeck;