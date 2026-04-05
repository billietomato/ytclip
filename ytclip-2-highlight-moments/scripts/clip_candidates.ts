#!/usr/bin/env bun
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

interface Subtitle {
  index: number;
  start: string;
  end: string;
  startSec: number;
  endSec: number;
  duration: number;
  text: string;
}

interface TranscriptChunk {
  chunkIndex: number;
  start: string;
  end: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  subtitleCount: number;
  wordCount: number;
  wordsPerMinute: number;
  speechDensity: number;
  silenceRatio: number;
  longestSilenceSec: number;
  estimatedTurns: number;
  text: string;
}

interface ChunkedTranscript {
  source: string;
  totalSubtitles: number;
  totalDurationSec: number;
  totalDuration: string;
  chunkSizeSec: number;
  overlapSec: number;
  markerIntervalSec: number;
  chunkCount: number;
  focusKeywords: string[];
  chunks: TranscriptChunk[];
}

interface Options {
  inputPath: string;
  chunkSize: number;
  overlap: number;
  markerInterval: number;
  output: string;
  focusKeywords: string[];
}

function parseTimestampToSec(ts: string): number {
  const normalized = ts.replace(",", ".");
  const parts = normalized.split(":");
  if (parts.length !== 3) return 0;
  const [hh, mm, ss] = parts;
  return Number(hh) * 3600 + Number(mm) * 60 + Number(ss);
}

function formatTs(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function parseSrt(content: string): Subtitle[] {
  const blocks = content
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n\s*\n/g)
    .filter(Boolean);

  const subtitles: Subtitle[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 3) continue;

    const idx = Number(lines[0]);
    const timeline = lines[1];
    const m = timeline.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
    if (!m) continue;

    const start = m[1];
    const end = m[2];
    const startSec = parseTimestampToSec(start);
    const endSec = parseTimestampToSec(end);
    const text = lines.slice(2).join(" ").replace(/\s+/g, " ").trim();
    if (!text) continue;

    subtitles.push({
      index: Number.isFinite(idx) ? idx : subtitles.length + 1,
      start,
      end,
      startSec,
      endSec,
      duration: Math.max(0, endSec - startSec),
      text,
    });
  }

  return subtitles;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Build text with inline [HH:MM:SS] timestamp markers.
 *
 * Markers are inserted:
 * - At the start of the chunk
 * - At every `intervalSec` boundary (snapped to the nearest subtitle start)
 * - At silence gaps > 2 seconds
 */
function buildMarkedText(
  subs: Subtitle[],
  intervalSec: number
): string {
  if (!subs.length) return "";

  const SILENCE_GAP_THRESHOLD = 2.0;
  const parts: string[] = [];
  let nextMarkerTime = subs[0].startSec; // first marker at chunk start

  for (let i = 0; i < subs.length; i++) {
    const sub = subs[i];
    const prevEnd = i > 0 ? subs[i - 1].endSec : sub.startSec;
    const gap = sub.startSec - prevEnd;

    // Insert marker if: we've passed the next interval boundary, or there's a silence gap
    const needsIntervalMarker = sub.startSec >= nextMarkerTime;
    const needsGapMarker = gap > SILENCE_GAP_THRESHOLD && i > 0;

    if (needsIntervalMarker || needsGapMarker) {
      parts.push(`[${formatTs(sub.startSec)}]`);
      // Advance the next marker time past the current position
      while (nextMarkerTime <= sub.startSec) {
        nextMarkerTime += intervalSec;
      }
    }

    parts.push(sub.text);
  }

  return parts.join(" ");
}

/**
 * Compute metrics for a set of subtitles within a chunk window.
 */
function computeMetrics(
  subs: Subtitle[],
  chunkDurationSec: number
): {
  speechDensity: number;
  silenceRatio: number;
  longestSilenceSec: number;
  estimatedTurns: number;
  wordsPerMinute: number;
} {
  if (!subs.length || chunkDurationSec <= 0) {
    return {
      speechDensity: 0,
      silenceRatio: 1,
      longestSilenceSec: chunkDurationSec,
      estimatedTurns: 0,
      wordsPerMinute: 0,
    };
  }

  // Speech density: total speech time / chunk duration
  const totalSpeechTime = subs.reduce((acc, s) => acc + s.duration, 0);
  const speechDensity = Math.min(1, totalSpeechTime / chunkDurationSec);

  // Longest silence gap between consecutive subtitles
  let longestSilence = 0;
  for (let i = 1; i < subs.length; i++) {
    const gap = subs[i].startSec - subs[i - 1].endSec;
    if (gap > longestSilence) longestSilence = gap;
  }

  // Estimated speaker turns: count gaps > 1.5s (rough proxy for speaker changes)
  const TURN_GAP_THRESHOLD = 1.5;
  let turns = 0;
  for (let i = 1; i < subs.length; i++) {
    const gap = subs[i].startSec - subs[i - 1].endSec;
    if (gap > TURN_GAP_THRESHOLD) turns++;
  }

  // Words per minute
  const totalWords = subs.reduce((acc, s) => acc + countWords(s.text), 0);
  const durationMin = chunkDurationSec / 60;
  const wordsPerMinute = durationMin > 0 ? totalWords / durationMin : 0;

  return {
    speechDensity: Number(speechDensity.toFixed(3)),
    silenceRatio: Number((1 - speechDensity).toFixed(3)),
    longestSilenceSec: Number(longestSilence.toFixed(1)),
    estimatedTurns: turns,
    wordsPerMinute: Number(wordsPerMinute.toFixed(1)),
  };
}

