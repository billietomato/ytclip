---
name: ytclip-4-translate-zhtw
description: "Step 4 of ytclip pipeline: AI agent translates SRT subtitles from any language to Traditional Chinese (Taiwan community style). Input: SRT file. Output: Translated SRT file in zh-TW."
---

# ytclip-4-translate-zhtw

Translate SRT subtitle files from any language to Traditional Chinese using Taiwan community language and slang. Translation is performed by Claude directly — no external translation APIs.

## References

- `references/zh-tw-localization.md`: Complete localization rules, slang mapping, and style guidelines for Taiwan Traditional Chinese.

## Input

- An SRT subtitle file in any language

## Output

- A translated SRT file in Traditional Chinese (Taiwan community style)

## Workflow

Read the input SRT file and translate it following all rules in `references/zh-tw-localization.md`.

Key rules:
- Taiwan Traditional Chinese, not mainland Chinese
- Colloquial internet/community language, preserve speaker tone
- All SRT block numbering and timestamps unchanged — translate only subtitle text
- Do not add comma (，) or full-stop (。) at the end of each subtitle line
- Keep people names in original language
- Game names, game terms, and character names must use official terms or words commonly used in Taiwan local community
- Specific slang mappings (see reference for full list):
  - "fucking" → 他喵的 / 喵的
  - "oh shit" and similar → 靠 / 喔靠
  - "Oh" → 喔
  - "Oh my god" → 喔天啊

Save the output as `<original-name>-zhtw.srt` next to the input file, or to a user-specified path.
