---
name: ytclip-4-translate-en-to-zhtw
description: "Step 5 of ytclip pipeline: AI agent translates SRT subtitles from English to Traditional Chinese (Taiwan community style). Input: English SRT file. Output: Translated SRT file in zh-TW."
---

# ytclip-4-translate-en-to-zhtw

Translate SRT subtitle files from English to Traditional Chinese using Taiwan community language and slang. Translation is performed by Claude directly — no external translation APIs.

## References

- `references/zh-tw-localization.md`: Complete localization rules, slang mapping, and style guidelines for Taiwan Traditional Chinese.
- `references/zh-tw-fps-terms.md`: Read only when the content is clearly FPS, battle royale, or hero shooter related.
- `references/zh-tw-fighting-game-terms.md`: Read only when the content is clearly fighting game / FGC related.

## Input

- An SRT subtitle file in English

## Output

- A translated SRT file in Traditional Chinese (Taiwan community style)

## Workflow

### Step 1: Glossary Confirmation

Before translating, scan the entire input SRT for:
- Establishment names (bars, restaurants, venues)
- Recurring proper nouns not covered by the "keep in original language" rule (e.g., community nicknames, slang terms specific to the content)
- Terms where the transcript may be wrong (misheard words, auto-caption errors)

Present the list to the user and ask:
- Which terms should be kept in English as-is?
- Which terms need a specific translation?
- Any transcript errors to correct? (misheard words, wrong names from auto-captions)

Proceed only after the user confirms the glossary. If the user says to skip, proceed without it.

### Step 2: Pre-flight — normalize, then pick strategy by file size

**Normalize line endings + BOM first.** SRT files from many tools use UTF-8 BOM and CRLF line endings, which break `grep`/`awk` regex anchors and can contaminate appended output. Always create a normalized working copy:

```bash
sed $'1s/^\xEF\xBB\xBF//' <input.srt> | tr -d '\r' > <input>.lf.srt
```

Use `<input>.lf.srt` as the working input for all subsequent steps (counting, line mapping, agent reads). The original is left untouched. Delete the `.lf.srt` file after the final output is saved.

Count blocks in the normalized file:

```bash
grep -c '^[0-9]\+$' <input>.lf.srt
```

- **≤ 400 blocks** → single-pass (Step 2a)
- **> 400 blocks** → chunked sub-agent pipeline (Step 2b)

The 32000-token per-response output cap means a single `Write` call cannot hold more than ~400 translated blocks. Exceeding this is the single biggest failure mode of this skill — do not try to "just write it all at once" for long files.

### Step 2a: Single-pass translation (≤ 400 blocks)

Read the input SRT file and translate following all rules in `references/zh-tw-localization.md`.

If the content is clearly genre-specific, load extra references before translating:
- FPS / battle royale / hero shooter content: also read `references/zh-tw-fps-terms.md`
- Fighting game / FGC / frame-data / matchup content: also read `references/zh-tw-fighting-game-terms.md`

Do not load those genre-specific references for unrelated content.

Translate the entire file in one thinking pass, apply block splitting inline (Step 3 rules), and write the complete output in one `Write` call.

Do not re-read the input file if it is already in context. Do not web-search for Taiwan terms you already know; ask the user directly if unsure.

### Step 2b: Chunked sub-agent pipeline (> 400 blocks)

Long files are translated by delegating 250-block chunks to sub-agents. Each agent has its own 32000-token output budget, so the main conversation stays small and no "continue" prompts are needed.

**Main Claude's job:**

1. Map block numbers to line ranges (on the normalized `.lf.srt` file):
   ```bash
   grep -n '^[0-9]\+$' <input>.lf.srt | awk -F: '{print $2, $1}'
   ```
   This gives `block_number line_number` pairs. Use them to compute `Read` offset/limit for each chunk.

2. Decide chunk boundaries (default 250 blocks each; final chunk may be shorter).

3. Invoke `Agent` (subagent_type: `general-purpose`) **sequentially**, not in parallel — they write to the same output file. Use the prompt template below.

