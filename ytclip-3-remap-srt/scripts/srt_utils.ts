import type { SrtCue } from "./types";

const TIMECODE_RE = /^(\d{2}):(\d{2}):(\d{2})[,.](\d{3})$/;
const TIMELINE_RE = /(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/;

export function parseTimestampToSec(ts: string): number {
  const m = ts.trim().match(TIMECODE_RE);
  if (!m) {
    throw new Error(`Invalid SRT timestamp: ${ts}`);
  }

  const hh = Number(m[1]);
  const mm = Number(m[2]);
  const ss = Number(m[3]);
  const ms = Number(m[4]);
  return hh * 3600 + mm * 60 + ss + ms / 1000;
}

export function formatSrtTimestamp(sec: number): string {
  const totalMs = Math.max(0, Math.round(sec * 1000));
  const hh = Math.floor(totalMs / 3_600_000);
  const mm = Math.floor((totalMs % 3_600_000) / 60_000);
  const ss = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;

  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

export function parseSrt(content: string): SrtCue[] {
  const blocks = content
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n\s*\n/g)
    .filter(Boolean);

  const cues: SrtCue[] = [];

  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((line) => line.trimEnd())
      .filter((line) => line.length > 0);

    if (lines.length < 2) {
      continue;
    }

    const hasExplicitIndex = /^\d+$/.test(lines[0].trim());
    const timelineLine = hasExplicitIndex ? lines[1] : lines[0];
    const textLines = hasExplicitIndex ? lines.slice(2) : lines.slice(1);
    const m = timelineLine.match(TIMELINE_RE);
    if (!m) {
      continue;
    }

    const startSec = parseTimestampToSec(m[1]);
    const endSec = parseTimestampToSec(m[2]);
    const text = textLines.join("\n").trim();
    if (!text) {
      continue;
    }

    cues.push({
      index: hasExplicitIndex ? Number(lines[0]) : cues.length + 1,
      startSec,
      endSec: Math.max(endSec, startSec),
      text,
    });
  }

  return cues;
}

export function formatSrt(cues: SrtCue[]): string {
  const blocks = cues.map((cue, idx) => {
    const startSec = Math.max(0, cue.startSec);
    const endSec = Math.max(startSec, cue.endSec);
    const text = cue.text.trim();
    return `${idx + 1}\n${formatSrtTimestamp(startSec)} --> ${formatSrtTimestamp(endSec)}\n${text}`;
  });

  return blocks.length ? `${blocks.join("\n\n")}\n` : "";
}
