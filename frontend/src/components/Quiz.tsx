import React, { useState } from "react";
import type { QuizQuestion } from "../types/study";
import "./Quiz.css";

interface QuizProps {
  questions: QuizQuestion[];
  topicTitle?: string;
}

export const Quiz: React.FC<QuizProps> = ({ questions }) => {
  // Current active questions list (either all questions or only wrong ones during re-test)
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>(questions);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: number]: number }>({});
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isRetestMode, setIsRetestMode] = useState<boolean>(false);

  // If no questions exist
  if (!activeQuestions || activeQuestions.length === 0) {
    return (
      <div className="quiz-empty-state">
        <p>No quiz questions available for this topic yet.</p>
      </div>
    );
  }

  const currentQ = activeQuestions[currentIndex];
  const totalQuestions = activeQuestions.length;
  const currentAnswer = selectedAnswers[currentQ.id];
  const isAnswered = currentAnswer !== undefined;

  // Calculate wrong questions from the current round
  const wrongQuestions = activeQuestions.filter((q) => {
    const userSelected = selectedAnswers[q.id];
    return userSelected !== undefined && userSelected !== q.correctIndex;
  });

  const correctCount = activeQuestions.reduce((acc, q) => {
    return selectedAnswers[q.id] === q.correctIndex ? acc + 1 : acc;
  }, 0);

  const handleSelectOption = (optionIndex: number) => {
    if (isAnswered) return; // Prevent changing answer after selection

    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIndex,
    }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowExplanation(selectedAnswers[activeQuestions[currentIndex + 1].id] !== undefined);
    } else {
      setIsFinished(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setShowExplanation(selectedAnswers[activeQuestions[currentIndex - 1].id] !== undefined);
    }
  };

  // Re-test ONLY wrong answers flow
  const handleRetestWrong = () => {
    if (wrongQuestions.length === 0) return;
    setActiveQuestions(wrongQuestions);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setShowExplanation(false);
    setIsFinished(false);
    setIsRetestMode(true);
  };

  // Restart full quiz flow
  const handleRestartFull = () => {
    setActiveQuestions(questions);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setShowExplanation(false);
    setIsFinished(false);
    setIsRetestMode(false);
  };

  // Render Finished Summary Scorecard
  if (isFinished) {
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const isPerfect = scorePercentage === 100;

    return (
      <div className="quiz-container quiz-scorecard-view">
        <div className="scorecard-header">
          <div className="scorecard-badge">
            {isPerfect ? "🏆 Mastered!" : scorePercentage >= 70 ? "🎉 Great Job!" : "📚 Keep Practicing!"}
          </div>
          <h2>Quiz Completed</h2>
          {isRetestMode && <span className="retest-tag">Re-test Round</span>}
        </div>

        <div className="score-circle-container">
          <div className={`score-circle ${isPerfect ? "perfect" : scorePercentage >= 70 ? "good" : "needs-work"}`}>
            <span className="score-number">{scorePercentage}%</span>
            <span className="score-detail">{correctCount} / {totalQuestions} Correct</span>
          </div>
        </div>

        <p className="scorecard-feedback">
          {isPerfect
            ? "Flawless score! You have thoroughly mastered all concepts in this quiz."
            : scorePercentage >= 70
            ? "Solid understanding! Review the missed questions below to solidify your knowledge."
            : "Good effort! Active recall is all about learning from errors. Re-test your missed questions to improve."}
        </p>

        {wrongQuestions.length > 0 && (
          <div className="wrong-questions-summary">
            <h4>Questions to Review ({wrongQuestions.length})</h4>
            <div className="wrong-list">
              {wrongQuestions.map((q, idx) => (
                <div key={q.id || idx} className="wrong-item">
                  <p className="wrong-item-question">❌ {q.question}</p>
                  <p className="wrong-item-correct">
                    <strong>Correct answer:</strong> {q.options[q.correctIndex]}
                  </p>
                  <p className="wrong-item-explanation">{q.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="scorecard-actions">
          {wrongQuestions.length > 0 && (
            <button
              type="button"
              className="quiz-btn retest-wrong-btn"
              onClick={handleRetestWrong}
              id="retest-wrong-answers-button"
            >
              🔄 Re-test Wrong Answers ({wrongQuestions.length})
            </button>
          )}

          <button
            type="button"
            className="quiz-btn restart-full-btn"
            onClick={handleRestartFull}
            id="restart-full-quiz-button"
          >
            Restart Full Quiz
          </button>
        </div>
      </div>
    );
  }

  // Active Quiz View
  return (
    <div className="quiz-container">
      {/* Quiz Top Bar */}
      <div className="quiz-top-bar">
        <div className="quiz-progress-info">
          <span className="quiz-step-indicator">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          {isRetestMode && <span className="retest-pill">Re-test Mode</span>}
        </div>

        <div className="quiz-progress-bar-container">
          <div
            className="quiz-progress-fill"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="quiz-question-box">
        <h3 className="quiz-question-text">{currentQ.question}</h3>

        {/* Options List */}
        <div className="quiz-options-list">
          {currentQ.options.map((option, idx) => {
            const isSelected = currentAnswer === idx;
            const isCorrect = idx === currentQ.correctIndex;
            let optionClass = "quiz-option";

            if (isAnswered) {
              if (isSelected && isCorrect) {
                optionClass += " option-correct";
              } else if (isSelected && !isCorrect) {
                optionClass += " option-wrong";
              } else if (isCorrect) {
                optionClass += " option-correct-highlight";
              } else {
                optionClass += " option-dimmed";
              }
            }

            return (
              <button
                key={idx}
                type="button"
                className={optionClass}
                onClick={() => handleSelectOption(idx)}
                disabled={isAnswered}
                aria-label={`Option ${idx + 1}: ${option}`}
              >
                <span className="option-letter">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="option-text">{option}</span>
                {isAnswered && isCorrect && <span className="option-status-icon">✓</span>}
                {isAnswered && isSelected && !isCorrect && (
                  <span className="option-status-icon">✗</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Instant Feedback & Explanation */}
        {showExplanation && (
          <div
            className={`quiz-explanation-box ${
              currentAnswer === currentQ.correctIndex ? "feedback-success" : "feedback-error"
            }`}
          >
            <div className="explanation-header">
              <span className="explanation-icon">
                {currentAnswer === currentQ.correctIndex ? "✅ Correct!" : "❌ Incorrect"}
              </span>
            </div>
            <p className="explanation-text">{currentQ.explanation}</p>
          </div>
        )}
      </div>

      {/* Navigation Actions */}
      <div className="quiz-nav-footer">
        <button
          type="button"
          className="quiz-secondary-btn"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          ← Previous
        </button>

        <button
          type="button"
          className="quiz-primary-btn"
          onClick={handleNext}
          disabled={!isAnswered}
          id="quiz-next-button"
        >
          {currentIndex === totalQuestions - 1 ? "Finish Quiz & View Results →" : "Next Question →"}
        </button>
      </div>
    </div>
  );
};

export default Quiz;
