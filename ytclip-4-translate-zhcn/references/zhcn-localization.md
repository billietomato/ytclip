# zh-CN Localization Rules

Use these rules when translating a full SRT transcript into mainland Simplified Chinese.

## Objective

Translate/localize the FULL SRT script into natural Simplified Chinese used by mainland China communities.

## Hard Constraints

- Keep all SRT block numbering and timestamp lines exactly as-is.
- Translate only the subtitle text lines.
- Keep original meaning and factual claims; do not invent new facts.
- Keep speaker intent and tone.
- Do not summarize; output complete transcript.
- Do not add comma (，) or full-stop (。) at the end of each subtitle line.
- Keep people names in original language (do not transliterate).
- Game names, game terms, and character names must use official simplified Chinese names or terms commonly used in mainland gaming community.
- Keep proper nouns (product names, channels) accurate.
- Preserve code, URLs, and command lines unchanged.

## Slang & Exclamation Mapping

Use these mainland Chinese expressions for common English words:

| English | zh-CN |
|---------|-------|
| fucking / fuck (as intensifier) | 卧槽 / 我靠 |
| oh shit / shit (exclamation) | 我去 / 卧槽 |
| Oh | 噢 |
| Oh my god | 我的天 / 天哪 |
| damn | 我靠 / 该死 |
| what the hell | 搞什么 |
| no way | 不会吧 |
| seriously? | 认真的吗 |

These are guidelines — adapt naturally to context. Do not force-fit if the tone doesn't match.

## Style Guidelines (Mainland China)

- Use Simplified Chinese characters throughout.
- Use colloquial but readable internet/community language.
- Keep cadence conversational; avoid stiff textbook syntax.
- Use mainland internet slang naturally: 绝了, 离谱, 太牛了, 笑死, 整活.
- Use common mainland terms where natural:
  - 视频 for video
  - 屏幕 for screen
  - 软件 for software
  - 数据 for data
  - 网络 for network
  - 质量 for quality
  - 服务器 for server
  - 内存 for memory

## Gaming & Community Terms

- Always use the official simplified Chinese (简体中文) name for games.
- For game-specific terms (skills, items, locations, character names), use the official simplified Chinese localization terms or terms commonly used in mainland gaming community.
- If no official simplified Chinese translation exists, use the term the mainland community commonly uses.
- If unsure, keep the original English term rather than guessing a translation.

## Tone Adaptation

When the source tone is casual, use natural mainland Chinese net-speech naturally (e.g., 绝了, 离谱, 太牛了, 笑死, 整活, 太顶了, 直接起飞) but avoid overdoing slang in serious/technical segments.

## Output Format

- SRT format: keep block numbering and timestamp lines unchanged, translate only subtitle text.
- Save as `<original-filename>-zhcn.srt`.
