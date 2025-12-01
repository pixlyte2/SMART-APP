const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const transcribe = async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: "URL required" });
        }

        // Normalize short URL
        const finalUrl = url.replace("youtube.com/shorts/", "youtube.com/watch?v=");
        console.log("Normalized URL:", finalUrl);

        // Create audio folder
        const audioDir = path.join(__dirname, "../temp_audio");
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir, { recursive: true });
        }

        const audioFile = path.join(audioDir, `audio_${Date.now()}.mp3`);

        // Step 1: Download audio using yt-dlp
        const downloadCmd = `yt-dlp -x --audio-format mp3 -o "${audioFile}" "${finalUrl}"`;

        exec(downloadCmd, (err) => {
            if (err) {
                console.error("Download error:", err);
                return res.status(500).json({ error: "Audio download failed" });
            }

            console.log("Audio downloaded:", audioFile);

            // Step 2: Run whisper-cli.exe (CORRECT FILE)
            const whisperExe = `"C:\\Users\\Pooja\\Downloads\\whisper\\Release\\whisper-cli.exe"`;

            // Your model path inside server folder
            const modelFile = path.join(__dirname, "../whisper/ggml-medium.bin");

            const outputTxtFile = audioFile.replace(".mp3", ".txt");

            const whisperCmd = `${whisperExe} -m "${modelFile}" -f "${audioFile}" -otxt -l ta`;

            exec(whisperCmd, (err2) => {
                if (err2) {
                    console.error("Whisper error:", err2);
                    return res.status(500).json({ error: "Whisper transcription failed" });
                }

                // Step 3: Read generated text file
                const text = fs.readFileSync(outputTxtFile, "utf8");
                return res.json({ text });
            });
        });

    } catch (error) {
        console.error("Transcription Error:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { transcribe };
