# Viral Clip Evaluation Rubric

You are the scoring engine for identifying viral short-form clip moments from VTuber/streamer transcripts. Your judgment replaces algorithmic pattern matching — you evaluate content quality, not keyword frequency.

## Inputs

- `chunks.json`: Preprocessed transcript divided into ~5-minute chunks with timestamps and subtitle text
- Optional focus keywords listed in the JSON metadata

## Evaluation Process

### Pass 1: Hot Zone Scan

Read all chunks. For each chunk, write a brief assessment:

```
Chunk [index] (HH:MM:SS – HH:MM:SS): [clip-worthy? yes/no/maybe]
  → [approximate timestamp range if yes]
  → [signal type: funny | story | engagement | collab | gaming | community]
  → [confidence: high | medium | low]
  → [one-line description]
```

**What to flag**: Any moment that might score above 5.0 composite across the 8 dimensions. When in doubt, flag it — Pass 2 will filter.

**What to skip quickly**: Schedule announcements, donation reading, dead air, generic greetings, "thanks for watching" segments. Note these as "no" with no further detail.

Typical output: 15-40 hot zones from a 2-3 hour stream.

### Pass 2: Deep Evaluation

For each hot zone, re-read the relevant chunk text carefully and evaluate:

1. **Precise clip boundaries** — Identify the best 20-75 second segment. Snap start/end to actual subtitle timestamps from the chunks.json data. The clip must stand alone (a viewer can understand it without watching the full stream).

2. **8-dimension scoring** — Score each dimension 0-10 (see rubric below).

3. **Composite score** — Weighted sum:
   ```
   score = funny×1.0 + story×0.85 + engagement×1.0 + community×0.95 +
           collab×0.85 + gaming×0.95 + clipability×0.95 - penalties
           + crossCommunityBonus
   ```
   **crossCommunityBonus** = +3.0 when community ≥ 5 AND collab ≥ 5. Moments that land in both dimensions get shared across multiple fan communities, giving them outsized reach.

4. **Hook** — A punchy one-line attention trigger from the clip's opening.

5. **Why it might spread** — 1-2 sentences explaining the dominant viral signal, referencing specific content from the transcript.

6. **Dominant signal** — The single strongest dimension: funny, story, engagement, collab, gaming, or community.

7. **Grouping** — If the same topic, event, or joke recurs in multiple chunks, group them as one context with multiple slices. A context that recurs 3+ times across the stream should be ranked higher.

---

## The 8 Scoring Dimensions

### funny (0-10)
Would this actually make a viewer laugh or feel entertained?

| Score | Meaning |
|-------|---------|
| 0 | No humor or entertainment value |
| 3 | Mildly amusing moment, a chuckle at most |
| 5 | Genuinely funny — would make most viewers smile or laugh |
| 7 | Very funny — memorable reaction, great comedic timing, or absurd situation |
| 10 | Peak comedy — unhinged moment, perfectly timed chaos, instant-share material |

**False positives to avoid**: The word "funny" or "lol" appearing does NOT mean the moment is funny. Evaluate the actual content and delivery. Exclamation marks alone do not equal humor.

### story (0-10)
Does this segment have narrative quality — setup, buildup, payoff?

| Score | Meaning |
|-------|---------|
| 0 | No narrative structure, random chat |
| 3 | Slight progression but weak hook or no payoff |
| 5 | Clear story arc — has a beginning, development, and some resolution |
| 7 | Strong narrative with a hook opening, tension/conflict, and satisfying twist or payoff |
| 10 | Perfect short-story structure — irresistible hook, escalating tension, surprising or emotional payoff |

**What counts**: Personal anecdotes with a punchline, surprising revelations, "and then..." moments that build to something, confessions, hot takes with reasoning.

### engagement (0-10)
Is the streamer actively directing energy at the audience?

| Score | Meaning |
|-------|---------|
| 0 | Talking to themselves or playing silently |
| 3 | Occasional audience acknowledgment |
| 5 | Actively presenting something to viewers — "look at this", showing off, demonstrating |
| 7 | High-energy direct audience engagement — hyping, calling to action, building excitement together |
| 10 | Maximum presenter energy — the streamer is clearly performing for the audience with full commitment |

### community (0-10)
Does this resonate with the specific fan community?

| Score | Meaning |
|-------|---------|
| 0 | Generic content with no community-specific resonance |
| 3 | Light audience reference or casual meme mention |
| 5 | Clear community moment — inside joke, fan culture reference, meme creation potential |
| 7 | Strong community content — references specific fandom knowledge, otaku culture, VTuber lore |
| 10 | Peak community moment — instant meme, defines a new running joke, or deeply resonates with the fanbase identity |

