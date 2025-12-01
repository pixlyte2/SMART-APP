const { exec } = require("child_process");
const path = require("path");

exports.runWhisper = (audioPath) => {
  return new Promise((resolve, reject) => {
    const pythonFile = path.join(__dirname, "../python/asr.py");

    exec(`python "${pythonFile}" "${audioPath}"`,
      { maxBuffer: 1024 * 1024 * 5 },
      (err, stdout, stderr) => {
        if (err) return reject("Whisper failed: " + err.message);

        resolve(stdout.trim());
      }
    );
  });
};
