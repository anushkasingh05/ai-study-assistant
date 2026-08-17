# 🧠 StudyAI — Intelligent Educational Study Assistant

> **Frontend Internship Assignment Submission**  
> An interactive educational web application that converts free-form notes and topics into structured, active-recall flashcard decks, interactive quizzes with wrong-answer re-testing, and concept checklists.

---

## 🚀 Quickstart & Setup

### Prerequisites
- **Node.js**: v18.0 or higher
- **NPM**: v9.0 or higher
- **Gemini API Key**: Added to `backend/.env`

### One-Command Setup & Run
From the root project folder:

```bash
# 1. Install all dependencies (backend + frontend)
npm run install:all

# 2. Start both backend and frontend development servers concurrently
npm run dev
```

### URLs
- **Frontend Application**: [http://localhost:5175](http://localhost:5175) (or `5173`)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## ✨ Features

### 1. 🗂️ 3D Active-Recall Flashcards
- **Interactive 3D Flip**: Click or press <kbd>Space</kbd> to seamlessly flip cards between Questions and Answers.
- **Hints & Prompts**: Expandable contextual hints to prompt recall before revealing answers.
- **Mastery Tracker**: Mark individual cards as *Mastered* vs *Need Review* with real-time deck progress.
- **Keyboard Navigation**:
  - <kbd>Space</kbd>: Flip card
  - <kbd>←</kbd> / <kbd>→</kbd>: Previous / Next card
- **Deck Shuffle**: Randomize card order for varied practice.

### 2. 📝 Adaptive Quiz Mode & Re-test Wrong Answers
- **Multiple-Choice Testing**: 4 options per question with immediate color-coded feedback.
- **Explanations**: Clear educational rationale provided after every answer.
- **Comprehensive Scorecard**: Real-time score calculation, percentage, and summary.
- **🔄 Re-test Wrong Answers**: Dedicated flow that isolates only the questions the student answered incorrectly, allowing them to re-test until achieving 100% mastery.

### 3. 📋 Key Takeaways & Concept Checklist
- 1-2 sentence concept synthesis.
- Interactive checklist to track key learning objectives.

### 4. 💾 Local Persistence & Dark Mode
- Automatically saves the active study session in `localStorage` so notes and progress are preserved on refresh.
- Fluid Dark and Light theme toggle.

---

## 🛡️ Robustness & Handling Bad AI Output (20% Weight)

LLM outputs are inherently non-deterministic and can fail, return malformed syntax, or output wrong shapes. This project implements a multi-tier defense architecture:

```
[User Input]
     │
     ▼
[Frontend: AbortController & Request Sequence ID] ──> (Prevents Race Conditions & Stale Overwrites)
     │
     ▼
[Backend: Gemini Interactions API]
     │
     ▼
[Layer 1: JSON Sanitizer & Markdown Fence Stripper] ──> (Strips ```json code blocks & extracts outermost braces)
     │
     ▼
[Layer 2: Syntax Auto-Repair Engine] ──> (Removes illegal trailing commas & unescaped control chars)
     │
     ▼
[Layer 3: Zod Schema Validation & Coercion] ──> (Ensures exact data types, fallback IDs, & array lengths)
     │
     ▼
[Layer 4: Emergency Fallback Generator] ──> (Guarantees zero crashes even on extreme AI failure)
     │
     ▼
[Frontend: Defensive UI & One-Click Retry State] ──> (Categorized error help & easy recovery)
```

### Specific Failure Scenarios Handled:
1. **Random / Gibberish Topics (e.g. `"asdfghjkl"`, `"xyz987"`):**
   - The AI prompt contains explicit instructions for ambiguous inputs. Rather than throwing a 500 error or refusing, it synthesizes a helpful "Topic Clarification & Study Guide" deck.
2. **Markdown Code Fences & Extra Commentary:**
   - Raw output is sanitized via regex to remove ```` ```json ```` tags and locate exact JSON boundaries `{ ... }`.
3. **Trailing Commas & Malformed LLM Syntax:**
   - A secondary syntax repair engine cleans trailing commas before closing braces before JSON parsing.
4. **Stale Responses & Race Conditions:**
   - If a user sends a request and quickly submits a new one, `AbortController` terminates the pending fetch and a monotonic request sequence counter ignores older responses if they arrive out-of-order.
5. **Rate Limits & API Errors (429, 502, 504):**
   - The backend maps specific error codes (`RATE_LIMIT`, `SAFETY_BLOCKED`, `INPUT_TOO_LONG`) to user-friendly messages with an actionable **"🔄 Try Again"** button.

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Vite, CSS Modules / Custom Properties (No heavy UI libraries, zero bloat).
- **Backend**: Node.js, Express, `@google/genai` (Gemini Interactions API), Zod, Dotenv.
- **Security**: The Gemini API key is strictly stored server-side in `backend/.env` and never exposed to the client bundle.

---

## 🤖 AI Usage Note

In accordance with the assignment guidelines:
- **AI Tools Used**: Google Gemini API for educational content generation (`gemini-3.6-flash`). Antigravity / AI assistant used for scaffolding TypeScript interfaces, refining CSS animations, and generating test fixtures.
- **Code Understanding**: All state management, race-condition mitigation (`AbortController`), Zod schema validators, and component lifecycle logic are fully understood and can be explained and live-coded during the technical interview.

---

## ⚠️ Known Limitations & Future Roadmap

1. **Document / PDF Upload**: Currently accepts free-form pasted text up to 6,000 characters. Future version could include native PDF/DOCX parsing.
2. **Spaced Repetition Scheduling**: Currently saves local sessions; could be extended with Anki-style SuperMemo SM-2 interval algorithms.
3. **Audio Pronunciation**: Could integrate Web Speech API for auditory learning.

---

## ⏱️ Time Spent

- **Architecture Planning & Backend Proxy**: ~1.5 hours
- **Error Handling Pipeline & Zod Validation**: ~2 hours
- **Interactive UI (Flashcard 3D flip, Quiz runner, Re-test flow)**: ~2.5 hours
- **Keyboard Navigation, Dark Mode, & Polish**: ~1 hour
- **Testing, Documentation, & README**: ~1 hour
- **Total Time**: ~8 hours
