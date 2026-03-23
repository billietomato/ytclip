---
name: ytclip-2-highlight-moments
description: "Step 2 of ytclip pipeline: AI agent identifies and ranks viral clip moments from an SRT transcript. Input: SRT file. Output: Markdown file of ranked clippable moments with timestamp slices."
---

# ytclip-2-highlight-moments

Score and rank viral clip moments from stream/video transcripts using AI evaluation. Outputs a Markdown file of ordered candidates from highest to lowest score.

## Runtime

Resolve `BUN_X` in this order:
1. `bun`
2. `npx -y bun`
3. If neither exists, ask user to install Bun.

Use `{baseDir}` as this skill directory.

## Script

- `scripts/clip_candidates.ts`: Parse SRT transcript and chunk it into ~5-minute evaluation segments with timestamps and text. Outputs structured JSON for AI evaluation.

## References

- `references/highlight-evaluation-rubric.md`: 8-dimension scoring rubric, two-pass evaluation instructions, and output format for Claude to identify and rank viral moments.

## Input

- An SRT transcript file (output of ytclip-1-transcript)

## Output

- A Markdown file of ordered clippable moments ranked from high to low score
- Each moment maps to one or more related timestamp slice(s)
- ALL timestamps are absolutely accurate to the source SRT

## Workflow

### 1. Preprocess transcript into chunks

```bash
${BUN_X} {baseDir}/scripts/clip_candidates.ts <transcript.srt> -o chunks.json
```

Optional keyword steering:
```bash
${BUN_X} {baseDir}/scripts/clip_candidates.ts <transcript.srt> --focus 'announcement,new outfit' -o chunks.json
```

Custom chunk size (default 300s with 30s overlap):
```bash
${BUN_X} {baseDir}/scripts/clip_candidates.ts <transcript.srt> --chunk-size 300 --overlap 30 -o chunks.json
```

### 2. AI Evaluation: Scan for hot zones

Read the `chunks.json` output file. Following the rubric in `references/highlight-evaluation-rubric.md`, perform **Pass 1**:

For each chunk, briefly assess whether it contains clip-worthy content. Produce a list of candidate moments with approximate timestamps, signal types, and confidence levels.

Skip quickly over schedule announcements, donation reading, and generic housekeeping.

### 3. AI Evaluation: Deep score hot zones

For each hot zone identified in Pass 1, perform **Pass 2** from the rubric:

- Re-read the relevant chunk text carefully
- Score against all 8 dimensions (funny, story, engagement, community, collab, gaming, clipability, penalties)
- Determine precise clip boundaries (20-75 seconds), snapping to subtitle timestamps
- Write hooks and "why it might spread" rationale
- Group related moments that share the same topic across chunks

### 4. Output ranked moments as Markdown

Output the final ranked results as a Markdown file following the format specified in the rubric. Each moment includes title, score breakdown, timestamp slices, and rationale — ordered from highest to lowest composite score.

## Accuracy Rules

- **Never fabricate timestamps.** Only use timestamps that exist in the source SRT / chunks.json subtitle data.
- Snap clip boundaries to actual subtitle `start` and `end` times.
- Every timestamp in the output must be verifiable against the source SRT file.
