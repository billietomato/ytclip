---
name: ytclip-4-translate-zhcn
description: "Step 4 of ytclip pipeline: AI agent translates SRT subtitles from any language to Simplified Chinese (mainland China style). Input: SRT file. Output: Translated SRT file in zh-CN."
---

# ytclip-4-translate-zhcn

Translate SRT subtitle files from any language to Simplified Chinese using mainland China community language and slang. Translation is performed by Claude directly — no external translation APIs.

## References

- `references/zhcn-localization.md`: Complete localization rules, slang mapping, and style guidelines for mainland Simplified Chinese.

## Input

- An SRT subtitle file in any language

## Output

- A translated SRT file in Simplified Chinese (mainland China style)

## Workflow

Read the input SRT file and translate it following all rules in `references/zhcn-localization.md`.

Key rules:
- Mainland Simplified Chinese, not Traditional Chinese
- Colloquial internet/community language, preserve speaker tone
- All SRT block numbering and timestamps unchanged — translate only subtitle text
- Do not add comma (，) or full-stop (。) at the end of each subtitle line
- Keep people names in original language
- Game names and terms must use official simplified Chinese names or terms commonly used in mainland gaming community
- Specific slang mappings (see reference for full list):
  - "fucking" → 卧槽 / 我靠
  - "oh shit" and similar → 我去 / 卧槽
  - "Oh" → 噢
  - "Oh my god" → 我的天 / 天哪

Save the output as `<original-name>-zhcn.srt` next to the input file, or to a user-specified path.
