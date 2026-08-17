export interface Flashcard {
  id: number;
  question: string;
  answer: string;
  hint?: string;
  mastered?: boolean;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface StudySet {
  topicTitle: string;
  summary: string;
  keyTakeaways: string[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}

export interface HistoryItem {
  id: string;
  topicTitle: string;
  promptTopic: string;
  summary: string;
  cardCount: number;
  quizCount: number;
  createdAt: string;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: string;
}