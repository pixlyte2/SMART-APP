const { execFile } = require("child_process");
const path = require("path");

exports.runWhisper = (audioPath) => {
  return new Promise((resolve, reject) => {
    const whisperExe = "C:\\path\\to\\whisper.exe";   // <-- change path
    const modelPath = "C:\\path\\to\\models\\ggml-base.bin";

    execFile(
      whisperExe,
      ["-m", modelPath, "-f", audioPath, "-otxt"],
      { shell: false },
      (err, stdout, stderr) => {
        if (err) return reject(err);

        const outputFile = audioPath + ".txt";
        resolve(outputFile);
      }
    );
  });
};
