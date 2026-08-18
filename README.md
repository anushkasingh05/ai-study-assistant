# StudyAI — AI-Powered Study Assistant

StudyAI is a React-based educational assistant that converts a user's free-form study topic or question into structured, interactive flashcards using the Gemini API.

The project was built as part of a Frontend Internship Assignment, with a strong focus on handling unpredictable AI responses, loading/error states, structured data validation, and a reliable user experience.

---

## 🚀 Features

### 🧠 AI-Powered Flashcard Generation

* Enter any educational topic or question.
* Supports both technical and non-technical subjects.
* Examples:

  * AWS
  * Cloud Computing
  * DevOps
  * Kubernetes
  * Programming
  * Mathematics
  * Physics
  * Biology
  * History
  * Economics
  * General educational questions
* Gemini generates structured flashcard data instead of returning raw chatbot text.
* Flashcards contain questions and concise answers.

### 🔄 Interactive Flashcards

* Flip between question and answer.
* Navigate between multiple generated flashcards.
* Supports keyboard interaction where implemented.
* Designed for active-recall based learning.

### 🎯 Learning Features

* Track progress through the generated flashcards.
* Review generated questions and answers.
* Retry generation when an AI request fails.
* Clear empty, loading, and error states.

### 🌙 Dark Mode

* Light and dark themes are available.
* Theme state is handled on the frontend.

### 💾 Local Session Persistence

The application can use the browser's `localStorage` to preserve supported study-session information across page refreshes.

> MongoDB is **not currently implemented** in this version of StudyAI. Persistent database-backed history can be added as a future enhancement.

---

# 🏗️ Architecture

```text
                    ┌──────────────────────┐
                    │      React UI        │
                    │  TypeScript + Vite   │
                    └──────────┬───────────┘
                               │
                               │ POST /api/generate-flashcards
                               ▼
                    ┌──────────────────────┐
                    │    Express Backend   │
                    │      Node.js         │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      Gemini API      │
                    │    Google GenAI      │
                    └──────────┬───────────┘
                               │
                               │ Structured JSON
                               ▼
                    ┌──────────────────────┐
                    │   Zod Validation     │
                    │  Validate AI Output  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      React UI        │
                    │ Interactive Cards    │
                    └──────────────────────┘
```

---

# 🛠️ Tech Stack

## Frontend

* React
* TypeScript
* Vite
* React Hooks
* CSS

## Backend

* Node.js
* Express.js
* CORS
* dotenv
* Zod
* `@google/genai`

## AI

* Google Gemini API
* Gemini structured-output workflow

## Storage

* Browser `localStorage` for supported local session persistence
* No external database is currently required

---

# 📁 Project Structure

```text
ai-study-assistant/
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env
│   └── node_modules/
│
├── src/
│   ├── components/
│   │   ├── TopicInput.tsx
│   │   └── Flashcard.tsx
│   │
│   ├── App.tsx
│   ├── App.css
│   ├── main.tsx
│   └── ...
│
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

> Do not commit `backend/.env` or expose the Gemini API key in the frontend.

---

# ⚙️ Prerequisites

Make sure the following are installed:

* Node.js v18 or higher
* npm v9 or higher
* A Gemini API key

---

# 🔑 Environment Setup

Create a `.env` file inside the `backend` directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
```

The API key is used only by the backend.

The frontend does **not** directly access the Gemini API.

---

# ▶️ Running the Project

## 1. Install dependencies

From the project root:

```bash
npm install
```

Then install backend dependencies:

```bash
cd backend
npm install
```

Return to the project root:

```bash
cd ..
```

---

## 2. Start the backend

Open a terminal:

```bash
cd backend
node server.js
```

You should see:

```text
StudyAI backend running on http://localhost:5000
```

---

## 3. Start the frontend

Open another terminal from the project root:

```bash
npm run dev
```

The Vite development server will provide the frontend URL, usually:

```text
http://localhost:5173
```

The exact port may differ if another process is already using it.

---

# 🔌 API

## Generate Flashcards

### Endpoint

```text
POST /api/generate-flashcards
```

### Request

```json
{
  "topic": "AWS EC2"
}
```

### Response

```json
{
  "flashcards": [
    {
      "question": "What is Amazon EC2?",
      "answer": "Amazon EC2 is a service that provides resizable virtual servers in the AWS cloud."
    }
  ]
}
```

The frontend parses the structured response and renders it as interactive flashcards.

---

# 🛡️ Handling Unpredictable AI Output

One of the main goals of this project is to avoid treating AI output as automatically reliable.

The application includes multiple defensive checks.

## 1. Input Validation

The frontend checks whether the user entered a non-empty topic before making an API request.

---

## 2. Backend Validation

The backend checks the incoming request and rejects invalid or empty topics.

---

## 3. Structured AI Output

The Gemini request instructs the model to return structured JSON instead of conversational text.

The application expects:

```json
{
  "flashcards": [
    {
      "question": "...",
      "answer": "..."
    }
  ]
}
```

---

## 4. Zod Validation

The backend uses Zod to validate the AI response before sending it to the frontend.

This prevents unexpected AI output from being blindly rendered.

The expected structure is:

```text
flashcards
 ├── question: string
 └── answer: string
```

---

## 5. Frontend Defensive Validation

The frontend checks:

