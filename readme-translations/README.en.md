# ytclip — Fansub Clipping Helper

**[English](README.en.md)** | [繁體中文](../README.md) | [简体中文](README.zh-CN.md)


Make fanmade VTuber clips from YouTube VODs with translated subtitles, assisted by AI agent skills.

This workflow helps you pull streams, spot the most interesting moments, edit faster, remap subtitles to your cut, translate them to Traditional Chinese, proofread for typos, and convert to Simplified Chinese — so your oshi's words can travel further with love, passion, and efficiency.

## What You'll Need

Before starting, install these tools. They handle the setup work so you can spend more time clipping and translating.

### 1. yt-dlp (Download videos from YouTube)

**macOS (Homebrew):**
```bash
brew install yt-dlp
```

**Windows (Scoop):**
```bash
scoop install yt-dlp
```

**Windows (Chocolatey):**
```bash
choco install yt-dlp
```

**Any platform (pip):**
```bash
pip install yt-dlp
```

Verify it works:
```bash
yt-dlp --version
```

### 2. Bun (JavaScript runtime for the scripts)

**macOS / Linux:**
```bash
curl -fsSL https://bun.sh/install | bash
```

**Windows:**
```bash
powershell -c "irm bun.sh/install.ps1 | iex"
```

Verify it works:
```bash
bun --version
```

### 3. Claude Code (AI agent for scoring & translation)

Steps 2, 5, and 6 use an AI agent to find interesting moments, translate, and proofread subtitles. This README uses **Claude Code** as the example.

1. **Create an Anthropic account** — Go to [claude.ai](https://claude.ai) and sign up
2. **Subscription or API key** — To use AI models with Claude Code, you need an active subscription or an API key. Sonnet 4.6 is recommended.
3. **Install Claude Code:**
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```
4. **Launch it:**
   ```bash
   claude
   ```

> **Using a different AI agent?** If it can follow the `SKILL.md` files and reference docs used in Steps 2, 5, and 6, it can do the same job.

### 4. A Video Editor

You need one of the following to edit your clips:

| Editor | Platform | Export Format |
|--------|----------|---------------|
| **Adobe Premiere Pro** | Mac / Windows | Final Cut Pro XML |
| **Final Cut Pro** | Mac | FCPXML |
| **DaVinci Resolve** | Mac / Windows / Linux | Final Cut Pro 7 XML |

You do not need pro editor skills. If you can import footage, cut a timeline, and export XML and video, you are set.

---

## Getting Started

### Clone this repository

```bash
git clone https://github.com/billietomato/ytclip.git
cd ytclip
```

### Set up your working directory

We recommend creating a dedicated folder under the repo root for each video project. All scripts run from the repo root using relative paths, so this keeps everything in one place.

```bash
mkdir my-video
```

> **Tip:** Video files and work-in-progress outputs don't need to be tracked by git. Add your working folder to `.gitignore`:
> ```bash
> echo 'my-video/' >> .gitignore
> ```

---

## The Pipeline at a Glance

```
YouTube URL
    │
    ▼
─── Phase 1: Download & Edit ───────────────────
    │
┌───────────────────────────────┐
│ Step 0: Download VOD          │  yt-dlp
└───────────────────────────────┘
    │
    ▼
┌───────────────────────────────┐
│ Step 1: Get transcript        │  ytclip-1-transcript
└───────────────────────────────┘
    │  SRT file
    ▼
┌───────────────────────────────┐
│ Step 2: Find interesting      │  ytclip-2-highlight-moments (AI)
│         moments               │
└───────────────────────────────┘
    │  Markdown with timestamps
    ▼
┌───────────────────────────────┐
│ Step 3: Edit clips            │  Your video editor
└───────────────────────────────┘
    │  Edited timeline + XML export
    ▼
─── Phase 2: Translate & Export zh-TW ──────────
    │
┌───────────────────────────────┐
│ Step 4: Remap subtitles       │  ytclip-3-remap-srt
└───────────────────────────────┘
    │  Remapped SRT
    ▼
┌───────────────────────────────┐
│ Step 5: Translate EN → zh-TW  │  ytclip-4-translate-en-to-zhtw (AI)
└───────────────────────────────┘
    │  zh-TW SRT
    ▼
┌───────────────────────────────┐
│ Step 6: Proofread zh-TW       │  ytclip-5-proofread-zhtw (AI)
└───────────────────────────────┘
    │  Proofread SRT
    ▼
┌───────────────────────────────┐
│ Step 7: Manual subtitle edit  │  Your video editor
└───────────────────────────────┘
    │  Fine-tuned zh-TW SRT
    ▼
┌───────────────────────────────┐
│ Step 8: Export zh-TW clip     │  Your video editor
└───────────────────────────────┘
    │
    ▼  ✓ zh-TW version done
    │
─── Phase 3: Convert to SC & Export ────────────
    │
┌───────────────────────────────┐
│ Step 9: Export zh-TW SRT &    │  ytclip-6-convert-tc-to-sc
│         convert TC → SC       │
└───────────────────────────────┘
    │  zh-CN SRT
    ▼
┌───────────────────────────────┐
│ Step 10: Review SC & export   │  Your video editor
└───────────────────────────────┘
    │
    ▼
  ✓ zh-TW + zh-CN versions done!
```

---

## Phase 1: Download & Edit

### Step 0 — Download the VOD

Download the video using yt-dlp. You can grab the full stream or just a specific section.

**A) Download the full stream:**
```bash
yt-dlp -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]' \
  -o 'raw-video.%(ext)s' \
  'https://www.youtube.com/watch?v=VIDEO_ID'
