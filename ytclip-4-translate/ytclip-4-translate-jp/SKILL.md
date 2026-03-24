---
name: ytclip-4-translate-jp
description: "Step 4 of ytclip pipeline: AI agent translates SRT subtitles from any language to natural Japanese. Input: SRT file. Output: Translated SRT file in Japanese."
---

# ytclip-4-translate-jp

Translate SRT subtitle files from any language to natural Japanese using community language and appropriate casualness. Translation is performed by Claude directly — no external translation APIs.

## References

- `references/jp-localization.md`: Complete localization rules, slang mapping, and style guidelines for Japanese translation.

## Input

- An SRT subtitle file in any language

## Output

- A translated SRT file in natural Japanese

## Workflow

Read the input SRT file and translate it following all rules in `references/jp-localization.md`.

Key rules:
- Natural Japanese, not overly formal or stiff
- Match casualness level of source — use だ/である for narration, casual forms for conversation
- All SRT block numbering and timestamps unchanged — translate only subtitle text
- Do not add comma (、) or period (。) at the end of each subtitle line
- Keep people names in original language (or katakana if commonly known that way)
- Game names and terms must use official Japanese names or terms commonly used in JP gaming community
- Specific slang mappings (see reference for full list):
  - "fucking" → くそ / マジで
  - "oh shit" and similar → やべえ / うわ
  - "Oh" → おっ / おお
  - "Oh my god" → マジか / うそだろ

Save the output as `<original-name>-jp.srt` next to the input file, or to a user-specified path.
