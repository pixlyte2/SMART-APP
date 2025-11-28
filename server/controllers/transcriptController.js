// controllers/transcriptController.js
<<<<<<< HEAD
const { extractTranscript } = require('../services/transcriptService');
// IMPORTANT: require the exact filename of your model file (case-sensitive)
const User = require('../models/users'); // <-- make sure this file exists as models/User.js

// URL validator that accepts normal URLs and YouTube short links
=======
const { extractTranscript } = require("../services/transcriptService");
const User = require("../models/users");

// URL validator
>>>>>>> eaa5d0f62fa268db233e64c8083561a2a409471d
function isValidHttpUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
<<<<<<< HEAD
  } catch (err) {
=======
  } catch {
>>>>>>> eaa5d0f62fa268db233e64c8083561a2a409471d
    return false;
  }
}

const transcribe = async (req, res) => {
  const { url } = req.body;

<<<<<<< HEAD
  if (!url) {
    return res.status(400).json({ error: 'URL missing' });
  }

  if (!isValidHttpUrl(url)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  console.log('POST /api/transcribe called. url=', url, 'userId=', req.user?.id || 'anonymous');

  try {
    // Call service (may run Whisper CLI which is slow)
    const transcript = await extractTranscript(url);

    // Debug logs: length and preview
    const length = transcript ? transcript.length : 0;
    console.log(`Transcription finished. length=${length}`);
    if (length > 0) {
      console.log('Transcription preview:', transcript.slice(0, 400).replace(/\n/g, ' '));
    } else {
      console.log('Transcription is empty string or null.');
    }

    // Save user history (do not break response on save error)
    if (req.user && req.user.id) {
=======
  if (!url) return res.status(400).json({ error: "URL missing" });
  if (!isValidHttpUrl(url)) return res.status(400).json({ error: "Invalid URL" });

  console.log("POST /api/transcribe", url);

  try {
    const transcript = await extractTranscript(url);

    console.log("Transcript length:", transcript.length);

    // Save history (non-blocking)
    if (req.user?.id) {
>>>>>>> eaa5d0f62fa268db233e64c8083561a2a409471d
      (async () => {
        try {
          const user = await User.findById(req.user.id);
          if (user) {
            user.history.push({
<<<<<<< HEAD
              action: '/api/transcribe',
              url,
              date: new Date()
            });
            await user.save();
            console.log('Saved history for user:', req.user.id);
          } else {
            console.warn('User not found for history save:', req.user.id);
          }
        } catch (saveErr) {
          console.error('History save error (ignored):', saveErr);
=======
              action: "/api/transcribe",
              url,
              date: new Date(),
            });
            await user.save();
            console.log("History saved for:", req.user.id);
          }
        } catch (err) {
          console.error("History save failed:", err);
>>>>>>> eaa5d0f62fa268db233e64c8083561a2a409471d
        }
      })();
    }

<<<<<<< HEAD
    // Return transcript (even if empty)
    return res.json({ transcript: transcript || '' });
  } catch (err) {
    // Helpful logs for debugging
    console.error('Transcription Error (controller):', err);

    // Specific helpful responses (without leaking internals)
    const msg = String(err.message || err).toLowerCase();
    if (msg.includes('whisper')) {
      return res.status(500).json({ error: 'Transcription failed (whisper fallback). Check server logs.' });
    }
    if (msg.includes('unable to extract') || msg.includes('did not produce')) {
      return res.status(500).json({ error: 'Unable to extract transcript (no captions and ASR failed).' });
    }

    return res.status(500).json({ error: 'Something went wrong during transcription' });
=======
    return res.json({ transcript });
  } catch (err) {
    console.error("Transcription error:", err.message);

    return res.status(500).json({
      error: "Transcription failed. Check server logs.",
      details: err.message,
    });
>>>>>>> eaa5d0f62fa268db233e64c8083561a2a409471d
  }
};

module.exports = { transcribe };
