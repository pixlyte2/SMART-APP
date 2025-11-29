const fs = require("fs");
const { extractTranscript } = require("../services/transcriptService");
const User = require("../models/users");
const { runWhisper } = require("../utils/runWhisper");

// Validate URL
function isValidHttpUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// MAIN TRANSCRIBE CONTROLLER
exports.transcribe = async (req, res) => {
  const { url } = req.body;

  // --- Case 1: YouTube URL transcript ---
  if (url) {
    if (!isValidHttpUrl(url)) {
      return res.status(400).json({ error: "Invalid URL" });
    }

    console.log("POST /api/transcribe (YouTube URL)", url);

    try {
      // Extract transcript from YouTube
      const transcript = await extractTranscript(url);

      console.log("Transcript length:", transcript.length);

      // Save history (non-blocking)
      saveHistory(req.user, "/api/transcribe", url);

      return res.json({ transcript });
    } catch (err) {
      console.error("Transcription error:", err.message);

      return res.status(500).json({
        error: "Transcription failed. Check server logs.",
        details: err.message,
      });
    }
  }

  // --- Case 2: Whisper local audio transcription ---
  try {
    console.log("POST /api/transcribe (Whisper Audio)");

    const audioFile = req.tempAudioPath; // added from downloader middleware
    if (!audioFile) {
      return res.status(400).json({ error: "Audio file missing" });
    }

    const txtFile = await runWhisper(audioFile);
    const transcript = fs.readFileSync(txtFile, "utf8");

    // Save history
    saveHistory(req.user, "/api/transcribe", audioFile);

    return res.json({ transcript });
  } catch (err) {
    console.error("Whisper error:", err);
    res.status(500).json({ error: "Whisper failed" });
  }
};

// SAVE USER HISTORY
async function saveHistory(userObj, action, url) {
  if (!userObj?.id) return;

  (async () => {
    try {
      const user = await User.findById(userObj.id);
      if (user) {
        user.history.push({
          action,
          url,
          date: new Date(),
        });
        await user.save();
        console.log("History saved for:", userObj.id);
      }
    } catch (err) {
      console.error("History save failed:", err);
    }
  })();
}
