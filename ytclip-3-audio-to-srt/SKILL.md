---
name: ytclip-3-audio-to-srt
description: "Skill 3 of ytclip (README Step 4): transcribe local audio or an edited video into source-language SRT subtitles using MLX Whisper on Apple Silicon. Use for local MP3/WAV/MP4 transcription, with optional pause-based chunks and restored timestamps."
---

# Local audio to SRT

Generate subtitles directly from the edited timeline's audio. This replaces the retired XML/SRT remapping workflow. The full-stream transcript from ytclip-1 is still useful for finding highlights; this skill generates fresh subtitles after editing.

## Input and runtime

- Accept local audio or video readable by FFmpeg. For subtitles matching an edit, use the entire edited sequence starting at time zero, retaining leading silence and gaps. Do not use the original VOD unless that is what the user wants transcribed.
- Inspect file existence, audio duration, hardware, and available dependencies. The bundled backend requires Apple Silicon macOS. On other platforms, explain the limitation and select an appropriate local backend with the user instead of installing MLX.
- Use `uv`, Python 3.11, FFmpeg, and `mlx-whisper`. Install missing dependencies as needed within the task's permissions. The first run downloads model weights; inference stays local. Do not upload media.
- Resolve `{baseDir}` to this skill's directory. Run the bundled script with its inline dependency declaration:

```bash
uv run --script "{baseDir}/scripts/transcribe.py" \
  "/path/to/edited-audio.mp3" \
  --language en -o "/path/to/edited-en.srt"
```

FFmpeg and ffprobe must be on PATH (`brew install ffmpeg` on macOS). `uv` must already be installed or installed using the user's normal package-management setup.

## Transcription choices

- Default model: `mlx-community/whisper-large-v3-turbo`, a practical starting point for Apple Silicon, including an M1 with 16 GB RAM. Runtime alone is not evidence of poor recognition or inadequate hardware.
- Use the known spoken language (`--language en`, `ja`, etc.); omit it when unknown. The script detects once and reuses the detected language across chunks. Mixed-language recordings still require review.
- Keep source-language transcription. Translate the checked SRT separately with ytclip-4 when requested; that skill handles English to Traditional Chinese.
- Defaults disable previous-text conditioning and enable word timestamps and hallucination-silence handling. These reduce observed repetition loops; they do not guarantee accuracy or complete speech coverage.
- Start with the whole file: Whisper already works in approximately 30-second windows. For a file with repeated text, drifting timestamps, or difficult sections, try `--chunk-seconds 30` with a distinct output path. This seeks low-volume pauses in the last third of each chunk, falls back to a hard boundary, and restores each chunk's original offset. It retains all audio, including silence. This is amplitude-based silence detection, not a speech classifier; music may prevent useful pause detection.
- Use `--initial-prompt "Names and terms: ..."` only for known names or terminology, not invented dialogue. If a reviewed sample remains poor, compare a verified MLX full large-v3 model using `--model` on a small sample before reprocessing the entire file.

## Outputs and review

The script writes the exact requested `.srt` path and a `.report.json` sidecar with model settings, chunk offsets, raw segments, and review warnings. It refuses existing outputs; use a fresh filename for retries. Do not rely on the upstream CLI's `--output-name` for preserving dotted filenames: the trial run stripped the dotted suffix and replaced the earlier SRT.

1. Check the report: subtitle count, rejected/clipped timestamps, overlaps, repetitions, and uncovered intervals. Gaps can be legitimate silence or missed speech; do not fill them with guesses.
2. Listen to representative opening, middle, ending, and flagged portions when audio playback is available. Check names, overlapping voices, music, and chunk boundaries. If you cannot listen, state that only structural checks were performed.
3. Do not treat valid SRT syntax as proof of transcription accuracy. Do not silently delete repeated spoken words merely because they repeat; the report flags repetition for review.
4. Retry once with a targeted change when checks show a problem, preserving prior results. If still unreliable, report the affected times and propose a sample comparison or manual correction instead of looping through full-file runs.
5. Return links to the SRT and report, relevant settings, and remaining quality limitations. Do not start translation unless requested.
