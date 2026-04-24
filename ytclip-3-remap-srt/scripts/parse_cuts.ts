#!/usr/bin/env bun
import { readFileSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import type { ClipEntry, ClipManifest } from "./types";

interface Options {
  xmlPath: string;
  track: number;
  outputPath: string;
}

function printHelp() {
  console.log(`Usage: bun parse_cuts.ts <xml-file> [options]

Options:
  --track <index>      Video track index (default: 0)
  -o, --output <path>  Output JSON path (default: clip_manifest.json next to XML)
  -h, --help           Show help`);
}

function parseArgs(argv: string[]): Options | null {
  if (argv.length === 0) {
    printHelp();
    return null;
  }

  let xmlPath = "";
  let outputPath = "";
  let track = 0;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      printHelp();
      return null;
    }
    if (arg === "--track") {
      track = Number(argv[++i]);
      if (!Number.isInteger(track) || track < 0) {
        throw new Error("--track must be a non-negative integer");
      }
      continue;
    }
    if (arg === "-o" || arg === "--output") {
      outputPath = argv[++i] || "";
      if (!outputPath) throw new Error("Missing value for --output");
      continue;
    }
    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }
    if (!xmlPath) {
      xmlPath = arg;
      continue;
    }
    throw new Error(`Unexpected argument: ${arg}`);
  }

  if (!xmlPath) {
    throw new Error("Missing required argument: <xml-file>");
  }

  const xmlPathAbs = resolve(xmlPath);
  const outputAbs = outputPath
    ? resolve(outputPath)
    : resolve(join(dirname(xmlPathAbs), "clip_manifest.json"));

  return {
    xmlPath: xmlPathAbs,
    track,
    outputPath: outputAbs,
  };
}

