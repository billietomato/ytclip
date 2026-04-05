---
name: ytclip-2-highlight-moments
description: "Step 2 of ytclip pipeline: AI agent scores stream transcript chunks for entertainment value and produces a content map for YouTube compilation editing. Input: SRT file. Output: Markdown content map with KEEP/TRIM/CUT verdicts."
---

# ytclip-2-highlight-moments

Score every chunk of a stream transcript for entertainment value. Output a content map that tells a human editor what to keep, trim, and cut for a YouTube compilation.

## Runtime

Resolve `BUN_X` in this order:
1. `bun`
2. `npx -y bun`
3. If neither exists, ask user to install Bun.

Use `{baseDir}` as this skill directory.

## Script

- `scripts/clip_candidates.ts`: Parse SRT transcript and chunk it into ~5-minute segments with inline `[HH:MM:SS]` timestamp markers and computed metrics (speech density, silence ratio, estimated turns). Outputs compact JSON — no per-subtitle data, keeping token usage low.

## References

- `references/highlight-evaluation-rubric.md`: Entertainment scoring guide (0-5 scale), signal definitions, metric interpretation, and output format for the content map.

## Input

- An SRT transcript file (output of ytclip-1-transcript)

## Output

- A Markdown content map with:
  - **Timeline table** — one row per chunk: score, verdict (KEEP/TRIM/CUT), short description
  - **Edit guide** — grouped entries with specific timestamp ranges, internal notes, and micro-moments

## Workflow

### 1. Preprocess transcript into chunks

```bash
${BUN_X} {baseDir}/scripts/clip_candidates.ts <transcript.srt> -o chunks.json
```

Optional keyword steering (tiebreaker for close calls, not an override):
```bash
${BUN_X} {baseDir}/scripts/clip_candidates.ts <transcript.srt> --focus 'announcement,new outfit' -o chunks.json
```

For very long streams (>6 hours), increase chunk size to reduce chunk count and stay within token budget:
```bash
${BUN_X} {baseDir}/scripts/clip_candidates.ts <transcript.srt> --chunk-size 420 -o chunks.json
```

### 2. AI Evaluation: Score and map content

Read the `chunks.json` output file. Following the rubric in `references/highlight-evaluation-rubric.md`, evaluate the entire transcript in a **single pass**:

For each chunk, in order from first to last:
1. Read the text and metrics
2. Assess entertainment value using the signal categories in the rubric
3. Assign a score (0-5) and verdict (KEEP / TRIM / CUT)
4. Write a short description (under 12 words)

After scoring all chunks, produce the **edit guide**:
- Group consecutive chunks with the same verdict
- For KEEP groups: note specific timestamp ranges, internal energy dips, and peak moments
- For TRIM groups: identify micro-moments (brief highlights worth extracting)
- For CUT groups: one-line summary with the time range

Output the complete content map as a single Markdown file.

## Token Efficiency

This skill is designed for single-pass evaluation. The preprocessor strips per-subtitle data and uses inline timestamp markers instead, reducing JSON size by ~60% compared to including full subtitle arrays. To keep output concise:

- Timeline table descriptions: under 12 words each
- CUT entries in the edit guide: one line, no sub-segment detail
- Do NOT reproduce chunk text in the output — summarize what happens

## Accuracy Rules

- **Never fabricate timestamps.** Only use `[HH:MM:SS]` markers that appear in the chunk text.
- When specifying sub-ranges in the edit guide, snap to the nearest inline marker.
- Every timestamp in the output must be verifiable against the chunks.json data.