* Whether the API request succeeded
* Whether `flashcards` exists
* Whether it is an array
* Whether the array contains data
* Whether individual cards contain valid questions
* Whether individual cards contain valid answers

Invalid responses are rejected instead of being rendered.

---

## 6. Loading State

While Gemini is generating the response, the application displays a loading state.

This prevents users from repeatedly assuming the application has stopped responding.

---

## 7. Error State

If generation fails, the UI displays an understandable error message instead of crashing.

Possible causes include:

* Network failure
* Backend failure
* Gemini API failure
* Invalid AI response
* Empty AI response
* Invalid structured data

---

## 8. Retry

When generation fails, the user can retry the previous request without manually entering the topic again.

---

## 9. Empty State

When no flashcards have been generated, the application displays an empty state explaining what the user should do.

---

# 🧩 Why a Backend Is Used

The Gemini API key must not be exposed in the browser.

Therefore, the application follows this architecture:

```text
React Frontend
      │
      │ User topic
      ▼
Express Backend
      │
      │ API key stays here
      ▼
Gemini API
      │
      │ Structured response
      ▼
Express Backend
      │
      ▼
React Frontend
```

This keeps the API key server-side rather than shipping it with the frontend bundle.

---

# 📱 Responsive UI

The interface is designed to work across:

* Desktop
* Laptop
* Tablet
* Mobile

The layout uses responsive CSS so the main learning experience remains usable on smaller screens.

---

# ♿ User Experience

The application includes:

* Clear loading feedback
* Error messages
* Retry functionality
* Empty state
* Interactive flashcards
* Dark mode
* Keyboard-friendly interactions where implemented
* Clear visual hierarchy

---

# 🤖 AI Usage

AI tools were used during development for:

* Understanding Gemini API integration
* Debugging API and frontend issues
* Developing initial component structures
* Improving error handling
* Reviewing TypeScript logic
* Refining UI and CSS
* Testing different AI-response scenarios

The final application architecture and implementation were reviewed and tested manually.

The Gemini API is used to generate the educational flashcard content.

---

# ⚠️ Known Limitations

### 1. AI Accuracy

AI-generated educational content can occasionally contain incorrect or incomplete information.

The application validates the structure of the response, but structural validation does not guarantee factual correctness.

---

### 2. No Database

The current version does not use MongoDB or another external database.

Supported local session information is stored in the browser where implemented.

A future version could use MongoDB to provide:

* Search history
* Saved study sessions
* User-specific flashcard decks
* Cross-device persistence
* Session management

---

### 3. No Authentication

Authentication is not currently required because it was not necessary for the assignment.

---

### 4. API Availability

The application depends on the availability and quota of the Gemini API.

If the API is unavailable or the quota is exhausted, the application displays an error and provides a retry option.

---

### 5. Free-form Input

The application accepts free-form educational input, but extremely long or ambiguous requests may produce less useful results.

---

# 🚀 Future Improvements

Possible future enhancements include:

1. MongoDB-based study history
2. Saved flashcard decks
3. User accounts
4. Search history
5. Quiz mode
6. Re-test incorrect answers
7. Spaced repetition
8. PDF/DOCX upload
9. Streaming AI responses
10. AI-powered refinement of existing flashcards
11. Progress analytics
12. Export flashcards
13. Voice-based learning
14. Deployment to a cloud platform

---

# 🧪 Testing Scenarios

The application should be tested with different types of input.

### Technical

```text
What is AWS EC2?
```

### Programming

```text
Explain JavaScript closures.
```

### Science

```text
Explain photosynthesis.
```

### Mathematics

```text
Explain Newton's laws of motion.
```

### General Education

```text
What caused the Industrial Revolution?
```

### Ambiguous Input

```text
asdfghjkl
```

The application should handle unusual input without crashing.

### Empty Input

```text
```

The application should display an appropriate validation message.

---

# 📊 Assignment Requirements Mapping

| Assignment Requirement  | Implementation                                      |
| ----------------------- | --------------------------------------------------- |
| React                   | React + TypeScript                                  |
| React Hooks             | `useState`, `useRef` and other hooks where required |
| Free-form text input    | Topic/question input                                |
| Real LLM API            | Google Gemini API                                   |
| Backend API             | Express + Node.js                                   |
| Structured AI output    | JSON flashcard structure                            |
| Parse AI output         | JSON parsing                                        |
| Handle malformed output | Defensive validation and error handling             |
| Handle wrong shape      | Zod + frontend validation                           |
| Loading state           | Implemented                                         |
| Error state             | Implemented                                         |
| Empty state             | Implemented                                         |
| Retry                   | Implemented                                         |
| Mobile support          | Responsive CSS                                      |
| API key security        | API key stored server-side                          |
| README                  | This document                                       |
| AI usage note           | Included                                            |
| Known limitations       | Included                                            |
| Time spent              | See below                                           |

---

# ⏱️ Time Spent

Approximate development time:

* Architecture and backend setup: ~1.5 hours
* Gemini API integration: ~1 hour
* AI response validation and error handling: ~2 hours
* Interactive frontend: ~2 hours
* UI polish and responsive design: ~1 hour
* Testing and documentation: ~0.5 hour

**Total: approximately 8 hours**

---

# 👩‍💻 Author

**Anushka Kumari**

Frontend / AI Study Assistant Internship Assignment

---

# 📄 License

This project was created as an internship assignment and is intended for educational and demonstration purposes.
