# Content Map Evaluation Guide

You are building a content map for a YouTube compilation editor. Your job is to score every chunk of a stream transcript for entertainment value, so the editor knows what to keep, what to skim, and what to skip.

## Your Role

You are NOT looking for standalone viral clips. You are identifying all content that is entertaining enough to belong in a highlight compilation. Think like a fan editor making a "best of" video: keep anything a viewer would enjoy watching, cut anything that would make them skip forward.

A typical highlight compilation keeps 20-35% of the source stream. If you are keeping less than 15% or more than 50%, recalibrate.

## Inputs

- `chunks.json`: Preprocessed transcript divided into ~5-minute chunks with inline `[HH:MM:SS]` timestamp markers and computed metrics
- Optional focus keywords in the JSON metadata

## Entertainment Score (0-5)

Score each chunk on a single axis: **how entertaining is this for a YouTube viewer?**

| Score | Label | Verdict | What it means |
|-------|-------|---------|---------------|
| 0 | Dead air | CUT | Extended silence, AFK, technical difficulties, countdown timers, stream-starting screens with no speech |
| 1 | Filler | CUT | Housekeeping without interesting reactions (schedule announcements, socials plugs, extended farewells), donation/superchat reading that is just "thank you [name]" on repeat, repeated identical gameplay attempts with no new commentary |
| 2 | Low activity | TRIM | Sparse commentary over routine gameplay, one-sided low-energy monologue, brief transitions between topics, exploratory gameplay with minimal reactions. Some of this may be needed for context or pacing — the editor decides |
| 3 | Active content | KEEP | Sustained back-and-forth conversation, gameplay with running commentary and reactions, storytelling or tangents with real engagement, problem-solving with banter |
| 4 | Strong content | KEEP | Memorable exchanges, well-timed comedy beats, exciting gameplay with strong reactions, compelling personal stories with payoffs, escalating bits |
| 5 | Peak moment | KEEP | Exceptional comedic timing, major emotional payoffs, quotable exchanges, intense gameplay climaxes, moments that would make a viewer rewind or share the video |

### How to assign the score

- **Score based on the strongest continuous 30+ seconds** in the chunk, not the average. A chunk with 2 minutes of gold and 3 minutes of routine should score based on the gold.
- **Adjacent chunks both scoring 3+** indicate sustained entertainment. Resist the urge to fragment — if the energy stays up across a chunk boundary, both chunks are KEEP.
- **A chunk with one brief bright spot (10-20s) surrounded by low content** should score 2 (TRIM). Call out the bright spot as a micro-moment in the edit guide.
- **When in doubt between 2 and 3**, ask: "Would a viewer notice if this 5 minutes were missing from the compilation?" If yes → 3. If no → 2.

## What to Look For

### Signal A: Conversational Density (strongest predictor of KEEP)

The single most reliable indicator that content should stay. Look for:

- **Rapid speaker alternation** — short utterances trading back and forth (indicates active dialogue, not monologue)
- **Question-response patterns** — genuine questions being asked and answered, not rhetorical
- **Disagreement or debate** — "No, but...", "Wait, that's not...", "Actually..." — people pushing back on each other
- **Overlapping excitement** — multiple short exclamations in rapid succession, people talking over each other
- **Riffing and bit-building** — one person sets up a joke or premise, the other builds on it, back and forth

**Important distinction:** Two people actively talking TO each other (KEEP) vs one person narrating while the other occasionally says "yeah" or "mm" (lower value).

### Signal B: Emotional Energy

Detectable even from auto-generated transcripts:

- **Exclamation clustering** — bursts of "Oh!", "No!", "What?!" in a short span
- **Laughter indicators** — repeated words from excitement, speech becoming fragmented or incoherent mid-sentence
- **Dramatic tone shifts** — calm to screaming, serious to cracking up, confident to panicked
- **Genuine surprise or shock** — reactions that break the normal conversational register
- **Escalating intensity** — each sentence more animated than the last

### Signal C: Narrative Structure

Content with a beginning, middle, and payoff — even informally:

- **Story introductions** — someone starting an anecdote or tangent that develops over 30+ seconds
- **Escalation patterns** — a bit or situation getting progressively more absurd or intense
- **Callbacks** — references to something said earlier in the stream (same topic recurring = higher value)
- **Revelations and confessions** — personal admissions, surprising facts, "I never told anyone this" moments
- **Self-aware meta-commentary** — streamers commenting on the stream itself, breaking the fourth wall about editing or content creation

### Signal D: Gameplay Engagement

For gaming streams, distinguishing active gameplay from routine:

- **Challenge and struggle** — expressions of difficulty, frustration, repeated attempts with escalating reactions
- **Victory and defeat reactions** — triumph after a hard section, rage at an unexpected loss
- **Co-op coordination** — players giving each other directions, strategizing together, reacting to each other's actions
- **Commentary on screen events** — describing and reacting to what's happening in-game (indicates visual interest the editor should check)
- **Contrast between expectation and outcome** — "This should be easy" followed by failure, or unexpected success

