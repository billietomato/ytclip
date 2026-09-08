# /// script
# requires-python = ">=3.11,<3.12"
# dependencies = ["mlx-whisper==0.4.3"]
# ///
"""Local MLX transcription, optional pause-based chunks, and auditable SRT output."""
import argparse
import json
import math
import platform
import re
import shutil
import subprocess
import tempfile
from pathlib import Path


def run(*args):
    return subprocess.run(args, check=True, capture_output=True, text=True)


def chunk_ranges(duration, maximum, pauses):
    start = 0.0
    while start < duration:
        end = min(duration, start + maximum) if maximum else duration
        if end < duration:
            candidates = [p for p in pauses if start + maximum * 2 / 3 <= p <= end]
            if candidates:
                end = candidates[-1]
        yield start, end
        start = end


def timestamp(ms):
    seconds, millis = divmod(ms, 1000)
    minutes, seconds = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    return f"{hours:02}:{minutes:02}:{seconds:02},{millis:03}"


def prepare_cues(chunks, duration):
    cues, warnings = [], []
    for chunk in chunks:
        offset, limit = chunk["start"], chunk["end"]
        for segment in chunk["segments"]:
            text = " ".join(segment.get("text", "").split())
            start = float(segment["start"]) + offset
            end = float(segment["end"]) + offset
            if not text or not math.isfinite(start) or not math.isfinite(end):
                warnings.append({"at": offset, "reason": "invalid or empty segment"})
                continue
            bounded_start = max(offset, min(start, limit, duration))
            bounded_end = max(offset, min(end, limit, duration))
            if (start, end) != (bounded_start, bounded_end):
                warnings.append({"at": start, "reason": "timestamp clipped to chunk bounds"})
            a, b = round(bounded_start * 1000), round(bounded_end * 1000)
            if b <= a:
                warnings.append({"at": start, "reason": "discarded nonpositive duration", "text": text})
                continue
            cues.append((a, b, text))
    cues.sort(key=lambda cue: (cue[0], cue[1]))
    covered_until = 0
    for i, (start, end, text) in enumerate(cues):
        if start < covered_until:
            warnings.append({"at": start / 1000, "reason": "overlapping cues"})
        if start - covered_until >= 10000:
            warnings.append({"at": covered_until / 1000, "end": start / 1000,
                             "reason": "uncovered interval: silence or missed speech"})
        if i >= 2 and text.casefold() == cues[i-1][2].casefold() == cues[i-2][2].casefold():
            warnings.append({"at": start / 1000, "reason": "three or more repeated cues", "text": text})
        covered_until = max(covered_until, end)
    if duration * 1000 - covered_until >= 10000:
        warnings.append({"at": covered_until / 1000, "end": duration,
                         "reason": "uncovered interval: silence or missed speech"})
    return cues, warnings


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("audio", type=Path)
    parser.add_argument("-o", "--output", type=Path, required=True)
    parser.add_argument("--model", default="mlx-community/whisper-large-v3-turbo")
    parser.add_argument("--language", help="Source language; default: detect once")
    parser.add_argument("--initial-prompt", help="Known names/terminology")
    parser.add_argument("--chunk-seconds", type=float, default=0,
                        help="0: whole file; otherwise maximum chunk size, at least 10 seconds")
    args = parser.parse_args()
    if not math.isfinite(args.chunk_seconds) or (args.chunk_seconds != 0 and args.chunk_seconds < 10):
        parser.error("--chunk-seconds must be 0 or at least 10")
    source, output = args.audio.resolve(), args.output.resolve()
    report_path = output.with_suffix(".report.json")
    if not source.is_file():
        parser.error(f"Input not found: {source}")
    if output.suffix.lower() != ".srt":
        parser.error("Output must have an .srt extension")
    if output.exists() or report_path.exists():
        parser.error("Output or report already exists; choose a fresh output name")
    if platform.system() != "Darwin" or platform.machine() != "arm64":
        parser.error("This backend requires Apple Silicon macOS")
    if not all(shutil.which(tool) for tool in ("ffmpeg", "ffprobe")):
        parser.error("Install FFmpeg (including ffprobe) first")

    import mlx_whisper

    # Decode once to PCM: chunk offsets then refer to sample time, not MP3 seek estimates.
    with tempfile.TemporaryDirectory(prefix="ytclip-asr-") as directory:
        wav = Path(directory) / "audio.wav"
        run("ffmpeg", "-v", "error", "-nostdin", "-i", str(source), "-map", "0:a:0",
            "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", str(wav))
        duration = float(run("ffprobe", "-v", "error", "-show_entries", "format=duration",
                             "-of", "default=noprint_wrappers=1:nokey=1", str(wav)).stdout)
        if not math.isfinite(duration) or duration <= 0:
            parser.error("Audio duration must be positive and finite")
        pauses = []
        if args.chunk_seconds:
            detection = run("ffmpeg", "-hide_banner", "-nostdin", "-i", str(wav),
                            "-af", "silencedetect=noise=-35dB:d=0.35", "-f", "null", "-")
            silence_start = None
            for kind, value in re.findall(r"silence_(start|end): ([\d.]+)", detection.stderr):
                if kind == "start":
                    silence_start = float(value)
                elif silence_start is not None:
                    pauses.append((silence_start + float(value)) / 2)
                    silence_start = None
        chunks = []
        language = args.language
        ranges = list(chunk_ranges(duration, args.chunk_seconds, pauses))
        for index, (start, end) in enumerate(ranges):
            print(f"Transcribing {index + 1}/{len(ranges)}: {start:.2f}–{end:.2f}s", flush=True)
            audio_path = wav
            if len(ranges) > 1:
                audio_path = Path(directory) / f"chunk-{index}.wav"
                run("ffmpeg", "-v", "error", "-nostdin", "-i", str(wav), "-ss", str(start),
                    "-t", str(end - start), "-c:a", "pcm_s16le", str(audio_path))
            result = mlx_whisper.transcribe(
                str(audio_path), path_or_hf_repo=args.model, language=language,
                task="transcribe", condition_on_previous_text=False,
                word_timestamps=True, hallucination_silence_threshold=2.0,
                initial_prompt=args.initial_prompt, verbose=False,
            )
            language = language or result.get("language")
            chunks.append({"start": start, "end": end, "language": result.get("language"),
                           "segments": result["segments"]})
    cues, warnings = prepare_cues(chunks, duration)
    report = {"input": str(source), "duration": duration, "model": args.model,
              "language": language, "chunk_seconds": args.chunk_seconds,
              "initial_prompt": args.initial_prompt, "condition_on_previous_text": False,
              "word_timestamps": True, "hallucination_silence_threshold": 2.0,
              "cue_count": len(cues), "warnings": warnings, "chunks": chunks}
    output.parent.mkdir(parents=True, exist_ok=True)
    # Exclusive creation protects existing results even if another run finishes meanwhile.
    with report_path.open("x", encoding="utf-8") as handle:
        json.dump(report, handle, ensure_ascii=False, indent=2)
    with output.open("x", encoding="utf-8") as handle:
        for index, (start, end, text) in enumerate(cues, 1):
            handle.write(f"{index}\n{timestamp(start)} --> {timestamp(end)}\n{text}\n\n")
    print(f"Saved {len(cues)} cues: {output}\nReview warnings: {len(warnings)}\nReport: {report_path}")
    if not cues:
        raise SystemExit("No usable subtitles recognized; inspect the report and audio.")


if __name__ == "__main__":
    main()
