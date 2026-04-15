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

### Step 2: Translation

Read the input SRT file and translate following all rules in `references/zh-tw-localization.md`.

If the content is clearly genre-specific, load extra references before translating:
- FPS / battle royale / hero shooter content: also read `references/zh-tw-fps-terms.md`
- Fighting game / FGC / frame-data / matchup content: also read `references/zh-tw-fighting-game-terms.md`

Do not load those genre-specific references for unrelated content.

**Translate the entire file in a single thinking pass, then write the complete output in one Write call.** Do not translate a few blocks, write them, then translate more — that creates dozens of slow round-trips. For very large files (500+ blocks), write in two halves at most.

When translating each block, consider surrounding blocks for natural cross-boundary phrasing, filler removal, and avoiding awkward splits — but do this as part of one continuous pass, not as separate "chunks."

**While translating, also apply block splitting inline** (Step 3 rules): if a translated block exceeds ~15 characters, split it at natural phrase boundaries and distribute the time range evenly. This avoids a separate re-scan pass after translation.

Do not re-read the input file if it is already in context. Do not web-search for Taiwan terms you already know; ask the user directly if unsure.

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
