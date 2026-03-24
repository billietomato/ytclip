---
name: ytclip-5-proofread-zhtw
description: "Step 6 of ytclip pipeline: AI agent proofreads a zh-TW SRT file and reports confirmed typos. Input: zh-TW SRT file. Output: list of confirmed typos with line numbers."
---

# ytclip-5-proofread-zhtw

Proofread a Traditional Chinese (Taiwan) SRT subtitle file and report confirmed typos. This skill only flags real typos — wrong characters, broken words, or clearly incorrect text. It does NOT suggest stylistic changes, alternative phrasing, or minor improvements.

## Input

- An SRT subtitle file in Traditional Chinese (Taiwan)

## Output

- A list of confirmed typos found in the SRT file, each with:
  - SRT block number
  - The original line containing the typo
  - The specific typo and what it should be
- If no typos are found, report that the file is clean.

## Workflow

Read the input SRT file and scan every subtitle text line for typos.

**What counts as a typo (report these):**
- Wrong character that changes meaning (e.g., 以 vs 已, 在 vs 再, 的 vs 得 vs 地)
- Garbled or broken characters from encoding issues
- Clearly misspelled loanwords or proper nouns
- Repeated characters that are obviously unintentional (e.g., 我我去)
- Missing or extra characters that break the sentence

**What does NOT count as a typo (do NOT report these):**
- Stylistic preferences (e.g., preferring one synonym over another)
- Punctuation style choices
- Tone or register differences
- Sentence structure suggestions
- Anything that is a valid, intentional choice by the translator

Print the results to the console. If the user specifies an output path, also save the report there.
