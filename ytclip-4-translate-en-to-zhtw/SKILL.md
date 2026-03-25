---
name: ytclip-4-translate-en-to-zhtw
description: "Step 5 of ytclip pipeline: AI agent translates SRT subtitles from English to Traditional Chinese (Taiwan community style). Input: English SRT file. Output: Translated SRT file in zh-TW."
---

# ytclip-4-translate-en-to-zhtw

Translate SRT subtitle files from English to Traditional Chinese using Taiwan community language and slang. Translation is performed by Claude directly — no external translation APIs.

## References

- `references/zh-tw-localization.md`: Complete localization rules, slang mapping, and style guidelines for Taiwan Traditional Chinese.

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

### Step 2: Chunked Translation

Read the input SRT file and translate following all rules in `references/zh-tw-localization.md`.

**Translate in chunks of 5–10 blocks at a time**, not block-by-block. This provides enough context to:
- Produce natural Chinese phrasing across block boundaries
- Remove filler words cleanly
- Avoid awkward phrase splits between blocks

Key rules:
- Taiwan Traditional Chinese, not mainland Chinese
- Colloquial internet/community language, preserve speaker tone
- Do not add comma (，) or full-stop (。) at the end of each subtitle line
- Do not add speaker markers (>> or labels)
- Remove English filler words (Uh, Um, Like, You know) instead of translating them
- Use `⋯` for pauses and trailing off
- Keep people names in original language
- Apply the confirmed glossary from Step 1
- Slang mappings (see reference for full list):
  - "fucking" → 他喵的 / 喵的
  - "oh shit" and similar → 靠 / 喔靠
  - "Oh" → 喔
  - "Oh my god" → 喔天啊 / 我的天啊 / 天啊 / 天哪

### Step 3: Block Splitting

After translation, split long blocks so each block contains **one short natural phrase** (~8 characters target, max ~15).

For each block that is too long:
1. Split at natural Chinese phrase boundaries (after particles, clause breaks, commas).
2. Distribute the original block's time range across the new sub-blocks proportionally by character count.
3. Renumber all blocks sequentially.

Do not split blocks that are already short enough.

### Step 4: Save

Save the output as `<original-name>-zhtw.srt` next to the input file, or to a user-specified path.
