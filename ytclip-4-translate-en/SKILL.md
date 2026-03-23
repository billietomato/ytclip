---
name: ytclip-4-translate-en
description: "Step 4 of ytclip pipeline: AI agent translates SRT subtitles from any language to natural English. Input: SRT file. Output: Translated SRT file in English."
---

# ytclip-4-translate-en

Translate SRT subtitle files from any language to natural, conversational English. Translation is performed by Claude directly — no external translation APIs.

## References

- `references/en-localization.md`: Complete localization rules and style guidelines for natural English translation.

## Input

- An SRT subtitle file in any language

## Output

- A translated SRT file in natural English

## Workflow

Read the input SRT file and translate it following all rules in `references/en-localization.md`.

Key rules:
- Natural conversational English, not robotic or overly literal
- All SRT block numbering and timestamps unchanged — translate only subtitle text
- Do not add comma (,) or period (.) at the end of each subtitle line
- Keep people names in their most commonly known form
- Keep proper nouns accurate
- Game names must use official English names
- Specific slang and tone should feel natural to native English speakers

Save the output as `<original-name>-en.srt` next to the input file, or to a user-specified path.