function extractTag(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}(?:\\s+[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  return m ? m[1].trim() : null;
}

function extractAllBlocks(block: string, tag: string): string[] {
  const re = new RegExp(`<${tag}(?:\\s+[^>]*)?>[\\s\\S]*?<\\/${tag}>`, "gi");
  return block.match(re) || [];
}

function parseFrameValue(block: string, tag: "start" | "end" | "in" | "out"): number {
  const raw = extractTag(block, tag);
  if (raw == null) return NaN;
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}

function resolveFrameRate(sequenceBlock: string): number {
  const rateBlock = extractTag(sequenceBlock, "rate") || "";
  const timebase = Number(extractTag(rateBlock, "timebase"));
  const ntsc = (extractTag(rateBlock, "ntsc") || "FALSE").toUpperCase() === "TRUE";

  if (!Number.isFinite(timebase) || timebase <= 0) {
    throw new Error("Could not parse <timebase> from sequence rate block");
  }

  if (!ntsc) return timebase;

  if (timebase === 24) return 24_000 / 1001;
  if (timebase === 30) return 30_000 / 1001;
  if (timebase === 60) return 60_000 / 1001;
  return timebase;
}

function parseSequence(xml: string, trackIndex: number): ClipManifest {
  const sequenceBlocks = extractAllBlocks(xml, "sequence");
  if (!sequenceBlocks.length) {
    throw new Error("No <sequence> block found in XML");
  }

  for (const sequenceBlock of sequenceBlocks) {
    // Strip <file> blocks to avoid nested <media>/<video> tags confusing extraction.
    // Self-closing <file .../> tags must be removed first; otherwise the non-greedy
    // full-block regex treats them as an opening tag and swallows subsequent clipitems.
    const cleaned = sequenceBlock
      .replace(/<file\b[^>]*\/>/gi, "")
      .replace(/<file\b[^>]*>[\s\S]*?<\/file>/gi, "");
    const mediaBlock = extractTag(cleaned, "media") || "";
    const videoBlock = extractTag(mediaBlock, "video") || "";
    if (!videoBlock) continue;

    const tracks = extractAllBlocks(videoBlock, "track");
    if (!tracks.length || trackIndex >= tracks.length) continue;

    const selectedTrack = tracks[trackIndex];
    const clipItems = extractAllBlocks(selectedTrack, "clipitem");
    if (!clipItems.length) continue;

    const frameRate = resolveFrameRate(sequenceBlock);
    const fpsDiv = frameRate;

    // Parse transitions so we can resolve -1 clip boundaries (cross dissolve overlaps)
    const transitionItems = extractAllBlocks(selectedTrack, "transitionitem");
    const transitions = transitionItems
      .flatMap(item => {
        const start = parseFrameValue(item, "start");
        const end = parseFrameValue(item, "end");
        if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < 0) return [];
        return [{ start, end, mid: Math.floor((start + end) / 2) }];
      })
      .sort((a, b) => a.start - b.start);

    const clips: ClipEntry[] = [];
    for (const clipItem of clipItems) {
      let sequenceInFrame = parseFrameValue(clipItem, "start");
      let sequenceOutFrame = parseFrameValue(clipItem, "end");
      const sourceInFrame = parseFrameValue(clipItem, "in");
      const sourceOutFrame = parseFrameValue(clipItem, "out");

      if (
        !Number.isFinite(sourceInFrame) ||
        !Number.isFinite(sourceOutFrame) ||
        sourceInFrame < 0 ||
        sourceOutFrame < 0
      ) {
        continue;
      }

      // Resolve -1 sequence boundaries caused by dissolve/transition overlaps.
      // end=-1 means this clip extends into a transition; use the transition midpoint.
      if (sequenceOutFrame === -1 && Number.isFinite(sequenceInFrame) && sequenceInFrame >= 0) {
        const t = transitions.find(tr => tr.start >= sequenceInFrame);
        if (t) sequenceOutFrame = t.mid;
      }
      // start=-1 means this clip starts from within a transition; use the transition midpoint.
      if (sequenceInFrame === -1 && Number.isFinite(sequenceOutFrame) && sequenceOutFrame >= 0) {
        const t = [...transitions].reverse().find(tr => tr.end <= sequenceOutFrame);
        if (t) sequenceInFrame = t.mid;
      }

      if (
        !Number.isFinite(sequenceInFrame) ||
        !Number.isFinite(sequenceOutFrame) ||
        sequenceInFrame < 0 ||
        sequenceOutFrame < 0
      ) {
        continue;
      }

      const sequenceIn = sequenceInFrame / fpsDiv;
      const sequenceOut = sequenceOutFrame / fpsDiv;
      const sourceIn = sourceInFrame / fpsDiv;
      const sourceOut = sourceOutFrame / fpsDiv;

      if (sequenceOut <= sequenceIn || sourceOut <= sourceIn) {
        continue;
      }

      clips.push({ sourceIn, sourceOut, sequenceIn, sequenceOut });
    }

    if (!clips.length) continue;

    const sequenceHeader = sequenceBlock.split(/<media(?:\s+[^>]*)?>/i)[0] || sequenceBlock;
    const sequenceName = extractTag(sequenceHeader, "name") || "Sequence";
    clips.sort((a, b) => a.sequenceIn - b.sequenceIn || a.sourceIn - b.sourceIn);

    return { sequenceName, frameRate, clips };
  }

  throw new Error(`No clips parsed from video track ${trackIndex}. Check the selected track or XML export content.`);
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("-h") || argv.includes("--help")) {
    printHelp();
    return;
  }

  const opts = parseArgs(argv);
  if (!opts) process.exit(1);

  const xml = readFileSync(opts.xmlPath, "utf-8");
  const manifest = parseSequence(xml, opts.track);
  writeFileSync(opts.outputPath, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(opts.outputPath);
  console.log(
    JSON.stringify(
      {
        sequence: manifest.sequenceName,
        frameRate: manifest.frameRate,
        clips: manifest.clips.length,
        track: opts.track,
      },
      null,
      2
    )
  );
}

main();
