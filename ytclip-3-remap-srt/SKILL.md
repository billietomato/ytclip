---
name: ytclip-3-remap-srt
description: "Step 3 of ytclip pipeline: Remap SRT subtitles from original VOD timestamps to an edited Premiere Pro / Final Cut Pro timeline. Input: project XML + SRT. Output: Remapped SRT file."
---

# ytclip-3-remap-srt

Remap subtitle timestamps from a full VOD timeline to an edited Premiere Pro or Final Cut Pro sequence timeline.

## Runtime

Resolve `BUN_X` in this order:
1. `bun`
2. `npx -y bun`
3. If neither exists, ask user to install Bun.

Use `{baseDir}` as this skill directory.

## Scripts

- `scripts/parse_cuts.ts`: Parse Premiere/FCP XML export into `clip_manifest.json`.
- `scripts/export_cuts.jsx`: Run inside Premiere ExtendScript to export `clip_manifest.json` directly.
- `scripts/remap_srt.ts`: Remap subtitle timing from VOD timeline to sequence timeline.

## Input

- A Premiere Pro / Final Cut Pro XML export file
- The original SRT transcript file

## Output

- A remapped SRT file with timestamps matching the edited sequence timeline

## Workflow

### 1. Export clip manifest from your editor

**Option A — FCP7 XML export (recommended):**
1. In Premiere: File > Export > Final Cut Pro XML
2. Parse the XML:
```bash
${BUN_X} {baseDir}/scripts/parse_cuts.ts <export.xml> --track 0 -o clip_manifest.json
```

**Option B — ExtendScript (inside Premiere):**
1. Run `scripts/export_cuts.jsx` in Premiere's ExtendScript console
2. Outputs `clip_manifest.json` next to the `.prproj` file

### 2. Remap SRT to edited timeline

```bash
${BUN_X} {baseDir}/scripts/remap_srt.ts <transcript.srt> <clip_manifest.json> -o <output.srt> --gap 50
```

### 3. Review gaps

After remapping, check the clip manifest for gaps in the sequence timeline (where `sequenceOut` of clip N does not equal `sequenceIn` of clip N+1, with a tolerance of >1 second).

Report any gaps to the user:
```
Gap detected: 35.6s – 54.8s (19.2s) — no transcript content for this section.
You may need to add subtitles manually for this part of the video.
```

This helps the user identify sections of the edited video where the source transcript has no coverage (e.g., inserted media, B-roll, or segments where the original audio was unclear).

## Notes

- Cues outside kept clips are dropped
- Cues crossing clip boundaries are split and remapped per clip segment
- Does not support speed-ramped clips or time remapping
- XML parsing defaults to video track 0; change with `--track`
