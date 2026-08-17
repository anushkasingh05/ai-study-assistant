import React from "react";
import "./ErrorMessage.css";

interface ErrorMessageProps {
  error: string;
  code?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  code,
  onRetry,
  onDismiss,
}) => {
  const getHelpTip = () => {
    switch (code) {
      case "RATE_LIMIT":
        return "The AI service is experiencing high traffic. Waiting a few seconds usually resolves this.";
      case "SAFETY_BLOCKED":
        return "Try rephrasing your topic or removing potentially sensitive keywords.";
      case "INPUT_TOO_LONG":
        return "Try breaking your study notes into smaller sections (under 8,000 characters).";
      case "INVALID_INPUT":
        return "Please type a topic name, paste textbook notes, or ask a question.";
      case "AI_GATEWAY_ERROR":
        return "Check your internet connection or verify the backend server is running.";
      default:
        return "If this topic is very abstract or contains typos, try entering a clearer subject or adding a question mark.";
    }
  };

  return (
    <div className="error-card" role="alert" aria-live="assertive">
      <div className="error-card-header">
        <div className="error-icon-badge">⚠️</div>
        <div className="error-header-text">
          <h4 className="error-title">Unable to Generate Study Set</h4>
          <p className="error-description">{error}</p>
        </div>
      </div>

      <div className="error-help-box">
        <span className="help-icon">💡</span>
        <p className="help-text">{getHelpTip()}</p>
      </div>

      <div className="error-actions">
        {onRetry && (
          <button
            type="button"
            className="retry-btn"
            onClick={onRetry}
            id="retry-generation-button"
          >
            <span className="retry-icon">🔄</span>
            Try Again
          </button>
        )}

        {onDismiss && (
          <button
            type="button"
            className="dismiss-btn"
            onClick={onDismiss}
            id="dismiss-error-button"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
