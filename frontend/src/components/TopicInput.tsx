import React, { useState } from "react";
import "./TopicInput.css";

interface TopicInputProps {
  onGenerate: (content: string) => void;
  loading?: boolean;
}

const examples = [
  "Photosynthesis & CAM Pathway",
  "Kubernetes Pods & Services",
  "React Hooks (useEffect & useMemo)",
  "AWS EC2 vs Lambda Serverless",
  "Newton's Laws of Motion",
];

export const TopicInput: React.FC<TopicInputProps> = ({
  onGenerate,
  loading = false,
}) => {
  const [content, setContent] = useState("");

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() || loading) {
      return;
    }
    onGenerate(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleExampleClick = (example: string) => {
    setContent(example);
  };

  const isNearLimit = content.length > 4500;

  return (
    <div className="topic-wrapper">
      <form onSubmit={handleSubmit} className="input-card">
        <div className="input-header">
          <div>
            <span className="input-label">✦ Enter Topic or Paste Study Notes</span>
            <p>Type any subject, question, or paste text to generate study flashcards and quizzes.</p>
          </div>

          <span className={`input-status ${loading ? "status-generating" : ""}`}>
            {loading ? "AI Generating..." : "AI Ready"}
          </span>
        </div>

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Example: Paste your lecture notes or enter a topic like 'Photosynthesis in desert plants' or 'Explain Docker containers'..."
          rows={6}
          maxLength={6000}
          disabled={loading}
          aria-label="Study material or topic input"
          id="topic-textarea-input"
        />

        <div className="input-footer">
          <span className={`char-count ${isNearLimit ? "char-count-warning" : ""}`}>
            {content.length} / 6000 {isNearLimit && "(approaching limit)"}
          </span>

          <div className="button-group">
            <span className="shortcut-hint">Press <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to run</span>
            <button
              type="submit"
              className="generate-button"
              disabled={!content.trim() || loading}
              id="generate-flashcards-button"
            >
              {loading ? (
                <>
                  <span className="btn-spinner" />
                  Generating...
                </>
              ) : (
                <>
                  Generate Study Set
                  <span className="btn-arrow">→</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <div className="examples">
        <span className="examples-label">Try an example:</span>
        <div className="chips-list">
          {examples.map((example) => (
            <button
              key={example}
              type="button"
              className="example-chip"
              onClick={() => handleExampleClick(example)}
              disabled={loading}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopicInput;