# Japanese Localization Rules

Use these rules when translating a full SRT transcript into natural Japanese.

## Objective

Translate/localize the FULL SRT script into natural Japanese that feels native, matching the tone and energy of the source material.

## Hard Constraints

- Keep all SRT block numbering and timestamp lines exactly as-is.
- Translate only the subtitle text lines.
- Keep original meaning and factual claims; do not invent new facts.
- Keep speaker intent and tone.
- Do not summarize; output complete transcript.
- Do not add comma (、) or period (。) at the end of each subtitle line.
- Keep people names in original language, or use katakana if the person is commonly known by their katakana name in Japan.
- Game names, game terms, and character names must use official Japanese names or terms commonly used in JP gaming community.
- Keep proper nouns (product names, channels) accurate.
- Preserve code, URLs, and command lines unchanged.

## Slang & Exclamation Mapping

Use these Japanese expressions for common English words:

| English | Japanese |
|---------|----------|
| fucking / fuck (as intensifier) | くそ / マジで |
| oh shit / shit (exclamation) | やべえ / うわ |
| Oh | おっ / おお |
| Oh my god | マジか / うそだろ |
| damn | くそ / ちくしょう |
| what the hell | なんだこれ |
| no way | ありえない / うそだろ |
| seriously? | マジで？ |

These are guidelines — adapt naturally to context. Do not force-fit if the tone doesn't match.

## Style Guidelines (Japanese)

- Natural Japanese, not overly formal or textbook-like.
- Match the casualness level of the source material:
  - Use だ/である style for narration or explanatory segments.
  - Use casual forms (タメ口) for casual conversation.
  - Use polite forms (です/ます) only if the source is clearly polite/formal.
- Keep cadence conversational; avoid stiff written-language syntax.
- Use VTuber/streaming community language naturally where appropriate: 草, ワロタ, 推し, エモい, ヤバい, 神, etc.
- Balance kanji and kana for readability — do not over-kanji or over-kana.

## Gaming & Community Terms

- Always use the official Japanese name for games.
- For game-specific terms (skills, items, locations, character names), use the official Japanese localization terms or terms commonly used in JP gaming community.
- If no official Japanese translation exists, use the term the JP community commonly uses (often katakana transliteration).
- If unsure, keep the original English term rather than guessing a translation.

## Tone Adaptation

When the source tone is casual, use natural Japanese internet/community speech naturally (e.g., マジでヤバい, 神すぎる, これはエグい, 草, ワロタ, すげえ) but avoid overdoing slang in serious/technical segments.

## Output Format

- SRT format: keep block numbering and timestamp lines unchanged, translate only subtitle text.
- Save as `<original-filename>-jp.srt`.
