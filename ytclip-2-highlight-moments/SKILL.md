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
  - **Top clips & shorts** — 2–5 clip picks (target 2–4 min each) and 2–5 short picks (target 30s–1m30s each), with verified timestamp ranges and rationale. See "Clip & Short Recommendations" in the rubric. If the user specifies a different count (e.g. "top 3 clips and top 2 shorts"), follow their numbers; otherwise default to 3 of each.

## Workflow

### 1. Preprocess transcript into chunks

```bash
${BUN_X} {baseDir}/scripts/clip_candidates.ts <transcript.srt> -o chunks.json
```

Optional keyword steering (tiebreaker for close calls, not an override):
```bash
${BUN_X} {baseDir}/scripts/clip_candidates.ts <transcript.srt> --focus 'announcement,new outfit' -o chunks.json
```

For long streams, increase chunk size to reduce chunk count and stay within token budget:
```bash
# 3–6 hour streams: 5-min chunks usually fine (default)
# 4+ hour talkative collabs (≥50 chunks, ≥150KB): bump to 7-min chunks
# 6+ hour streams: 7-min or larger
${BUN_X} {baseDir}/scripts/clip_candidates.ts <transcript.srt> --chunk-size 420 -o chunks.json
```

**Token note:** A 4+ hour high-density stream can produce a 150KB+ chunks.json that may exceed a single Read window. If you hit truncation, either:
- Re-run the preprocessor with a larger `--chunk-size` (recommended), or
- Read the JSON in successive offset/limit pages and evaluate progressively, holding running tallies in your head/scratchpad

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
- For TRIM groups: identify micro-moments (brief highlights worth extracting). Tag any micro-moment that could stand alone as a Short with a ⭐ marker — this makes the optional clip pass cheaper later.
- For CUT groups: one-line summary with the time range

Output the complete content map as a single Markdown file.

### 3. Top Clip & Short Recommendations (required)

Always produce a Top Clips & Shorts section at the end of the content map. Default to **3 clips and 3 shorts**; honor user-specified counts when given (e.g. "top 2 clips and top 4 shorts" → produce exactly that). The minimum is 2 of each, the maximum is 5 of each — if you can't find 2 genuinely strong shorts, say so honestly rather than padding.

This is a **different selection task** from compilation editing — see "Clip & Short Recommendations" in the rubric for criteria. Re-scan your KEEP groups *and* your ⭐-tagged TRIM micro-moments — peaks often hide as single bright spots inside otherwise routine chunks.

## Token Efficiency

This skill is designed for single-pass evaluation. The preprocessor strips per-subtitle data and uses inline timestamp markers instead, reducing JSON size by ~60% compared to including full subtitle arrays. To keep output concise:

- Timeline table descriptions: under 12 words each
- CUT entries in the edit guide: one line, no sub-segment detail
- Do NOT reproduce chunk text in the output — summarize what happens

## Accuracy Rules

- **Never fabricate timestamps.** Only use `[HH:MM:SS]` markers that appear in the chunk text.
- When specifying sub-ranges in the edit guide, snap to the nearest inline marker.
- Every timestamp in the output must be verifiable against the chunks.json data.
