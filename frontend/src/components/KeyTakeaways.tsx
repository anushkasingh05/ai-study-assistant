import React, { useState } from "react";
import "./KeyTakeaways.css";

interface KeyTakeawaysProps {
  summary: string;
  takeaways: string[];
  topicTitle?: string;
}

export const KeyTakeaways: React.FC<KeyTakeawaysProps> = ({
  summary,
  takeaways,
}) => {
  const [checkedItems, setCheckedItems] = useState<{ [index: number]: boolean }>({});

  const toggleCheck = (index: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const totalCount = takeaways.length;
  const completedCount = Object.values(checkedItems).filter(Boolean).length;

  return (
    <div className="takeaways-container">
      {summary && (
        <div className="summary-card">
          <div className="summary-badge">📋 Concept Overview</div>
          <p className="summary-text">{summary}</p>
        </div>
      )}

      {takeaways.length > 0 && (
        <div className="checklist-card">
          <div className="checklist-header">
            <h4>Core Takeaways & Checkpoints</h4>
            <span className="checklist-progress">
              {completedCount} / {totalCount} Reviewed
            </span>
          </div>

          <div className="checklist-items">
            {takeaways.map((item, idx) => {
              const isChecked = !!checkedItems[idx];
              return (
                <label
                  key={idx}
                  className={`checklist-item ${isChecked ? "is-checked" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCheck(idx)}
                  />
                  <span className="checkmark" />
                  <span className="item-text">{item}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyTakeaways;
