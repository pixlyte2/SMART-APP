<<<<<<< HEAD
// services/transcriptService.js (debug version - keeps temp files for inspection)
const { getTranscript } = require('youtube-transcript');
const ytdlp = require('yt-dlp-exec');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

const WHISPER_MODEL = process.env.WHISPER_MODEL || 'small';

// 1) Try official YouTube transcript
async function getOfficialTranscript(url) {
  try {
    const transcript = await getTranscript(url);
    return transcript.map(t => t.text).join('\n');
  } catch (err) {
=======
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
>>>>>>> eaa5d0f62fa268db233e64c8083561a2a409471d
    return null;
  }
}

<<<<<<< HEAD
// 2) Whisper fallback (debug mode: keeps tmp folder so you can inspect files)
async function getWhisperTranscript(url) {
  const tmpDir = path.join(os.tmpdir(), `yt_trans_debug_${uuidv4()}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  const audioPath = path.join(tmpDir, 'audio.mp3');

  console.log('getWhisperTranscript: tmpDir =', tmpDir);

  try {
    console.log('Downloading audio into:', audioPath);
    await ytdlp(url, {
      extractAudio: true,
      audioFormat: 'mp3',
      output: audioPath,
      quiet: true
    });
    console.log('Download finished. audio file exists:', fs.existsSync(audioPath));

    // Use python -m whisper (omit --language auto). Output as txt.
    const cmd = `python -m whisper "${audioPath}" --model ${WHISPER_MODEL} --output_format txt --output_dir "${tmpDir}"`;
    console.log('Running whisper CLI:', cmd);
    execSync(cmd, { stdio: 'inherit' });

    // After whisper runs, list files in tmpDir
    const allFiles = fs.readdirSync(tmpDir);
    console.log('Files in tmpDir after whisper:', allFiles);

    // Find any .txt, .srt or .json
    const txtFiles = allFiles.filter(f => f.endsWith('.txt') || f.endsWith('.srt') || f.endsWith('.json') || f.endsWith('.vtt'));
    console.log('Transcript candidate files:', txtFiles);

    if (txtFiles.length === 0) {
      throw new Error(`Whisper did not produce a text file in ${tmpDir}. Files: ${allFiles.join(', ')}`);
    }

    // Prefer audio.txt if exists, else first candidate
    let chosen = txtFiles.find(f => f === 'audio.txt') || txtFiles[0];
    const transcript = fs.readFileSync(path.join(tmpDir, chosen), 'utf8');

    console.log('Read transcript file:', chosen, 'length=', transcript.length);

    // Return transcript (tmpDir kept for inspection)
    return transcript;
  } catch (err) {
    console.error('getWhisperTranscript error:', err);
    throw new Error(`Whisper fallback failed: ${err.message || err}`);
  }
}

// Main function
async function extractTranscript(url) {
  // 1) try official captions
  const official = await getOfficialTranscript(url);
  if (official) return official;

  // 2) whisper fallback
  const asr = await getWhisperTranscript(url);
  if (asr) return asr;

  throw new Error('Unable to extract transcript');
=======
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
>>>>>>> eaa5d0f62fa268db233e64c8083561a2a409471d
}

module.exports = { extractTranscript };