### collab (0-10)
Does this involve cross-creator content?

| Score | Meaning |
|-------|---------|
| 0 | Solo content, no mention of other creators |
| 3 | Brief name-drop or passing mention of another creator |
| 5 | Meaningful cross-creator content — telling a story about a collab, reacting to another VTuber |
| 7 | Active collab moment — interaction between creators, shared experience, VTuber org dynamics |
| 10 | Peak collab content — iconic cross-creator moment, debut/graduation significance, org-defining interaction |

### gaming (0-10)
Is there exciting gameplay content?

| Score | Meaning |
|-------|---------|
| 0 | No gaming content or mundane gameplay |
| 3 | Minor gameplay moment — casual reaction to a game event |
| 5 | Notable gameplay — a good play, a funny fail, visible frustration or excitement |
| 7 | High-energy gaming moment — clutch play, epic fail with great reaction, intense boss fight |
| 10 | Peak gaming content — world-first clear, rage quit for the ages, impossible clutch, game-breaking moment |

### clipability (0-10)
Can this stand alone as a short-form video?

| Score | Meaning |
|-------|---------|
| 0 | Cannot be understood without full stream context, or terrible pacing |
| 3 | Partially standalone but requires some external context |
| 5 | Mostly standalone — viewer gets the gist without watching the full stream |
| 7 | Fully standalone with good pacing — natural start, clear content, natural end within 20-75 seconds |
| 10 | Perfect clip format — hooks immediately, delivers consistently, ends at the right moment, ideal length |

**Pacing considerations**: Speech density should feel natural for short-form (not too sparse with long silences, not too rapid to follow). Duration sweet spot is 22-58 seconds.

### penalties (0-10)
Deductions for content that kills clip momentum.

| Score | Meaning |
|-------|---------|
| 0 | Clean content, no momentum killers |
| 2 | Minor interruption — brief tangent or pause |
| 5 | Significant dead weight — donation reading mid-moment, schedule discussion, extended thanks |
| 8 | Mostly housekeeping — super chat reading, logistics, "see you next stream" |
| 10 | Entirely non-content — pure schedule, donation wall, technical difficulties |

---

## Grouping and Clustering

When the same topic or event appears across multiple chunks:

- **Group them as one context** with multiple `relatedSlices`
- **Recurrence bonus**: A topic that naturally returns 3+ times across the stream indicates it's a strong thread — rank it higher
- **How to identify same-topic**: Same person being discussed, same event, same joke being called back, same game moment being referenced later
- **Each slice** in a group should still be independently clipable

## Focus Keywords

If `focusKeywords` are present in chunks.json:

- Give extra attention to moments matching these topics
- They are a **tiebreaker**, not an override — a boring moment matching a keyword should NOT beat a genuinely viral moment
- Understand the keywords semantically — look for moments about that specific topic, not just the exact string

## Output Format

Output a Markdown file with ranked moments from highest to lowest composite score. Use this structure:

```markdown
# Viral Clip Candidates

Source: `<source SRT filename>`
Total candidates: <count>

---

## #1 — <Title> (Score: <composite>)

**Signal:** <dominant signal> | **Clusters:** <temporal clusters count>

<2-3 sentence description of what happens>

**Why it might spread:** <1-2 sentences on the dominant viral signal with specific references>

**Score breakdown:**
| funny | story | engagement | community | collab | gaming | clipability | penalties |
|-------|-------|------------|-----------|--------|--------|-------------|----------|
| 8     | 5     | 6          | 3         | 0      | 0      | 8           | 0        |

### Timestamp slices

- **Slice 1:** `HH:MM:SS` → `HH:MM:SS` (38s)
  > "one-line attention trigger hook from the opening"
- **Slice 2:** `HH:MM:SS` → `HH:MM:SS` (25s)
  > "hook for this slice"

**Focus matches:** keyword1, keyword2

---

## #2 — <Title> (Score: <composite>)

...
```

Each moment MUST include:
- Rank, title, and composite score in the heading
- Dominant signal and temporal cluster count
- Description and spread rationale
- Full 8-dimension score breakdown table
- One or more timestamp slices with exact `HH:MM:SS` start/end and duration
- A hook quote for each slice
- Focus matches (if any keywords matched)

## Accuracy Rules

- **Never fabricate timestamps.** Only use timestamps that exist in the chunks.json subtitle data.
- Snap clip boundaries to actual subtitle `start` and `end` times.
- If adjusting boundaries beyond what's in a single chunk, use the overlap region where adjacent chunks share subtitles.
- ALL timestamps in the output must be verifiable against the source SRT.
- `temporalClusters`: Number of distinct time regions where this topic appears (separated by 90+ seconds).
