const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const storage = require("./storage");

// Resolve .env path relative to this backend directory
dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const PORT = process.env.PORT || 5000;

// ========================================
// DATABASE INITIALIZATION (MONGODB)
// ========================================

storage.initDatabase(process.env.MONGODB_URI);

// ========================================
// GEMINI SETUP & VERIFICATION
// ========================================

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing in backend/.env");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ========================================
// RESPONSE SCHEMAS (ZOD)
// ========================================

const flashcardItemSchema = z.object({
  id: z.number().or(z.string()).transform((val) => Number(val) || Math.floor(Math.random() * 10000)),
  question: z.string().min(1, "Question cannot be empty"),
  answer: z.string().min(1, "Answer cannot be empty"),
  hint: z.string().optional().default(""),
});

const quizQuestionSchema = z.object({
  id: z.number().or(z.string()).transform((val) => Number(val) || Math.floor(Math.random() * 10000)),
  question: z.string().min(1, "Quiz question cannot be empty"),
  options: z.array(z.string()).min(2, "Must have at least 2 options"),
  correctIndex: z.number().int().min(0).max(10).default(0),
  explanation: z.string().default("No explanation provided."),
});

const studySetSchema = z.object({
  topicTitle: z.string().default("Study Session"),
  summary: z.string().default(""),
  keyTakeaways: z.array(z.string()).default([]),
  flashcards: z.array(flashcardItemSchema).min(1, "At least one flashcard is required"),
  quiz: z.array(quizQuestionSchema).default([]),
});

// ========================================
// RESILIENT JSON EXTRACTION & REPAIR
// ========================================

function extractAndSanitizeJSON(rawText) {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Received empty response from AI model.");
  }

  let text = rawText.trim();

  // Strip Markdown code block markers (e.g. ```json ... ``` or ``` ...)
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  // Find outermost curly braces { ... }
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  // Attempt 1: Direct JSON.parse
  try {
    return JSON.parse(text);
  } catch (initialError) {
    console.warn("Direct JSON.parse failed. Attempting syntax repair...", initialError.message);
  }

  // Attempt 2: Remove trailing commas in arrays/objects (common LLM glitch)
  try {
    const repaired = text
      .replace(/,\s*([\]}])/g, "$1")
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, ""); // strip unescaped control chars
    return JSON.parse(repaired);
  } catch (repairError) {
    console.error("JSON repair failed on text:", text);
    throw new Error("Unable to parse AI response as valid structured data.");
  }
}

// Fallback generator for extreme cases
function generateEmergencyFallback(topic) {
  return {
    topicTitle: topic.length > 40 ? topic.slice(0, 37) + "..." : topic,
    summary: `Overview notes for ${topic}.`,
    keyTakeaways: [
      `Key concept analysis regarding: ${topic}`,
      "Review the flashcard below for foundational understanding.",
    ],
    flashcards: [
      {
        id: 1,
        question: `What are the core fundamentals of "${topic}"?`,
        answer: `This topic covers concepts relating to ${topic}. If the topic was abstract or brief, try providing more context or specific questions.`,
        hint: "Review core definitions and practical applications.",
      },
    ],
    quiz: [
      {
        id: 1,
        question: `Which approach is best when studying "${topic}"?`,
        options: [
          "Break down concepts into active recall questions",
          "Memorize raw notes without testing",
          "Skip definitions and practice problems",
          "Read once and never review",
        ],
        correctIndex: 0,
        explanation: "Active recall and spaced repetition lead to superior long-term retention.",
      },
    ],
  };
}

// ========================================
// ROUTES
// ========================================

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "StudyAI backend is running 🚀",
    version: "2.1.0",
    model: "gemini-3.6-flash",
    database: storage.getDatabaseStatus(),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    database: storage.getDatabaseStatus(),
    timestamp: new Date().toISOString(),
  });
});

// ========================================
// HISTORY ROUTES (MONGODB / LOCAL)
// ========================================

app.get("/api/history", async (req, res) => {
  try {
    const history = await storage.getAllStudySessions();
    res.json(history);
  } catch (err) {
    console.error("Error fetching history:", err);
    res.status(500).json({ error: "Failed to fetch study history." });
  }
});

app.get("/api/history/:id", async (req, res) => {
  try {
    const session = await storage.getStudySessionById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Study session not found." });
    }
    res.json(session);
  } catch (err) {
    console.error("Error fetching study session:", err);
    res.status(500).json({ error: "Failed to fetch study session." });
  }
});

app.delete("/api/history/:id", async (req, res) => {
  try {
    await storage.deleteStudySession(req.params.id);
    res.json({ success: true, message: "Study session deleted." });
  } catch (err) {
    console.error("Error deleting study session:", err);
    res.status(500).json({ error: "Failed to delete study session." });
  }
});

app.delete("/api/history", async (req, res) => {
  try {
    await storage.clearAllHistory();
    res.json({ success: true, message: "All study history cleared." });
  } catch (err) {
    console.error("Error clearing history:", err);
    res.status(500).json({ error: "Failed to clear history." });
  }
});

// ========================================
// GENERATE STUDY SET (FLASHCARDS + QUIZ)
// ========================================

