---
name: ytclip-1-transcript
description: "Step 1 of ytclip pipeline: Download full YouTube transcript as SRT file. Input: YouTube URL. Output: SRT file with accurate timestamps."
---

# ytclip-1-transcript

Download a YouTube video's transcript and export it as an SRT subtitle file.

## Runtime

Resolve `BUN_X` in this order:
1. `bun`
2. `npx -y bun`
3. If neither exists, ask user to install Bun.

Use `{baseDir}` as this skill directory.

## Script

- `scripts/main.ts`: YouTube InnerTube transcript downloader + formatter + cache.

## Input

- A YouTube video URL or video ID

## Output

- An SRT file with accurate timestamps (`transcript.srt`)

## Standard Commands

Always single-quote YouTube URLs in zsh.

Download full transcript as SRT:
```bash
${BUN_X} {baseDir}/scripts/main.ts '<youtube-url>' --format srt
```

Save to a specific path:
```bash
${BUN_X} {baseDir}/scripts/main.ts '<youtube-url>' --format srt -o ~/my-video/transcript-en.srt
```

List available transcript languages:
```bash
${BUN_X} {baseDir}/scripts/main.ts '<youtube-url>' --list
```

Download with language preference:
```bash
${BUN_X} {baseDir}/scripts/main.ts '<youtube-url>' --format srt --languages en,zh,ja
```

Download a section (timestamps rebased to 00:00:00, syncs with yt-dlp `--download-sections`):
```bash
${BUN_X} {baseDir}/scripts/main.ts '<youtube-url>' --format srt --section '01:00:00-02:30:00' -o ~/my-video/transcript-en.srt
```

## Quality Requirements

- Output full transcript, not summary.
- SRT output is automatically retimed: raw YouTube blocks are re-segmented at natural sentence boundaries, capped at 10 words per line, with silence gaps (>400ms) respected and short fragments merged.
- Prefer source-language transcript before translated transcript when fidelity matters.

## Error Mapping

- `Transcripts disabled`: captions unavailable.
- `No transcript found`: language not provided by video.
- `Video unavailable`: private/deleted/blocked.
- `IP blocked`/`429`: retry later.
- `Age restricted`: authenticated context needed.
