# English Localization Rules

Use these rules when translating a full SRT transcript into natural English.

## Objective

Translate/localize the FULL SRT script into natural, conversational English that feels native and not machine-translated.

## Hard Constraints

- Keep all SRT block numbering and timestamp lines exactly as-is.
- Translate only the subtitle text lines.
- Keep original meaning and factual claims; do not invent new facts.
- Keep speaker intent and tone.
- Do not summarize; output complete transcript.
- Do not add comma (,) or period (.) at the end of each subtitle line.
- Keep people names in their most commonly known form (e.g., use the name viewers would recognize).
- Game names must use official English names.
- Keep proper nouns (product names, channels) accurate.
- Preserve code, URLs, and command lines unchanged.

## Style Guidelines

- Prioritize natural, conversational English over direct literal translation.
- Subtitles should sound like something a native English speaker would actually say.
- Keep cadence conversational; avoid stiff textbook syntax.
- Match the register of the source — casual speech stays casual, technical content stays precise.
- Use contractions naturally (don't, can't, it's) when the tone is casual.
- Avoid overly formal or academic phrasing unless the source material is formal.

## Slang & Tone Adaptation

- Translate slang and exclamations into their natural English equivalents rather than literal translations.
- If the source uses strong language, preserve the intensity level in English.
- If the source uses internet/community slang, find the closest natural English equivalent.
- Do not sanitize or tone down expressions — match the original energy.

## Gaming & Community Terms

- Always use the official English name for games.
- For game-specific terms (skills, items, locations, character names), use the official English localization terms.
- If a game has no official English release, use the term the English-speaking gaming community commonly uses.
- If unsure, keep the original term rather than guessing a translation.

## Tone Adaptation

When the source tone is casual, use natural English internet/community speech (e.g., "that's insane", "no way", "this is so good", "absolutely cracked") but avoid overdoing slang in serious/technical segments.

## Output Format

- SRT format: keep block numbering and timestamp lines unchanged, translate only subtitle text.
- Save as `<original-filename>-en.srt`.
