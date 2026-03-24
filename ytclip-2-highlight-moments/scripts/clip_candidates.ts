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
  text: string;
  subtitles: Array<{
    index: number;
    start: string;
    end: string;
    startSec: number;
    endSec: number;
    text: string;
  }>;
}

interface ChunkedTranscript {
  source: string;
  totalSubtitles: number;
  totalDurationSec: number;
  totalDuration: string;
  chunkSizeSec: number;
  overlapSec: number;
  chunkCount: number;
  focusKeywords: string[];
  chunks: TranscriptChunk[];
}

interface Options {
  inputPath: string;
  chunkSize: number;
  overlap: number;
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

function chunkTranscript(
  subs: Subtitle[],
  chunkSizeSec: number,
  overlapSec: number
): TranscriptChunk[] {
  if (!subs.length) return [];

  const chunks: TranscriptChunk[] = [];
  const totalEnd = subs[subs.length - 1].endSec;
  const stepSec = chunkSizeSec - overlapSec;
  let chunkIndex = 0;
  let windowStart = subs[0].startSec;

  while (windowStart < totalEnd) {
    const windowEnd = windowStart + chunkSizeSec;

    // Find subtitles that fall within this window.
    // A subtitle is included if it overlaps the window at all.
    const chunkSubs = subs.filter(
      (s) => s.endSec > windowStart && s.startSec < windowEnd
    );

    if (chunkSubs.length > 0) {
      const text = chunkSubs.map((s) => s.text).join(" ");
      const actualStart = chunkSubs[0].startSec;
      const actualEnd = chunkSubs[chunkSubs.length - 1].endSec;

      chunks.push({
        chunkIndex,
        start: formatTs(actualStart),
        end: formatTs(actualEnd),
        startSec: Number(actualStart.toFixed(3)),
        endSec: Number(actualEnd.toFixed(3)),
        durationSec: Number((actualEnd - actualStart).toFixed(3)),
        subtitleCount: chunkSubs.length,
        wordCount: countWords(text),
        text,
        subtitles: chunkSubs.map((s) => ({
          index: s.index,
          start: s.start,
          end: s.end,
          startSec: s.startSec,
          endSec: s.endSec,
          text: s.text,
        })),
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

Options:
  --chunk-size <sec>   Chunk duration in seconds (default: 300 = 5 min)
  --overlap <sec>      Overlap between chunks in seconds (default: 30)
  --focus <csv>        Optional keywords for AI to prioritize (e.g. "announcement, new outfit")
  -o, --output <path>  Save output to file (default: stdout)
  -h, --help           Show help`);
}

function parseArgs(argv: string[]): Options | null {
  if (argv.length === 0) {
    printHelp();
    return null;
  }

  const opts: Options = {
    inputPath: "",
    chunkSize: 300,
    overlap: 30,
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
      opts.overlap = Number(argv[++i] || "30");
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

  const chunks = chunkTranscript(subs, opts.chunkSize, opts.overlap);
  const totalDurationSec = subs[subs.length - 1].endSec - subs[0].startSec;

  const output: ChunkedTranscript = {
    source: inputPath,
    totalSubtitles: subs.length,
    totalDurationSec: Number(totalDurationSec.toFixed(3)),
    totalDuration: formatTs(totalDurationSec),
    chunkSizeSec: opts.chunkSize,
    overlapSec: opts.overlap,
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
