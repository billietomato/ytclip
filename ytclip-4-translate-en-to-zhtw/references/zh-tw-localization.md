# zh-TW Localization Rules

Use these rules when translating a full SRT transcript into Taiwanese Traditional Chinese.

## Objective

Translate/localize the FULL SRT script into natural Traditional Chinese used by Taiwan communities.

## Hard Constraints

- Keep all SRT block numbering and timestamp lines exactly as-is.
- Translate only the subtitle text lines.
- Keep original meaning and factual claims; do not invent new facts.
- Keep speaker intent and tone.
- Do not summarize; output complete transcript.
- Do not add comma (，) or full-stop (。) at the end of each subtitle line.
- Keep people names in original language (do not transliterate).
- Game names, game terms, and character names must use official terms or words commonly used in Taiwan local community.
- Keep proper nouns (product names, channels) accurate.
- Preserve code, URLs, and command lines unchanged.

## Slang & Exclamation Mapping

Use these Taiwan-style expressions for common English words:

| English | zh-TW |
|---------|-------|
| fucking / fuck (as intensifier) | 他喵的 / 喵的 |
| oh shit / shit (exclamation) | 靠 / 喔靠 |
| Oh | 喔 |
| Oh my god | 喔天啊 |
| damn | 靠 / 該死 |
| what the hell | 搞什麼 |
| no way | 不會吧 |
| seriously? | 認真的嗎 |

These are guidelines — adapt naturally to context. Do not force-fit if the tone doesn't match.

## Style Guidelines (Taiwan)

- Prefer Taiwan Traditional Chinese wording over direct literal translation.
- Use colloquial but readable internet/community language.
- Keep cadence conversational; avoid stiff textbook syntax.
- Use common Taiwan terms where natural:
  - 影片 over 视频
  - 畫面 over 屏幕
  - 軟體 over 软件
  - 資料 over 数据
  - 網路 over 网络
  - 品質 over 质量
  - 伺服器 over 服务器
  - 記憶體 over 内存

## Gaming & Community Terms

- Always use the official Traditional Chinese name for games (e.g., 艾爾登法環 not 老頭環).
- For game-specific terms (skills, items, locations, character names), use the terms commonly used in Taiwan gaming community. If no official TW translation exists, use the term the TW community commonly uses.
- If unsure, keep the original English term rather than guessing a translation.

## Tone Adaptation

When the source tone is casual, use lightweight Taiwanese net-speech naturally (e.g., 真的很扯, 超有感, 直接破防, 這段太神) but avoid overdoing slang in serious/technical segments.

## Output Format

- SRT format: keep block numbering and timestamp lines unchanged, translate only subtitle text.
- Save as `<original-filename>-zhtw.srt`.