function chunkTranscript(
  subs: Subtitle[],
  chunkSizeSec: number,
  overlapSec: number,
  markerIntervalSec: number
): TranscriptChunk[] {
  if (!subs.length) return [];

  const chunks: TranscriptChunk[] = [];
  const totalEnd = subs[subs.length - 1].endSec;
  const stepSec = chunkSizeSec - overlapSec;
  let chunkIndex = 0;
  let windowStart = subs[0].startSec;

  while (windowStart < totalEnd) {
    const windowEnd = windowStart + chunkSizeSec;

    // Find subtitles that overlap this window
    const chunkSubs = subs.filter(
      (s) => s.endSec > windowStart && s.startSec < windowEnd
    );

    if (chunkSubs.length > 0) {
      const actualStart = chunkSubs[0].startSec;
      const actualEnd = chunkSubs[chunkSubs.length - 1].endSec;
      const durationSec = actualEnd - actualStart;

      const text = buildMarkedText(chunkSubs, markerIntervalSec);
      const wordCount = countWords(text.replace(/\[\d{2}:\d{2}:\d{2}\]/g, ""));
      const metrics = computeMetrics(chunkSubs, durationSec);

      chunks.push({
        chunkIndex,
        start: formatTs(actualStart),
        end: formatTs(actualEnd),
        startSec: Number(actualStart.toFixed(3)),
        endSec: Number(actualEnd.toFixed(3)),
        durationSec: Number(durationSec.toFixed(3)),
        subtitleCount: chunkSubs.length,
        wordCount,
        wordsPerMinute: metrics.wordsPerMinute,
        speechDensity: metrics.speechDensity,
        silenceRatio: metrics.silenceRatio,
        longestSilenceSec: metrics.longestSilenceSec,
        estimatedTurns: metrics.estimatedTurns,
        text,
      });

      chunkIndex++;
    }

    windowStart += stepSec;
  }

  return chunks;
}

function printHelp() {
  console.log(`Usage: bun clip_candidates.ts <srt-file> [options]

Preprocess an SRT transcript into timestamped chunks for AI evaluation.
Outputs compact JSON with inline timestamp markers and computed metrics.

Options:
  --chunk-size <sec>       Chunk duration in seconds (default: 300 = 5 min)
  --overlap <sec>          Overlap between chunks in seconds (default: 0)
  --marker-interval <sec>  Inline timestamp marker interval (default: 15)
  --focus <csv>            Optional keywords for AI to prioritize (e.g. "announcement, new outfit")
  -o, --output <path>      Save output to file (default: stdout)
  -h, --help               Show help`);
}

function parseArgs(argv: string[]): Options | null {
  if (argv.length === 0) {
    printHelp();
    return null;
  }

  const opts: Options = {
    inputPath: "",
    chunkSize: 300,
    overlap: 0,
    markerInterval: 15,
    output: "",
    focusKeywords: [],
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      printHelp();
      return null;
    }

    if (arg === "--chunk-size") {
      opts.chunkSize = Number(argv[++i] || "300");
    } else if (arg === "--overlap") {
      opts.overlap = Number(argv[++i] || "0");
    } else if (arg === "--marker-interval") {
      opts.markerInterval = Number(argv[++i] || "15");
    } else if (arg === "--focus") {
      opts.focusKeywords = (argv[++i] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (arg === "-o" || arg === "--output") {
      opts.output = argv[++i] || "";
    } else if (!arg.startsWith("-") && !opts.inputPath) {
      opts.inputPath = arg;
    }
  }

  if (!opts.inputPath) throw new Error("Missing input SRT file path");
  if (opts.chunkSize <= 0) throw new Error("--chunk-size must be positive");
  if (opts.overlap < 0) throw new Error("--overlap must be non-negative");
  if (opts.overlap >= opts.chunkSize) throw new Error("--overlap must be less than --chunk-size");
  if (opts.markerInterval <= 0) throw new Error("--marker-interval must be positive");

  return opts;
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("-h") || argv.includes("--help")) {
    printHelp();
    return;
  }

  const opts = parseArgs(argv);
  if (!opts) process.exit(1);

  const inputPath = resolve(opts.inputPath);
  const content = readFileSync(inputPath, "utf-8");
  const subs = parseSrt(content);
  if (!subs.length) throw new Error("No subtitle blocks parsed. Check input file format.");

  const chunks = chunkTranscript(subs, opts.chunkSize, opts.overlap, opts.markerInterval);
  const totalDurationSec = subs[subs.length - 1].endSec - subs[0].startSec;

  const output: ChunkedTranscript = {
    source: inputPath,
    totalSubtitles: subs.length,
    totalDurationSec: Number(totalDurationSec.toFixed(3)),
    totalDuration: formatTs(totalDurationSec),
    chunkSizeSec: opts.chunkSize,
    overlapSec: opts.overlap,
    markerIntervalSec: opts.markerInterval,
    chunkCount: chunks.length,
    focusKeywords: opts.focusKeywords,
    chunks,
  };

  const json = JSON.stringify(output, null, 2);

  if (opts.output) {
    const outputPath = resolve(opts.output);
    writeFileSync(outputPath, json);
    console.log(outputPath);
  } else {
    console.log(json);
  }
}

main();
