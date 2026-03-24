# ytclip — Fansub Clipping Helper

**[English](README.en.md)** | [繁體中文](../README.md) | [简体中文](README.zh-CN.md) | [日本語](README.jp.md)


Make fanmade VTuber clips from YouTube VODs with translated subtitles, assisted by AI agent skills.

This workflow helps you pull streams, spot the most interesting moments, edit faster, remap subtitles to your cut, and translate them for viewers in other languages, so your oshi's words can travel further with love, passion, and efficiency.

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

Steps 2 and 5 use an AI agent to find interesting moments and handle translation. This README uses **Claude Code** as the example.

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

> **Using a different AI agent?** If it can follow the `SKILL.md` files and reference docs used in Steps 2 and 5, it can do the same job.

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
┌───────────────────────────┐
│ Step 0: Download VOD      │  yt-dlp
└───────────────────────────┘
    │
    ▼
┌───────────────────────────┐
│ Step 1: Get transcript    │  ytclip-1-transcript
└───────────────────────────┘
    │  SRT file
    ▼
┌───────────────────────────┐
│ Step 2: Find interesting  │  ytclip-2-highlight-moments (AI)
│         moments           │
└───────────────────────────┘
    │  Markdown with timestamps
    ▼
┌───────────────────────────┐
│ Step 3: Edit clips        │  Your video editor
└───────────────────────────┘
    │  Edited timeline + XML export
    ▼
┌───────────────────────────┐
│ Step 4: Remap subtitles   │  ytclip-3-remap-srt
└───────────────────────────┘
    │  Remapped SRT
    ▼
┌───────────────────────────┐
│ Step 5: Translate         │  ytclip-4-translate/ytclip-4-translate-* (AI)
└───────────────────────────┘
    │  Translated SRT
    ▼
┌───────────────────────────┐
│ Step 6: Import & export   │  Your video editor
└───────────────────────────┘
    │
    ▼
  Final video with subtitles
```

---

## Step 0 — Download the VOD

Download the video using yt-dlp:

```bash
yt-dlp -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]' \
  -o 'raw-video.%(ext)s' \
  'https://www.youtube.com/watch?v=VIDEO_ID'
```

> **Tip:** Replace `VIDEO_ID` with the stream's actual video ID. Keep the URL in single quotes to avoid shell issues.

If you only want a specific section to work from, for example `1:00:00` to `2:30:00`:
```bash
yt-dlp --download-sections "*01:00:00-02:30:00" \
  -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]' \
  -o 'raw-video.%(ext)s' \
  'https://www.youtube.com/watch?v=VIDEO_ID'
```

Your folder now looks like:
```
my-video/
  raw-video.mp4
```

## Step 1 — Download the Transcript

Pull the video's subtitles from YouTube as an SRT file. This becomes the base for scoring, clipping, and translation.

```bash
bun ytclip-1-transcript/scripts/main.ts \
  'https://www.youtube.com/watch?v=VIDEO_ID' \
  --format srt \
  -o my-video/transcript-en.srt
```

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
  transcript-en.srt          ← English subtitles with VOD timestamps
```

## Step 2 — Find Interesting Moments (AI)

This is a two-part pass: first a script chunks the transcript, then an AI agent identifies the most interesting moments for a fanmade clip.

### 2a. Chunk the transcript

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

### 2b. Ask the AI to evaluate

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
  highlight-moments.md           ← Ranked clip candidates with timestamps
```

## Step 3 — Edit Your Clips (DIY!)

Open your video editor and turn the shortlist into the cuts you actually want to post.

### Import the video

| Editor | How to import |
|--------|---------------|
| **Premiere Pro** | File > Import (or drag into Project panel) |
| **Final Cut Pro** | File > Import > Media |
| **DaVinci Resolve** | File > Import > Media (or drag into Media Pool) |

### Cut your clips

1. Open `highlight-moments.md` and review the timestamps and notes
2. Jump to each moment in your editor's timeline
3. Cut the parts you want to keep, such as reactions, reveals, jokes, announcements, songs, or emotional beats
4. Arrange the clips on your timeline in the order you want
5. Tighten pacing and transitions as needed

> **Do not add subtitles yet** — line them up after remapping in the next step.

### Export the project XML

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

## Step 4 — Remap Subtitles to Your Edit

Your original SRT still matches the full stream. This step remaps it to the timing of your edited clip.

### 4a. Parse the XML into a clip manifest

```bash
bun ytclip-3-remap-srt/scripts/parse_cuts.ts \
  my-video/export.xml \
  --track 0 \
  -o my-video/clip_manifest.json
```

> **Note:** `--track 0` means the first video track. If your clips are on a different track, change the number.

### 4b. Remap the SRT

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
  raw-video.mp4
  transcript-en.srt
  chunks.json
  highlight-moments.md
  export.xml
  clip_manifest.json         ← Parsed clip timing
  transcript-en-remapped.srt ← Subtitles matching your edit
```

## Step 5 — Translate Subtitles (AI)

Now translate the remapped subtitles into the language your audience needs. Open Claude Code (or your AI agent) and ask:

