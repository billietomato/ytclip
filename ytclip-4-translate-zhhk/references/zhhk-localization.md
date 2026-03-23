# zh-HK Localization Rules

Use these rules when translating a full SRT transcript into Hong Kong Cantonese (Traditional Chinese).

## Objective

Translate/localize the FULL SRT script into natural Cantonese as used by Hong Kong communities, written in Traditional Chinese characters.

## Hard Constraints

- Keep all SRT block numbering and timestamp lines exactly as-is.
- Translate only the subtitle text lines.
- Keep original meaning and factual claims; do not invent new facts.
- Keep speaker intent and tone.
- Do not summarize; output complete transcript.
- Do not add comma (，) or full-stop (。) at the end of each subtitle line.
- Keep people names in original language (do not transliterate).
- Game names, game terms, and character names must use official HK/TW Traditional Chinese names or terms commonly used in HK gaming community.
- Keep proper nouns (product names, channels) accurate.
- Preserve code, URLs, and command lines unchanged.

## Slang & Exclamation Mapping

Use these Hong Kong Cantonese expressions for common English words:

| English | zh-HK |
|---------|-------|
| fucking / fuck (as intensifier) | 屌 / 仆街 |
| oh shit / shit (exclamation) | 哎吔 / 死火 |
| Oh | 哦 |
| Oh my god | 我嘅天 / 天啊 |
| damn | 仆街 / 冚家鏟 |
| what the hell | 搞乜鬼 |
| no way | 唔係啩 |
| seriously? | 認真㗎? |

These are guidelines — adapt naturally to context. Do not force-fit if the tone doesn't match.

## Style Guidelines (Hong Kong)

- Use Traditional Chinese characters with Cantonese phrasing, not Mandarin phrasing.
- Use colloquial but readable Hong Kong community language.
- Keep cadence conversational; avoid stiff textbook syntax.
- Use Cantonese particles naturally: 啦, 囉, 嘅, 咩, 㗎, 喎, 噃, 嘛.
- Use common Hong Kong terms where natural:
  - 影片 for video
  - 屏幕 / 熒幕 for screen
  - 軟件 for software
  - 數據 for data
  - 網絡 for network
  - 質素 for quality
  - 伺服器 for server
  - 記憶體 for memory

## Gaming & Community Terms

- Use the official HK/TW Traditional Chinese name for games, or the name commonly used in the HK gaming community.
- For game-specific terms (skills, items, locations, character names), use the terms commonly used in HK gaming community.
- If no official Traditional Chinese translation exists, use the term the HK community commonly uses.
- If unsure, keep the original English term rather than guessing a translation.

## Tone Adaptation

When the source tone is casual, use natural Hong Kong Cantonese net-speech and slang naturally (e.g., 勁, 好癲, 痴線, 正, 好嘢) but avoid overdoing slang in serious/technical segments.

## Output Format

- SRT format: keep block numbering and timestamp lines unchanged, translate only subtitle text.
- Save as `<original-filename>-zhhk.srt`.
