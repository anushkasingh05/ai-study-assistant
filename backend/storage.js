const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const StudySession = require("./models/StudySession");

const DATA_DIR = path.resolve(__dirname, "data");
const HISTORY_FILE = path.join(DATA_DIR, "history.json");

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(HISTORY_FILE)) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2), "utf8");
}

let isMongoConnected = false;

async function initDatabase(uri) {
  const mongoUri = uri || process.env.MONGODB_URI;

  if (!mongoUri) {
    isMongoConnected = false;
    console.log("📁 Storage: Local File Storage active (backend/data/history.json)");
    return;
  }

  try {
    console.log(`Connecting to MongoDB at: ${mongoUri.replace(/:\/\/.*@/, "://<hidden>@")}...`);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2500,
    });
    isMongoConnected = true;
    console.log("✅ Storage: Connected to MongoDB successfully!");
  } catch (err) {
    isMongoConnected = false;
    console.warn("⚠️ MongoDB connection warning:", err.message);
    console.log("📁 Storage: Falling back to Local File Storage (backend/data/history.json)");
  }
}

// Local File Storage Helpers
function readLocalHistory() {
  try {
    const raw = fs.readFileSync(HISTORY_FILE, "utf8");
    return JSON.parse(raw) || [];
  } catch (e) {
    console.error("Error reading local history file:", e);
    return [];
  }
}

function writeLocalHistory(data) {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing local history file:", e);
  }
}

// Storage Operations
async function saveStudySession(sessionData) {
  if (isMongoConnected) {
    try {
      const doc = new StudySession(sessionData);
      const saved = await doc.save();
      return {
        id: saved._id.toString(),
        ...sessionData,
        createdAt: saved.createdAt,
      };
    } catch (err) {
      console.warn("Mongo save failed, falling back to local file:", err.message);
    }
  }

  // Local File Fallback
  const list = readLocalHistory();
  const id = Date.now().toString();
  const entry = {
    id,
    ...sessionData,
    createdAt: new Date().toISOString(),
  };
  list.unshift(entry); // newest first
  writeLocalHistory(list.slice(0, 100)); // retain last 100 sessions
  return entry;
}

async function getAllStudySessions() {
  if (isMongoConnected) {
    try {
      const docs = await StudySession.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .select("topicTitle promptTopic summary flashcards quiz createdAt");

      return docs.map((doc) => ({
        id: doc._id.toString(),
        topicTitle: doc.topicTitle,
        promptTopic: doc.promptTopic,
        summary: doc.summary,
        cardCount: doc.flashcards ? doc.flashcards.length : 0,
        quizCount: doc.quiz ? doc.quiz.length : 0,
        createdAt: doc.createdAt,
      }));
    } catch (err) {
      console.warn("Mongo find failed, reading from local file:", err.message);
    }
  }

  // Local File Fallback
  const list = readLocalHistory();
  return list.map((item) => ({
    id: item.id,
    topicTitle: item.topicTitle,
    promptTopic: item.promptTopic,
    summary: item.summary,
    cardCount: item.flashcards ? item.flashcards.length : 0,
    quizCount: item.quiz ? item.quiz.length : 0,
    createdAt: item.createdAt,
  }));
}

async function getStudySessionById(id) {
  if (isMongoConnected && mongoose.Types.ObjectId.isValid(id)) {
    try {
      const doc = await StudySession.findById(id);
      if (doc) {
        return {
          id: doc._id.toString(),
          topicTitle: doc.topicTitle,
          promptTopic: doc.promptTopic,
          summary: doc.summary,
          keyTakeaways: doc.keyTakeaways,
          flashcards: doc.flashcards,
          quiz: doc.quiz,
          createdAt: doc.createdAt,
        };
      }
    } catch (err) {
      console.warn("Mongo findById failed:", err.message);
    }
  }

  // Local File Fallback
  const list = readLocalHistory();
  return list.find((item) => item.id === id) || null;
}

async function deleteStudySession(id) {
  if (isMongoConnected && mongoose.Types.ObjectId.isValid(id)) {
    try {
      await StudySession.findByIdAndDelete(id);
      return true;
    } catch (err) {
      console.warn("Mongo delete failed:", err.message);
    }
  }

  // Local File Fallback
  const list = readLocalHistory();
  const filtered = list.filter((item) => item.id !== id);
  writeLocalHistory(filtered);
  return true;
}

async function clearAllHistory() {
  if (isMongoConnected) {
    try {
      await StudySession.deleteMany({});
    } catch (err) {
      console.warn("Mongo clear failed:", err.message);
    }
  }

  writeLocalHistory([]);
  return true;
}

function getDatabaseStatus() {
  return {
    isMongoConnected,
    storageType: isMongoConnected ? "MongoDB" : "Local File Storage (data/history.json)",
  };
}

module.exports = {
  initDatabase,
  saveStudySession,
  getAllStudySessions,
  getStudySessionById,
  deleteStudySession,
  clearAllHistory,
  getDatabaseStatus,
};
