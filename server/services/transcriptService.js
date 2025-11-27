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
    return null;
  }
}

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
}

module.exports = { extractTranscript };
