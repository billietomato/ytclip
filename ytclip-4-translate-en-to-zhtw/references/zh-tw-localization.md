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
- Do not mechanically append sentence-final `，` or `。` to every subtitle line.
- Keep people names in original language (do not transliterate).
- Game names, game terms, and character names must use official terms or words commonly used in Taiwan local community.
- Keep proper nouns (product names, channels) accurate.
- Preserve code, URLs, and command lines unchanged.
- Do not add speaker markers (e.g., >>, →, speaker labels). Leave multi-speaker attribution to the user.

## Filler Words vs. Transition Words

- **Remove** pure English filler words instead of translating them: Uh, Um, Hmm, Like (as filler), I mean, Basically (when not adding meaning).
- If a filler is the only content in a block, keep the block but leave the text empty or use a single `⋯` if the pause is meaningful.
- Exception: keep fillers that carry emotional weight (e.g., hesitation before bad news, comedic timing).
- **Do NOT blank transition words into `⋯`.** Short words that carry structural meaning in storytelling should be translated, not treated as filler:
  - "and" / "and then" → `然後`
  - "so" → `所以`
  - "but" / "but also" → `但是` / `不過`
  - "you know" → `你知道嗎`
  - "apparently" → `看起來`
  - "before" → `之前`
  - These words help the audience follow the speaker's narrative flow. Removing them creates jarring gaps in the story.

## Pauses & Trailing Off

- Use `⋯` (U+22EF or U+2026) to indicate trailing off, hesitation, or an unfinished thought.
- Do not use `...` or `…` — use `⋯` consistently.
- Example: "I didn't really—" → "我其實沒有⋯"

## Subtitle Punctuation Style

- Treat subtitle punctuation as **light but present**. The target style is not "zero punctuation."
- Use internal `，` when it helps spoken rhythm: clause turns, direct address, quoted-speech lead-ins, self-corrections, and "喔對 / 我說 / 天啊 / 等等" style pivots.
- Good patterns:
  - `喔對，讓我⋯`
  - `我說，如果你們想要的話`
  - `天啊，超大聲的`
- Default to **no sentence-final `。`** on ordinary subtitle lines. Most lines should end bare or with `⋯` when the thought trails off.
- Use sentence-final `？` only for genuine questions or rhetorical questions the speaker is audibly asking.
- Use sentence-final `！` sparingly. Prefer tone from wording first; use `！` only when the source is clearly shouted or emphatically exclaimed.
- `～` is allowed, but only for stretched reactions/interjections such as `耶～` or `靠～`. Do not scatter it everywhere.
- If punctuation starts doing too much work, split the subtitle into shorter blocks instead of stuffing multiple beats into one line.

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
| spoiler / no spoilers | 爆雷 / 不爆雷 |

These are guidelines — adapt naturally to context. Do not force-fit if the tone doesn't match.

## Formatting

- **No spaces around proper nouns**: do not insert spaces between a romanized proper noun and surrounding Chinese characters. Write `找Alice聊` not `找 Alice 聊`.
- **Half-width parentheses** for inline annotations: use `ramen (拉麵)` not `ramen（拉麵）`.
- **Arabic numerals** for numbers in casual speech: use Arabic numerals for sequential counting, prices, amounts, and stats. Write `10`, `20`, `30` not `十`, `二十`, `三十`. Write `500元` not `五百元`. Exception: set phrases where the Chinese character is part of the idiom (e.g., `一塊錢`, `兩個人`).

## Style Guidelines (Taiwan)

- Prefer Taiwan Traditional Chinese wording over direct literal translation.
- Use colloquial but readable internet/community language.
- Keep cadence conversational; avoid stiff textbook syntax.
- Translate for natural Chinese phrasing, not word-for-word from English. Restructure sentences freely to sound natural in Chinese.
- Keep each subtitle block short and punchy — aim for one natural phrase per block. Avoid cramming multiple ideas into a single block.
- **Subject retention for subtitles**: in subtitle translation, lean toward including subjects (我, 她, 我們) for readability — viewers have limited reading time and cannot re-read. Do not drop subjects as aggressively as you would in prose Chinese.
- **Preserve quoted speech perspective**: when translating reported speech that is clearly a direct quote (speaker mimicking someone else's words), preserve the first-person pronouns from the quoted speaker's perspective. E.g., `他說，我不想去` not `他說，他不想去`.
- **Soft particle `吧`**: use `吧` for soft suggestions, self-directed decisions, and casual proposals — it sounds natural and warm in spoken Chinese. E.g., `我們走吧`, `你來決定吧`.
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
- Genre-specific references:
  - For FPS / battle royale / hero shooter content, also read `references/zh-tw-fps-terms.md`
  - For fighting game / FGC / frame-data / matchup content, also read `references/zh-tw-fighting-game-terms.md`
- Only load those genre references when the source content clearly matches. Do not let FPS or fighting-game jargon bleed into unrelated content.

## Tone Adaptation

When the source tone is casual, use lightweight Taiwanese net-speech naturally but avoid overdoing slang in serious/technical segments.

Vivid TW-style intensifier patterns to use when the speaker is being emphatic or emotional:
- `有夠X` — e.g., `有夠噁的`
- `X死了` — e.g., `嚇死人了`, `累死了`
- `超～X` — e.g., `超～多的` (use `～` for stretched emphasis)
- `真的很扯`, `超有感`, `直接破防`, `這段太神`

## Output Format

- SRT format: keep block numbering and timestamp lines unchanged, translate only subtitle text.
- Save as `<original-filename>-zhtw.srt`.
