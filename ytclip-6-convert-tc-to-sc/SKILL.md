---
name: ytclip-6-convert-tc-to-sc
description: "Step 7 of ytclip pipeline: script converts a zh-TW SRT file from Traditional Chinese to Simplified Chinese characters. No AI — direct character conversion. Input: zh-TW SRT. Output: zh-CN SRT."
---

# ytclip-6-convert-tc-to-sc

Convert a Traditional Chinese (zh-TW) SRT subtitle file to Simplified Chinese (zh-CN) by direct character conversion. This is a non-AI script — it performs mechanical character mapping only, with no rephrasing or localization.

## Input

- An SRT subtitle file in Traditional Chinese

## Output

- An SRT file with all Traditional Chinese characters converted to Simplified Chinese

## Workflow

Run the conversion script:

```bash
bun ytclip-6-convert-tc-to-sc/scripts/convert.ts \
  <input-zhtw.srt> \
  -o <output-zhcn.srt>
```

The script:
1. Reads the input SRT file
2. Preserves all SRT block numbering and timestamp lines exactly as-is
3. Converts only the subtitle text lines from Traditional to Simplified Chinese
4. Writes the result to the output path

This is a pure character conversion — it does NOT adapt terminology, slang, or phrasing for mainland usage. For that, you would need a separate localization pass.
