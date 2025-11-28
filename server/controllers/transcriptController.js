// controllers/transcriptController.js
const { extractTranscript } = require("../services/transcriptService");
const User = require("../models/users");

// URL validator
function isValidHttpUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const transcribe = async (req, res) => {
  const { url } = req.body;

  if (!url) return res.status(400).json({ error: "URL missing" });
  if (!isValidHttpUrl(url)) return res.status(400).json({ error: "Invalid URL" });

  console.log("POST /api/transcribe", url);

  try {
    const transcript = await extractTranscript(url);

    console.log("Transcript length:", transcript.length);

    // Save history (non-blocking)
    if (req.user?.id) {
      (async () => {
        try {
          const user = await User.findById(req.user.id);
          if (user) {
            user.history.push({
              action: "/api/transcribe",
              url,
              date: new Date(),
            });
            await user.save();
            console.log("History saved for:", req.user.id);
          }
        } catch (err) {
          console.error("History save failed:", err);
        }
      })();
    }

    return res.json({ transcript });
  } catch (err) {
    console.error("Transcription error:", err.message);

    return res.status(500).json({
      error: "Transcription failed. Check server logs.",
      details: err.message,
    });
  }
};

module.exports = { transcribe };
