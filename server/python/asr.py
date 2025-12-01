import sys
from faster_whisper import WhisperModel

audio = sys.argv[1]

model = WhisperModel("small", device="cpu", compute_type="int8")

segments, info = model.transcribe(audio, beam_size=5)

text = ""
for seg in segments:
    text += seg.text + " "

print(text.strip())