```

**B) Download a specific section only** (e.g. `1:00:00` to `2:30:00`):
```bash
yt-dlp --download-sections "*01:00:00-02:30:00" \
  -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]' \
  -o 'raw-video.%(ext)s' \
  'https://www.youtube.com/watch?v=VIDEO_ID'
```

> **Tip:** Replace `VIDEO_ID` with the stream's actual video ID. Keep the URL in single quotes to avoid shell issues.

### Step 1 — Download the Transcript

Pull the video's subtitles from YouTube as an SRT file. This becomes the base for scoring, clipping, and translation. **The transcript's time range must match the video so they stay in sync when imported into your editor.**

**A) Download the full transcript** (to match the full stream):

Using the CLI:
```bash
bun ytclip-1-transcript/scripts/main.ts \
  'https://www.youtube.com/watch?v=VIDEO_ID' \
  --format srt \
  -o my-video/transcript-en.srt
```

Or using an AI agent:
> Use ytclip-1-transcript skill. Download the full English transcript for `https://www.youtube.com/watch?v=VIDEO_ID` and save it as `my-video/transcript-en.srt`.

**B) Download a section of the transcript** (to match a video downloaded with `--download-sections`):

Using the CLI:
```bash
bun ytclip-1-transcript/scripts/main.ts \
  'https://www.youtube.com/watch?v=VIDEO_ID' \
  --format srt \
  --section '01:00:00-02:30:00' \
  -o my-video/transcript-en.srt
```

Or using an AI agent:
> Use ytclip-1-transcript skill. Download the English transcript for `https://www.youtube.com/watch?v=VIDEO_ID`, extract only the `01:00:00-02:30:00` section with timestamps rebased to 00:00:00. Save as `my-video/transcript-en.srt`.

> **Timestamp sync:** The `--section` flag automatically rebases timestamps to start at `00:00:00`, matching the video produced by yt-dlp's `--download-sections`. When you import both into your editor, they will be perfectly in sync.

