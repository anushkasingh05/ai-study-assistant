const mongoose = require("mongoose");

const FlashcardSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  hint: { type: String, default: "" },
});

const QuizQuestionSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true, default: 0 },
  explanation: { type: String, default: "" },
});

const StudySessionSchema = new mongoose.Schema(
  {
    topicTitle: { type: String, required: true, index: true },
    promptTopic: { type: String, required: true },
    summary: { type: String, default: "" },
    keyTakeaways: [{ type: String }],
    flashcards: [FlashcardSchema],
    quiz: [QuizQuestionSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("StudySession", StudySessionSchema);