app.post("/api/generate-flashcards", async (req, res) => {
  const startTime = Date.now();

  try {
    const { topic } = req.body;

    // 1. Validate user input
    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return res.status(400).json({
        error: "Please enter a question, topic, or paste your study notes.",
        code: "INVALID_INPUT",
      });
    }

    const trimmedTopic = topic.trim();
    if (trimmedTopic.length > 8000) {
      return res.status(400).json({
        error: "Input text is too long (maximum 8,000 characters). Please provide a shorter excerpt.",
        code: "INPUT_TOO_LONG",
      });
    }

    console.log(`[${new Date().toISOString()}] Generating study set for: "${trimmedTopic.slice(0, 60)}..."`);

    // 2. Build Structured Prompt
    const prompt = `
You are StudyAI, an expert educational tutor.
A student has provided the following input. It could be specific notes, a textbook paragraph, a question, an educational topic, or random/unstructured text.

STUDENT INPUT:
"""${trimmedTopic}"""

YOUR MISSION:
1. Understand the core subject matter.
2. If valid educational content:
   - Extract a clean "topicTitle".
   - Write a 1-2 sentence concise "summary".
   - Extract 3-4 "keyTakeaways" bullet points.
   - Generate 4 to 8 high-quality "flashcards" (active recall question + clear student-friendly answer + helpful hint).
   - Generate 3 to 5 multiple-choice "quiz" questions (each with 4 options, a 0-based "correctIndex", and a clear educational "explanation").
3. If the input is random text, gibberish (e.g., "asdfghjkl"), or vague:
   - Do NOT crash or refuse.
   - Set "topicTitle" to "Topic Clarification & Study Guide".
   - Explain politely in the flashcards what could be understood or give examples of how to study effectively.
   - Generate at least 1-2 friendly flashcards and 1 quiz question on general study tips.

OUTPUT FORMAT:
Return ONLY a valid, single JSON object with NO extra commentary or markdown outside the JSON.
Follow this EXACT JSON schema:

{
  "topicTitle": "string",
  "summary": "string",
  "keyTakeaways": ["string", "string"],
  "flashcards": [
    {
      "id": 1,
      "question": "string",
      "answer": "string",
      "hint": "string"
    }
  ],
  "quiz": [
    {
      "id": 1,
      "question": "string",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "string"
    }
  ]
}
`;

    // 3. Call Gemini Interactions API
    let rawOutputText = "";
    try {
      const interaction = await ai.interactions.create({
        model: "gemini-3.6-flash",
        input: prompt,
      });

      rawOutputText = interaction.output_text;
    } catch (aiError) {
      console.error("Gemini API Error:", aiError);

      const errorMessage = aiError.message || "";
      if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota")) {
        return res.status(429).json({
          error: "AI rate limit reached. Please wait a few seconds and click Retry.",
          code: "RATE_LIMIT",
        });
      }

      if (errorMessage.includes("SAFETY") || errorMessage.includes("blocked")) {
        return res.status(422).json({
          error: "This topic was flagged by AI safety filters. Please try rephrasing your question.",
          code: "SAFETY_BLOCKED",
        });
      }

      return res.status(502).json({
        error: "Failed to connect to the AI model. Please check your internet connection and retry.",
        code: "AI_GATEWAY_ERROR",
        details: errorMessage,
      });
    }

    if (!rawOutputText) {
      console.warn("AI returned empty output text. Using emergency fallback.");
      const fallback = generateEmergencyFallback(trimmedTopic);
      const savedFallback = await storage.saveStudySession({
        ...fallback,
        promptTopic: trimmedTopic,
      });
      return res.json(savedFallback);
    }

    // 4. Sanitize and parse JSON
    let parsedJSON;
    try {
      parsedJSON = extractAndSanitizeJSON(rawOutputText);
    } catch (jsonErr) {
      console.warn("JSON extraction error:", jsonErr.message);
      const fallback = generateEmergencyFallback(trimmedTopic);
      const savedFallback = await storage.saveStudySession({
        ...fallback,
        promptTopic: trimmedTopic,
      });
      return res.json(savedFallback);
    }

    // 5. Validate with Zod Schema
    const parseResult = studySetSchema.safeParse(parsedJSON);
    let finalData;

    if (!parseResult.success) {
      console.warn("Zod validation encountered issues, applying repairs:", parseResult.error.format());
      
      if (Array.isArray(parsedJSON.flashcards) && parsedJSON.flashcards.length > 0) {
        const repairedCards = parsedJSON.flashcards.map((c, i) => ({
          id: i + 1,
          question: String(c.question || c.q || "Study Question"),
          answer: String(c.answer || c.a || "Study Answer"),
          hint: String(c.hint || ""),
        }));

        const repairedSet = {
          topicTitle: String(parsedJSON.topicTitle || "Study Set"),
          summary: String(parsedJSON.summary || ""),
          keyTakeaways: Array.isArray(parsedJSON.keyTakeaways) ? parsedJSON.keyTakeaways : [],
          flashcards: repairedCards,
          quiz: Array.isArray(parsedJSON.quiz) ? parsedJSON.quiz : [],
        };

        const finalValidation = studySetSchema.safeParse(repairedSet);
        if (finalValidation.success) {
          finalData = finalValidation.data;
        }
      }

      if (!finalData) {
        finalData = generateEmergencyFallback(trimmedTopic);
      }
    } else {
      finalData = parseResult.data;
    }

    // 6. Save to Database (MongoDB or fallback)
    const savedSession = await storage.saveStudySession({
      ...finalData,
      promptTopic: trimmedTopic,
    });

    console.log(`Study set generated and saved to history (${finalData.flashcards.length} cards, ${finalData.quiz.length} quiz questions) in ${Date.now() - startTime}ms ✅`);

    return res.json(savedSession);
  } catch (err) {
    console.error("Unhandled server error:", err);
    return res.status(500).json({
      error: "An unexpected error occurred while generating study materials. Please try again.",
      code: "SERVER_ERROR",
      details: err.message,
    });
  }
});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
  console.log(`StudyAI backend running on http://localhost:${PORT}`);
});