4. After all chunks complete, run a verification pass:
   ```bash
   grep -c '^[0-9]\+$' <output-zhtw.srt>
   ```
   Block count should equal the sum of agent-reported output blocks (which will differ from input block count due to inline splitting in Step 3).

**Agent prompt template:**

```
Translate SRT blocks {START}–{END} of /path/input.srt from English to Traditional Chinese (Taiwan community style).

Steps:
1. Read /path/input.srt with offset={LINE_START}, limit={LINE_COUNT}.
2. Read /path/to/ytclip-4-translate-en-to-zhtw/references/zh-tw-localization.md for rules.
3. {IF GENRE: also read references/zh-tw-fps-terms.md OR zh-tw-fighting-game-terms.md}
4. Apply this confirmed glossary: {GLOSSARY}
5. Translate every block. Apply inline block splitting: if a translated block exceeds ~15 chars, split at natural phrase boundaries and distribute the time range evenly across sub-blocks.
6. Number output blocks starting at {OUTPUT_START_NUM}.
7. {IF FIRST CHUNK: Write the result to /path/output-zhtw.srt (create).}
   {IF LATER CHUNK: Append to /path/output-zhtw.srt using Bash heredoc:
     cat >> /path/output-zhtw.srt << 'SRT_EOF'
     ...translated blocks...
     SRT_EOF
   Make sure there is exactly one blank line between the existing file end and your first appended block.}
8. {IF LATER CHUNK: For cross-boundary phrasing continuity, the final 2 blocks of the prior chunk were:
   English: {PRIOR_EN_TAIL}
   Translated: {PRIOR_ZH_TAIL}
   Make sure your opening blocks flow naturally from these.}

Report back: (a) count of output blocks written, (b) the last 2 English blocks you translated and their zh-TW translations (for handoff to the next agent), (c) the final output block number you used.
```

After each agent returns, capture its reported tail (English + zh-TW) and the final output block number, and feed them into the next agent's prompt.

Do not web-search for Taiwan terms; rely on the glossary + references.

Key rules:
- Taiwan Traditional Chinese, not mainland Chinese
- Colloquial internet/community language, preserve speaker tone
- Use subtitle punctuation naturally inside the line; do not misread subtitle style as "no punctuation at all"
- Do not mechanically add sentence-final `，` or `。` to every subtitle line
- Prefer light punctuation: internal `，` for natural clause turns, `？` for real questions, `⋯` for trailing off, `～` only for stretched reactions/interjections
- Default to no sentence-final `。`; only use it for a deliberate hard beat when it clearly improves rhythm
- Do not add speaker markers (>> or labels)
- Remove pure English filler words (Uh, Um, Like-as-filler) instead of translating them
- Translate short transition words that carry structural meaning in storytelling (and → 然後, so → 所以, but → 但是, you know → 你知道嗎, apparently → 看起來). Do not blank these into `⋯`
- Use `⋯` for pauses and trailing off
- Keep people names in original language
- Apply the confirmed glossary from Step 1
- Slang mappings (see reference for full list):
  - "fucking" → 他喵的 / 喵的
  - "oh shit" and similar → 靠 / 喔靠
  - "Oh" → 喔
  - "Oh my god" → 喔天啊 / 我的天啊 / 天啊 / 天哪
  - "spoiler" / "no spoilers" → 爆雷 / 不爆雷

### Step 3: Block Splitting (applied inline during Step 2)

Block splitting is done during translation, not as a separate pass. Each translated block should contain **one short natural phrase** (~8 characters target, max ~15).

Rules:
- Split at natural Chinese phrase boundaries (after particles, clause breaks, commas).
- Distribute the original block's time range across sub-blocks evenly. Only adjust where needed to ensure `end > start` and no overlaps.
- Renumber all blocks sequentially in the final output.
- Do not split blocks that are already short enough.

**Timestamp validation**: every block must have `end > start`. If any input block has an invalid timestamp (end ≤ start), fix it by setting end = start + (character_count × 80ms, minimum 800ms), capped at the next block's start time. Use standard SRT timestamp format: `HH:MM:SS,mmm` where milliseconds are always exactly 3 digits (000–999).

### Step 4: Save

Save the output as `<original-name>-zhtw.srt` next to the input file, or to a user-specified path.