**Choose a different subtitle language** if the VOD already has the version you want to work from:
```bash
# List available languages first
bun ytclip-1-transcript/scripts/main.ts 'https://www.youtube.com/watch?v=VIDEO_ID' --list

# Download Japanese subtitles
bun ytclip-1-transcript/scripts/main.ts 'https://www.youtube.com/watch?v=VIDEO_ID' \
  --format srt --languages ja -o my-video/transcript-ja.srt
```

Your folder now looks like:
```
my-video/
  raw-video.mp4
  transcript-en.srt          ← English subtitles, timestamps synced with video
```

### Step 2 — Find Interesting Moments (AI)

This is a two-part pass: first a script chunks the transcript, then an AI agent identifies the most interesting moments for a fanmade clip.

#### 2a. Chunk the transcript

```bash
bun ytclip-2-highlight-moments/scripts/clip_candidates.ts \
  my-video/transcript-en.srt \
  -o my-video/chunks.json
```

**Optional** — steer the AI toward specific themes you want to prioritize:
```bash
bun ytclip-2-highlight-moments/scripts/clip_candidates.ts \
  my-video/transcript-en.srt \
  --focus 'announcement,new outfit' \
  -o my-video/chunks.json
```

#### 2b. Ask the AI to evaluate

Open Claude Code (or your AI agent) in this project directory and ask:

> Use ytclip-2-highlight-moments skill. Read `my-video/chunks.json` and identify the top 10-20 clip-worthy moments for a fanmade VTuber highlight following the rubric in `ytclip-2-highlight-moments/references/highlight-evaluation-rubric.md`. Save the output as `my-video/highlight-moments.md`.

The AI will:
1. Sweep the transcript for moments fans are likely to clip, quote, or share
2. Score each candidate across 8 dimensions (humor, story, engagement, community, collabs, gaming, clipability, penalties)
3. Produce a ranked Markdown shortlist with exact timestamps

Your folder now looks like:
```
my-video/
  raw-video.mp4
  transcript-en.srt
  chunks.json                ← Preprocessed chunks
  highlight-moments.md       ← Ranked clip candidates with timestamps
```

### Step 3 — Edit Your Clips (DIY!)

Open your video editor and turn the shortlist into the cuts you actually want to post.

#### Import the video

| Editor | How to import |
|--------|---------------|
| **Premiere Pro** | File > Import (or drag into Project panel) |
| **Final Cut Pro** | File > Import > Media |
| **DaVinci Resolve** | File > Import > Media (or drag into Media Pool) |

#### Cut your clips

1. Open `highlight-moments.md` and review the timestamps and notes
2. Jump to each moment in your editor's timeline
3. Cut the parts you want to keep, such as reactions, reveals, jokes, announcements, songs, or emotional beats
4. Arrange the clips on your timeline in the order you want
5. Tighten pacing and transitions as needed

> **Do not add subtitles yet** — wait until Phase 2 when the translated subtitles are ready.

#### Export the project XML

Export your timeline as an XML file so the next step can read the edit you made.

| Editor | How to export XML |
|--------|-------------------|
| **Premiere Pro** | File > Export > Final Cut Pro XML |
| **Final Cut Pro** | File > Export XML |
| **DaVinci Resolve** | File > Export > Timeline > FCP 7 XML (or FCPXML) |

Save as `my-video/export.xml`.

Your folder now looks like:
```
my-video/
  raw-video.mp4
  transcript-en.srt
  chunks.json
  highlight-moments.md
  export.xml                 ← Your edit decisions
```

---

## Phase 2: Translate & Export zh-TW

### Step 4 — Remap Subtitles to Your Edit

Your original SRT still matches the full stream. This step remaps it to the timing of your edited clip.

#### 4a. Parse the XML into a clip manifest

```bash
bun ytclip-3-remap-srt/scripts/parse_cuts.ts \
  my-video/export.xml \
  --track 0 \
  -o my-video/clip_manifest.json
```

> **Note:** `--track 0` means the first video track. If your clips are on a different track, change the number.

#### 4b. Remap the SRT

