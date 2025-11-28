// services/transcriptService.js
const { getTranscript } = require("youtube-transcript");
const ytdlp = require("yt-dlp-exec");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { v4: uuidv4 } = require("uuid");

// BEST SPEED + ACCURACY (tiny is too bad)
const WHISPER_MODEL = "base";

// -----------------------------
// Convert YouTube SHORTS → normal watch?v=
// -----------------------------
function normalizeYouTubeURL(url) {
  if (url.includes("youtube.com/shorts/")) {
    let videoId = url.split("shorts/")[1].split("?")[0];
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  return url;
}

// -----------------------------
// 1) Official YouTube transcript
// -----------------------------
async function getOfficialTranscript(url) {
  try {
    const transcript = await getTranscript(url);
    return transcript.map(t => t.text).join("\n");
  } catch {
    return null;
  }
}

// -----------------------------
// 2) Whisper fallback (FAST + ACCURATE)
// -----------------------------
async function getWhisperTranscript(url) {
  const tmpDir = path.join(os.tmpdir(), `yt_trans_${uuidv4()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const audioPath = path.join(tmpDir, "audio.mp3");

  console.log("\nWhisper running...");
  console.log("Temp directory:", tmpDir);

  try {
    // ---- Download audio ----
    console.log("Downloading audio...");
    await ytdlp(url, {
      extractAudio: true,
      audioFormat: "mp3",
      output: audioPath,
      quiet: true,
    });

    console.log("Download success:", fs.existsSync(audioPath));

    // ---- Whisper CLI ----
    const whisperCmd = `
      python -m whisper "${audioPath}"
      --model ${WHISPER_MODEL}
      --fp16 False
      --threads 6
      --output_format txt
      --output_dir "${tmpDir}"
    `.replace(/\s+/g, " ");

    console.log("Running Whisper:", whisperCmd);
    execSync(whisperCmd, { stdio: "inherit" });

    // ---- Find transcript output file ----
    const files = fs.readdirSync(tmpDir);
    const txtFile = files.find(f =>
      f.endsWith(".txt") || f.endsWith(".vtt") || f.endsWith(".srt")
    );

    if (!txtFile) throw new Error("Whisper did not produce transcript");

    const transcript = fs.readFileSync(path.join(tmpDir, txtFile), "utf8");
    return transcript;
  } catch (err) {
    console.error("Whisper error:", err);
    throw new Error("Whisper failed: " + err.message);
  }
}

// -----------------------------
// MAIN EXPORT FUNCTION
// -----------------------------
async function extractTranscript(url) {
  const cleanUrl = normalizeYouTubeURL(url);
  console.log("Normalized URL:", cleanUrl);

  // Try official captions
  const official = await getOfficialTranscript(cleanUrl);
  if (official) return official;

  // Whisper fallback
  const asr = await getWhisperTranscript(cleanUrl);
  if (asr) return asr;

  throw new Error("Unable to extract transcript");
}

module.exports = { extractTranscript };
