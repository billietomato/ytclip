---
name: ytclip-4-translate-zhhk
description: "Step 4 of ytclip pipeline: AI agent translates SRT subtitles from any language to Hong Kong Cantonese (Traditional Chinese). Input: SRT file. Output: Translated SRT file in zh-HK."
---

# ytclip-4-translate-zhhk

Translate SRT subtitle files from any language to Hong Kong Cantonese using Traditional Chinese characters and Cantonese phrasing. Translation is performed by Claude directly — no external translation APIs.

## References

- `references/zhhk-localization.md`: Complete localization rules, slang mapping, and style guidelines for Hong Kong Cantonese.

## Input

- An SRT subtitle file in any language

## Output

- A translated SRT file in Hong Kong Cantonese (Traditional Chinese)

## Workflow

Read the input SRT file and translate it following all rules in `references/zhhk-localization.md`.

Key rules:
- Traditional Chinese characters with Cantonese phrasing, not Mandarin phrasing
- Colloquial Hong Kong community language, preserve speaker tone
- All SRT block numbering and timestamps unchanged — translate only subtitle text
- Do not add comma (，) or full-stop (。) at the end of each subtitle line
- Keep people names in original language
- Game names and terms must use official HK/TW Traditional Chinese names or terms commonly used in HK gaming community
- Use Cantonese particles naturally: 啦, 囉, 嘅, 咩, 㗎, 喎, 噃, 嘛
- Specific slang mappings (see reference for full list):
  - "fucking" → 屌 / 仆街
  - "oh shit" and similar → 哎吔 / 死火
  - "Oh" → 哦
  - "Oh my god" → 我嘅天 / 天啊

Save the output as `<original-name>-zhhk.srt` next to the input file, or to a user-specified path.