```bash
bun ytclip-3-remap-srt/scripts/remap_srt.ts \
  my-video/transcript-en.srt \
  my-video/clip_manifest.json \
  -o my-video/transcript-en-remapped.srt \
  --gap 50
```

This keeps only the subtitle lines that survive the cut and shifts their timestamps to match your final sequence.

Your folder now looks like:
```
my-video/
  ...(previous files)
  clip_manifest.json         ← Parsed clip timing
  transcript-en-remapped.srt ← Subtitles matching your edit
```

### Step 5 — Translate Subtitles EN → zh-TW (AI)

Translate the remapped English subtitles into Traditional Chinese (Taiwan). Open Claude Code (or your AI agent) and ask:

> Use ytclip-4-translate-en-to-zhtw skill. Translate `my-video/transcript-en-remapped.srt` to zh-TW following the localization rules in `ytclip-4-translate-en-to-zhtw/references/zh-tw-localization.md`. Save as `my-video/transcript-zhtw-remapped.srt`.

The AI reads your SRT directly. The localization rules handle Taiwan fan terminology, in-jokes, and community tone.

### Step 6 — Proofread zh-TW Subtitles (AI)

Have the AI proofread the translated zh-TW SRT for confirmed typos only — no style suggestions. Open Claude Code and ask:

> Use ytclip-5-proofread-zhtw skill. Proofread `my-video/transcript-zhtw-remapped.srt` and report only confirmed typos (wrong characters, garbled text, obvious mistakes).

The AI will report each typo with its SRT block number, the original line, and the correct text. If the file is clean, it will say so. Fix any reported typos in the SRT file first.

### Step 7 — Manual Subtitle Edit

Import the proofread zh-TW SRT into your video editor and review each line against the video:

| Editor | How to import SRT |
|--------|-------------------|
| **Premiere Pro** | File > Import > select the `.srt` file, then drag it onto a captions track |
| **Final Cut Pro** | File > Import > Captions, select the `.srt` file |
| **DaVinci Resolve** | File > Import > Subtitle, select the `.srt` file, drag to subtitle track |

Play through and check:

1. **Fine-tune timing** — some lines may be a few frames off after the automated remap; nudge them into place
2. **Refine wording** — AI translations may not perfectly match your tone; this is your last chance to polish
3. **Check for overlap** — make sure subtitles don't cover important visuals

> This step is the quality gate. The SRT you produce here will also be used to generate the Simplified Chinese version, so fixing it now saves you from fixing it twice.

### Step 8 — Export zh-TW Clip

Once your subtitles look right, export the Traditional Chinese version.

#### Style your subtitles (optional)

- **Premiere Pro:** Select captions in the Essential Graphics panel to change font, size, color, and position
- **Final Cut Pro:** Select caption clips and adjust in the Inspector panel
- **DaVinci Resolve:** Go to the Fusion or Edit page to style subtitle appearance

#### Export the video

| Editor | How to export |
|--------|---------------|
| **Premiere Pro** | File > Export > Media. Under Captions, choose "Burn Captions Into Video" or "Create Sidecar File" |
| **Final Cut Pro** | File > Share > Master File (or your preferred preset). Captions are included automatically |
| **DaVinci Resolve** | Deliver page > set format and codec. Under Subtitle, choose "Export Subtitle" to burn in |

zh-TW version done!

---

## Phase 3: Convert to SC & Export

### Step 9 — Export zh-TW SRT & Convert to Simplified Chinese

Export the manually reviewed zh-TW SRT from your editor, then convert it to Simplified Chinese.

#### 9a. Export the reviewed zh-TW SRT

| Editor | How to export SRT |
|--------|-------------------|
| **Premiere Pro** | File > Export > Captions, choose SRT format |
| **Final Cut Pro** | File > Export Captions, choose SRT format |
| **DaVinci Resolve** | Deliver page > Subtitle settings > export as standalone SRT file |