### Signal E: Dead Air Indicators (what to CUT)

Text patterns that reliably predict content to skip:

- **Sparse isolated utterances** — "Yeah." ... "Okay." ... "Hmm." — with large time gaps between them
- **Verbatim reading without reaction** — reading donation messages, in-game text, or credits with no commentary added
- **Repetitive action narration** — describing the same type of action over and over with no variation
- **Administrative talk** — scheduling, reminding about subscriptions, checking donation goals, discussing technical setup
- **Extended single-speaker monologue with flat energy** — one person talking at length with no variation in engagement level and no response from others

## Using the Computed Metrics

Each chunk includes metrics computed from subtitle timing. Use them as supporting evidence, not as the sole basis for scoring:

| Metric | High value suggests | Low value suggests |
|--------|--------------------|--------------------|
| `speechDensity` > 0.7 | Active conversation or narration | Dead air, loading, or silent gameplay |
| `speechDensity` < 0.3 | Likely silence-heavy — strong CUT candidate | — |
| `wordsPerMinute` > 140 | Animated, energetic speech | — |
| `wordsPerMinute` < 60 | Sparse commentary — likely filler | — |
| `longestSilenceSec` > 30 | Contains a major pause (loading, AFK, cutscene) | — |
| `estimatedTurns` > 10 (per 5-min chunk) | Multi-speaker back-and-forth | — |
| `estimatedTurns` < 3 | Monologue or silence-heavy | — |

**Always read the text.** A high-speechDensity chunk could still be boring donation reading. A low-turn chunk could be a compelling solo story. Metrics are a first filter, not the final answer.

## Focus Keywords

If `focusKeywords` are present in chunks.json:

- Give extra attention to moments matching these topics
- They are a **tiebreaker**, not an override — a boring moment matching a keyword should NOT beat genuinely entertaining content
- Understand the keywords semantically — look for moments about that topic, not just the exact string

## Output Format

Output a Markdown file with two sections:

### Section 1: Quick Reference Timeline

A table with one row per chunk. Keep descriptions under 12 words. This section is for scanning.

```markdown
# Content Map

Source: `<source SRT filename>`
Stream duration: HH:MM:SS | Chunks: N
Keep: N | Trim: N | Cut: N

## Timeline

| # | Time | Score | Verdict | What happens |
|---|------|-------|---------|--------------|
| 0 | 00:00 – 05:00 | 4 | KEEP | Opening banter, collab intro, good energy |
| 1 | 05:00 – 10:00 | 1 | CUT | Loading screen, minimal dialogue |
| 2 | 10:00 – 15:00 | 3 | KEEP | Game tangent, active back-and-forth |
```

### Section 2: Edit Guide

Group consecutive chunks with the same verdict into single entries. This section provides actionable notes for the editor.

**For KEEP groups (score 3-5):**
```markdown
## KEEP 00:00:00 – 00:09:30 (chunks 0-1) ★4

Strong collab opening with sustained banter.

- [00:02:50] – [00:06:24]: Core exchange, high energy throughout
- [00:06:47] – [00:07:35]: Follow-up tangent, still engaging
- Dip at ~[00:08:15]: energy trails off into gameplay setup, could trim last 60s
```

**For TRIM groups (score 2):**
```markdown
## TRIM 00:20:00 – 00:25:00 (chunk 4) ★2

Routine gameplay with a few good moments buried in downtime.

- [00:22:31] – [00:23:21]: **Micro-moment** — quick funny exchange, worth extracting
- Rest is sparse commentary over puzzle gameplay
```

**For CUT groups (score 0-1):**
```markdown
## CUT 00:10:00 – 00:20:00 (chunks 2-3) ★0-1

Dead air and loading screens. No usable content.
```

### Edit Guide Rules

- **Merge consecutive same-verdict chunks** into one entry. Five consecutive KEEP chunks → one edit guide entry spanning the full range.
- **For KEEP entries:** Note internal dips ("energy drops at ~[timestamp], could trim 30s") and peaks ("strongest moment at [timestamp]").
- **For TRIM entries:** Identify specific micro-moments worth extracting ("funny one-liner at [timestamp], ~15s").
- **For CUT entries:** Keep it to one line. No need for sub-segment analysis.
- **Use only `[HH:MM:SS]` markers that exist in the chunk text.** Never fabricate timestamps.
- **The ★ symbol** shows the highest score in that group (for KEEP/TRIM) or the range (for CUT).

## Accuracy Rules

- **Never fabricate timestamps.** Only use `[HH:MM:SS]` markers that appear in the chunk text.
- When specifying sub-ranges in the edit guide, snap to the nearest inline marker.
- Every timestamp in the output must be verifiable against the chunks.json data.
