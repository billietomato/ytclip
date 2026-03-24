#!/usr/bin/env bun
/**
 * Convert Traditional Chinese SRT subtitles to Simplified Chinese.
 * Pure character conversion using opencc-js — no AI, no rephrasing.
 *
 * Usage:
 *   bun ytclip-6-convert-tc-to-sc/scripts/convert.ts <input.srt> -o <output.srt>
 */

import * as OpenCC from "opencc-js";
import { parseArgs } from "util";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname, basename, extname } from "path";

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    output: { type: "string", short: "o" },
  },
  allowPositionals: true,
  strict: true,
});

const inputPath = positionals[0];
if (!inputPath) {
  console.error("Usage: bun convert.ts <input.srt> [-o <output.srt>]");
  process.exit(1);
}

const resolvedInput = resolve(inputPath);
const content = readFileSync(resolvedInput, "utf-8");

const converter = OpenCC.Converter({ from: "tw", to: "cn" });

// SRT structure: blocks separated by blank lines.
// Each block: sequence number, timestamp line, one or more text lines.
const lines = content.split(/\r?\n/);
const converted: string[] = [];
const timestampRe = /^\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.]\d{3}/;

let i = 0;
while (i < lines.length) {
  const line = lines[i];

  // Blank line — pass through
  if (line.trim() === "") {
    converted.push(line);
    i++;
    continue;
  }

  // Sequence number (digits only, possibly followed by whitespace)
  if (/^\d+\s*$/.test(line) && i + 1 < lines.length && timestampRe.test(lines[i + 1])) {
    converted.push(line); // sequence number
    i++;
    converted.push(lines[i]); // timestamp line
    i++;
    // Convert subtitle text lines until blank line or next block
    while (i < lines.length && lines[i].trim() !== "" && !(/^\d+\s*$/.test(lines[i]) && i + 1 < lines.length && timestampRe.test(lines[i + 1]))) {
      converted.push(converter(lines[i]));
      i++;
    }
    continue;
  }

  // Fallback: convert any other line
  converted.push(converter(line));
  i++;
}

const outputPath = values.output
  ? resolve(values.output)
  : resolve(
      dirname(resolvedInput),
      basename(resolvedInput, extname(resolvedInput)) + "-zhcn" + extname(resolvedInput)
    );

writeFileSync(outputPath, converted.join("\n"), "utf-8");
console.log(`Converted: ${resolvedInput}`);
console.log(`Output:    ${outputPath}`);