Save as `my-video/transcript-zhtw-final.srt`.

#### 9b. Convert TC → SC

```bash
bun ytclip-6-convert-tc-to-sc/scripts/convert.ts \
  my-video/transcript-zhtw-final.srt \
  -o my-video/transcript-zhcn-final.srt
```

> **Note:** This is a pure character conversion — it does NOT adapt terminology or phrasing for mainland usage. If you need mainland localization (e.g. changing 影片 to 视频), that requires a separate pass.

### Step 10 — Review SC & Export

Import the Simplified Chinese SRT into your editor for a quick visual check, then export.

#### Import the SC SRT

Use the same import method as Step 7 to import `my-video/transcript-zhcn-final.srt`. Remove or disable the zh-TW caption track first.

#### Quick review

1. Play through a few sections to confirm the character conversion is correct
2. Watch for special terms that TC→SC conversion may have missed
3. Verify timing matches the zh-TW version

#### Export the SC video

Use the same export method as Step 8 to export the Simplified Chinese subtitled version.

zh-TW + zh-CN versions done!

---

## Final Project Folder

```
my-video/
  raw-video.mp4                    Original stream archive
  transcript-en.srt                Source subtitles (full-stream timeline)
  chunks.json                      Transcript chunks for AI review
  highlight-moments.md             Ranked clip shortlist with timestamps
  export.xml                       Editor timeline export
  clip_manifest.json               Parsed cut timing data
  transcript-en-remapped.srt       English subtitles aligned to your cut
  transcript-zhtw-remapped.srt     AI-translated and proofread zh-TW subtitles
  transcript-zhtw-final.srt        Manually reviewed zh-TW subtitles (exported from editor)
  transcript-zhcn-final.srt        Simplified Chinese subtitles (TC→SC conversion)
```

## Project Structure

```
ytclip/
├── ytclip-1-transcript/                 Pull YouTube subtitles as SRT
│   └── scripts/main.ts
├── ytclip-2-highlight-moments/          AI finds interesting moments → Markdown
│   ├── scripts/clip_candidates.ts
│   └── references/
│       └── highlight-evaluation-rubric.md
├── ytclip-3-remap-srt/                  Remap subtitles to edited cuts
│   └── scripts/
│       ├── parse_cuts.ts
│       └── remap_srt.ts
├── ytclip-4-translate-en-to-zhtw/       AI translate English subtitles → zh-TW
│   ├── SKILL.md
│   └── references/zh-tw-localization.md
├── ytclip-5-proofread-zhtw/             AI proofread zh-TW subtitles for typos
│   └── SKILL.md
├── ytclip-6-convert-tc-to-sc/           Convert TC → SC (direct character conversion)
│   └── scripts/convert.ts
└── readme-translations/                 Localized README files
```

## Scoring Reference

The AI in Step 2 scores transcript chunks across 8 dimensions to surface the moments fans are most likely to clip, translate, and share:

| Dimension | What it detects |
|-----------|-----------------|
| **funny** | Comedy quality, reaction intensity, comedic timing, absurdity |
| **story** | Narrative hooks, setup/buildup/payoff, twists, surprising revelations |
| **engagement** | Streamer actively presenting, directing energy at audience |
| **community** | Fan community resonance, inside jokes, meme potential, otaku culture |
| **collab** | Cross-creator content, VTuber interactions, org dynamics |
| **gaming** | Clutch plays, epic fails, rage moments, boss fights |
| **clipability** | Standalone coherence, pacing, natural boundaries for short-form |
| **penalties** | Housekeeping chatter, donation reading, dead air, schedule talk |

See `ytclip-2-highlight-moments/references/highlight-evaluation-rubric.md` for the complete scoring criteria.

> The AI scoring results are for reference only. The best clips are always the moments you discover after watching the full stream — the ones you genuinely want to share. Be a clipper with heart, and help VTubing culture reach even further!