**Translate to Traditional Chinese (Taiwan):**
> Use ytclip-4-translate-zhtw skill. Translate `my-video/transcript-en-remapped.srt` to zh-TW following the localization rules in `ytclip-4-translate/ytclip-4-translate-zhtw/references/zh-tw-localization.md`. Save as `my-video/transcript-zhtw-remapped.srt`.

**Translate to English:**
> Use ytclip-4-translate-en skill. Translate `my-video/transcript-ja-remapped.srt` to English following the localization rules in `ytclip-4-translate/ytclip-4-translate-en/references/en-localization.md`. Save as `my-video/transcript-en-remapped.srt`.

**Translate to Cantonese (Hong Kong):**
> Use ytclip-4-translate-zhhk skill. Translate `my-video/transcript-en-remapped.srt` to Cantonese following the localization rules in `ytclip-4-translate/ytclip-4-translate-zhhk/references/zhhk-localization.md`. Save as `my-video/transcript-zhhk-remapped.srt`.

**Translate to Simplified Chinese:**
> Use ytclip-4-translate-zhcn skill. Translate `my-video/transcript-en-remapped.srt` to zh-CN following the localization rules in `ytclip-4-translate/ytclip-4-translate-zhcn/references/zhcn-localization.md`. Save as `my-video/transcript-zhcn-remapped.srt`.

**Translate to Japanese:**
> Use ytclip-4-translate-jp skill. Translate `my-video/transcript-en-remapped.srt` to Japanese following the localization rules in `ytclip-4-translate/ytclip-4-translate-jp/references/jp-localization.md`. Save as `my-video/transcript-ja-remapped.srt`.

The AI reads your SRT directly, so the workflow stays lightweight. Each language pack includes localization rules for fan terminology, in-jokes, and community tone.

### Available translation targets

| Skill folder | Target language | Style |
|-------------|-----------------|-------|
| `ytclip-4-translate/ytclip-4-translate-en` | English | Fansub-ready conversational English |
| `ytclip-4-translate/ytclip-4-translate-zhtw` | 繁體中文 (台灣) | Taiwan VTuber and fansub community tone |
| `ytclip-4-translate/ytclip-4-translate-zhhk` | 繁體中文 (香港) | Hong Kong Cantonese fansub tone |
| `ytclip-4-translate/ytclip-4-translate-zhcn` | 简体中文 | Mainland VTuber and internet community tone |
| `ytclip-4-translate/ytclip-4-translate-jp` | 日本語 | VTuber and streaming community Japanese |

## Step 6 — Import Subtitles and Export

### Import the translated SRT

| Editor | How to import SRT |
|--------|-------------------|
| **Premiere Pro** | File > Import > select the `.srt` file, then drag it onto a captions track |
| **Final Cut Pro** | File > Import > Captions, select the `.srt` file |
| **DaVinci Resolve** | File > Import > Subtitle, select the `.srt` file, drag to subtitle track |

The subtitles should now line up cleanly with your edited clip.

### Style your subtitles (optional)

- **Premiere Pro:** Select captions in the Essential Graphics panel to change font, size, color, and position
- **Final Cut Pro:** Select caption clips and adjust in the Inspector panel
- **DaVinci Resolve:** Go to the Fusion or Edit page to style subtitle appearance

### Export the final video

Export your video as usual. Burn subtitles in if the clip is ready to post, or keep them as a separate track if you still want flexibility.

| Editor | How to export |
|--------|---------------|
| **Premiere Pro** | File > Export > Media. Under Captions, choose "Burn Captions Into Video" or "Create Sidecar File" |
| **Final Cut Pro** | File > Share > Master File (or your preferred preset). Captions are included automatically |
| **DaVinci Resolve** | Deliver page > set format and codec. Under Subtitle, choose "Export Subtitle" to burn in |

---

## Final Project Folder

```
my-video/
  raw-video.mp4                    Original stream archive
  transcript-en.srt                Source subtitles (full-stream timeline)
  chunks.json                      Transcript chunks for AI review
  highlight-moments.md                 Ranked clip shortlist with timestamps
  export.xml                       Editor timeline export
  clip_manifest.json               Parsed cut timing data
  transcript-en-remapped.srt       Subtitles aligned to your cut
  transcript-zhtw-remapped.srt     Translated subtitles ready to import
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
├── ytclip-4-translate/                  AI subtitle translation (multi-language)
│   ├── ytclip-4-translate-en/           → English
│   │   ├── SKILL.md
│   │   └── references/en-localization.md
│   ├── ytclip-4-translate-zhtw/         → Traditional Chinese (Taiwan)
│   │   ├── SKILL.md
│   │   └── references/zh-tw-localization.md
│   ├── ytclip-4-translate-zhhk/         → Cantonese (Hong Kong)
│   │   ├── SKILL.md
│   │   └── references/zhhk-localization.md
│   ├── ytclip-4-translate-zhcn/         → Simplified Chinese
│   │   ├── SKILL.md
│   │   └── references/zhcn-localization.md
│   └── ytclip-4-translate-jp/           → Japanese
│       ├── SKILL.md
│       └── references/jp-localization.md
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
