#!/usr/bin/env bun
import { readFileSync, writeFileSync } from "fs";
import { basename, dirname, extname, join, resolve } from "path";
import { formatSrt, parseSrt } from "./srt_utils";
import type { ClipEntry, ClipManifest, SrtCue } from "./types";

interface Options {
  srtPath: string;
  manifestPath: string;
  outputPath: string;
  gapMs: number;
}

function printHelp() {
  console.log(`Usage: bun remap_srt.ts <srt-file> <manifest-file> [options]

Options:
  -o, --output <path>  Output SRT path (default: <input>-remapped.srt)
  --gap <ms>           Merge adjacent identical-text cues if gap <= ms (default: 50)
  -h, --help           Show help`);
}

function defaultOutputPath(srtPath: string): string {
  const dir = dirname(srtPath);
  const ext = extname(srtPath);
  const file = basename(srtPath, ext || undefined);
  return resolve(join(dir, `${file}-remapped${ext || ".srt"}`));
}

function parseArgs(argv: string[]): Options | null {
  if (argv.length === 0) {
    printHelp();
    return null;
  }

  const positional: string[] = [];
  let outputPath = "";
  let gapMs = 50;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      printHelp();
      return null;
    }

    if (arg === "-o" || arg === "--output") {
      outputPath = argv[++i] || "";
      if (!outputPath) throw new Error("Missing value for --output");
      continue;
    }

    if (arg === "--gap") {
      gapMs = Number(argv[++i]);
      if (!Number.isFinite(gapMs) || gapMs < 0) {
        throw new Error("--gap must be a non-negative number");
      }
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    positional.push(arg);
  }

  if (positional.length < 2) {
    throw new Error("Missing required arguments: <srt-file> <manifest-file>");
  }

  const srtPath = resolve(positional[0]);
  const manifestPath = resolve(positional[1]);

  return {
    srtPath,
    manifestPath,
    outputPath: outputPath ? resolve(outputPath) : defaultOutputPath(srtPath),
    gapMs,
  };
}

function toFiniteNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function normalizeClip(raw: any): ClipEntry | null {
  const sourceIn = toFiniteNumber(raw?.sourceIn);
  const sourceOut = toFiniteNumber(raw?.sourceOut);
  const sequenceIn = toFiniteNumber(raw?.sequenceIn);
  let sequenceOut = toFiniteNumber(raw?.sequenceOut);

  if (!Number.isFinite(sourceIn) || !Number.isFinite(sourceOut) || !Number.isFinite(sequenceIn)) {
    return null;
  }
  if (sourceOut <= sourceIn) {
    return null;
  }

  if (!Number.isFinite(sequenceOut) || sequenceOut <= sequenceIn) {
    sequenceOut = sequenceIn + (sourceOut - sourceIn);
  }

  return { sourceIn, sourceOut, sequenceIn, sequenceOut };
}

function loadManifest(path: string): ClipManifest {
  const raw = JSON.parse(readFileSync(path, "utf-8"));
  const clipsRaw = Array.isArray(raw?.clips) ? raw.clips : [];
  const clips = clipsRaw
    .map((clip) => normalizeClip(clip))
    .filter((clip): clip is ClipEntry => clip !== null)
    .sort((a, b) => a.sequenceIn - b.sequenceIn || a.sourceIn - b.sourceIn);

  if (!clips.length) {
    throw new Error("clip_manifest.json has no valid clips");
  }

  return {
    sequenceName: typeof raw?.sequenceName === "string" ? raw.sequenceName : "Unknown Sequence",
    frameRate: Number.isFinite(Number(raw?.frameRate)) ? Number(raw.frameRate) : 0,
    clips,
  };
}

function intersectCueWithClip(cue: SrtCue, clip: ClipEntry): SrtCue | null {
  const overlapStart = Math.max(cue.startSec, clip.sourceIn);
  const overlapEnd = Math.min(cue.endSec, clip.sourceOut);
  if (overlapEnd <= overlapStart) {
    return null;
  }

  const remappedStart = clip.sequenceIn + (overlapStart - clip.sourceIn);
  const remappedEnd = clip.sequenceIn + (overlapEnd - clip.sourceIn);
  if (remappedEnd <= remappedStart) {
    return null;
  }

  return {
    index: cue.index,
    startSec: remappedStart,
    endSec: remappedEnd,
    text: cue.text,
  };
}

function remapCues(cues: SrtCue[], clips: ClipEntry[]): SrtCue[] {
  const pieces: SrtCue[] = [];

  for (const cue of cues) {
    for (const clip of clips) {
      const piece = intersectCueWithClip(cue, clip);
      if (piece) {
        pieces.push(piece);
      }
    }
  }

  return pieces.sort((a, b) => a.startSec - b.startSec || a.endSec - b.endSec);
}

function mergeAdjacentIdentical(cues: SrtCue[], gapMs: number): SrtCue[] {
  if (!cues.length) return [];
  const gapSec = gapMs / 1000;

  const merged: SrtCue[] = [];
  for (const cue of cues) {
    const text = cue.text.trim();
    if (!text) continue;

    const normalizedCue: SrtCue = {
      index: cue.index,
      startSec: cue.startSec,
      endSec: cue.endSec,
      text,
    };

    const last = merged[merged.length - 1];
    if (!last) {
      merged.push(normalizedCue);
      continue;
    }

    const gap = normalizedCue.startSec - last.endSec;
    if (last.text === normalizedCue.text && gap <= gapSec) {
      last.endSec = Math.max(last.endSec, normalizedCue.endSec);
      continue;
    }

    merged.push(normalizedCue);
  }

  return merged;
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("-h") || argv.includes("--help")) {
    printHelp();
    return;
  }

  const opts = parseArgs(argv);
  if (!opts) {
    process.exit(1);
  }

  const cues = parseSrt(readFileSync(opts.srtPath, "utf-8"));
  if (!cues.length) {
    throw new Error("No subtitle cues parsed from input SRT");
  }

  const manifest = loadManifest(opts.manifestPath);
  const remapped = remapCues(cues, manifest.clips);
  const deduped = mergeAdjacentIdentical(remapped, opts.gapMs).map((cue, idx) => ({
    ...cue,
    index: idx + 1,
  }));
  const output = formatSrt(deduped);

  writeFileSync(opts.outputPath, output);
  console.log(opts.outputPath);
  console.log(
    JSON.stringify(
      {
        sequence: manifest.sequenceName,
        inputCues: cues.length,
        remappedCues: remapped.length,
        outputCues: deduped.length,
      },
      null,
      2
    )
  );
}

main();
