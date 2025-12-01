const fs = require("fs");
const ytdl = require("ytdl-core");
const path = require("path");

exports.downloadAudio = async (url) => {
  try {
    let id = Date.now();
    let filePath = path.join(__dirname, `../temp_audio/audio_${id}.mp3`);

    return new Promise((resolve, reject) => {
      ytdl(url, {
        filter: "audioonly",
        quality: "highestaudio"
      })
        .pipe(fs.createWriteStream(filePath))
        .on("finish", () => resolve(filePath))
        .on("error", reject);
    });
  } catch (err) {
    throw new Error("Audio download failed");
  }
};
