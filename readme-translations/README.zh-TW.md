# ytclip — 烤肉剪輯小幫手

[English](../README.md) | **[繁體中文](README.zh-TW.md)** | [简体中文](README.zh-CN.md) | [日本語](README.jp.md)


用 AI 把 YouTube 直播錄影做成粉絲向 VTuber 烤肉精華，配上翻譯字幕。

這套工作流會幫你抓直播、找出最值得剪的片段、加快剪輯流程、把字幕精準對齊成品，再翻譯成其他語言，讓推的話語能帶著愛、熱情和效率傳到更遠的地方。

## 事前準備

開始前先把下面工具裝好，之後就能比較順地從直播一路做到可發布的烤肉精華。

### 1. yt-dlp（從 YouTube 下載影片）

**macOS（Homebrew）：**
```bash
brew install yt-dlp
```

**Windows（Scoop）：**
```bash
scoop install yt-dlp
```

**Windows（Chocolatey）：**
```bash
choco install yt-dlp
```

**跨平台（pip）：**
```bash
pip install yt-dlp
```

確認安裝成功：
```bash
yt-dlp --version
```

### 2. Bun（用來執行腳本的 JavaScript 執行環境）

**macOS / Linux：**
```bash
curl -fsSL https://bun.sh/install | bash
```

**Windows：**
```bash
powershell -c "irm bun.sh/install.ps1 | iex"
```

確認安裝成功：
```bash
bun --version
```

### 3. Claude Code（負責評分和翻譯的 AI 代理）

第 2 步和第 5 步會用到 AI 代理，幫你找出值得剪的片段並處理翻譯。這份 README 以 Anthropic 的 **Claude Code** 為例。

1. **建立 Anthropic 帳號** — 前往 [claude.ai](https://claude.ai) 註冊
2. **訂閱方案或 API 金鑰** — 使用 Claude Code 的 AI 模型需要有效訂閱或 API 金鑰，建議使用 Sonnet 4.6 模型。
3. **安裝 Claude Code：**
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```
4. **啟動：**
   ```bash
   claude
   ```

> **想用其他 AI 代理？** 只要你的 AI 代理看得懂第 2 步和第 5 步用到的 `SKILL.md` 與參考文件，就能照樣完成。

### 4. 剪輯軟體

你需要以下其中一套剪輯軟體：

| 軟體 | 平台 | 匯出格式 |
|------|------|----------|
| **Adobe Premiere Pro** | Mac / Windows | Final Cut Pro XML |
| **Final Cut Pro** | Mac | FCPXML |
| **DaVinci Resolve** | Mac / Windows / Linux | Final Cut Pro 7 XML |

不需要是專業剪輯師。只要會匯入影片、在時間軸裁切、匯出 XML 和影片就夠了。

---

## 工作流總覽

```
YouTube 網址
    │
    ▼
┌─────────────────────────┐
│ 第 0 步：下載錄影        │  yt-dlp
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│ 第 1 步：取得逐字稿      │  ytclip-1-transcript
└─────────────────────────┘
    │  SRT 檔案
    ▼
┌─────────────────────────┐
│ 第 2 步：找出值得剪      │  ytclip-2-highlight-moments (AI)
│          的片段          │
└─────────────────────────┘
    │  帶時間戳的 Markdown
    ▼
┌─────────────────────────┐
│ 第 3 步：剪輯精華        │  你的剪輯軟體
└─────────────────────────┘
    │  剪輯完成的時間軸 + XML 匯出
    ▼
┌─────────────────────────┐
│ 第 4 步：重新對齊字幕    │  ytclip-3-remap-srt
└─────────────────────────┘
    │  重新對齊的 SRT
    ▼
┌─────────────────────────┐
│ 第 5 步：翻譯字幕        │  ytclip-4-translate/ytclip-4-translate-* (AI)
└─────────────────────────┘
    │  翻譯後的 SRT
    ▼
┌─────────────────────────┐
│ 第 6 步：匯入並輸出      │  你的剪輯軟體
└─────────────────────────┘
    │
    ▼
  完成！帶字幕的成品影片
```

---

## 第 0 步 — 下載直播錄影

先替這次烤肉開一個專案資料夾：

```bash
mkdir ~/my-video && cd ~/my-video
```

用 yt-dlp 下載影片：

```bash
yt-dlp -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]' \
  -o 'raw-video.%(ext)s' \
  'https://www.youtube.com/watch?v=VIDEO_ID'
```

> **小提示：** 把 `VIDEO_ID` 換成這次要剪的直播影片 ID。網址記得用單引號包起來，避免 shell 出問題。

如果你只想先處理特定區段，例如 `1:00:00` 到 `2:30:00`：
```bash
yt-dlp --download-sections "*01:00:00-02:30:00" \
  -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]' \
  -o 'raw-video.%(ext)s' \
  'https://www.youtube.com/watch?v=VIDEO_ID'
```

現在你的資料夾長這樣：
```
~/my-video/
  raw-video.mp4
```

## 第 1 步 — 下載逐字稿

這一步會把 YouTube 上的字幕抓成 SRT，作為後續找片段、對字幕和翻譯的基礎。

```bash
bun ytclip-1-transcript/scripts/main.ts \
  'https://www.youtube.com/watch?v=VIDEO_ID' \
  --format srt \
  -o ~/my-video/transcript-en.srt
```

**想要其他語言的字幕**，如果原片本來就有提供，也可以直接抓那個版本：
```bash
# 先列出可用的語言
bun ytclip-1-transcript/scripts/main.ts 'https://www.youtube.com/watch?v=VIDEO_ID' --list

# 下載日文字幕
bun ytclip-1-transcript/scripts/main.ts 'https://www.youtube.com/watch?v=VIDEO_ID' \
  --format srt --languages ja -o ~/my-video/transcript-ja.srt
```

現在你的資料夾長這樣：
```
~/my-video/
  raw-video.mp4
  transcript-en.srt          ← 英文字幕，時間戳對應原始錄影
```

## 第 2 步 — 找出值得剪的片段（AI）

這一步分兩段：先把逐字稿切成區塊，再讓 AI 判斷哪些片段最適合做成粉絲向精華。

### 2a. 切分逐字稿

```bash
bun ytclip-2-highlight-moments/scripts/clip_candidates.ts \
  ~/my-video/transcript-en.srt \
  -o ~/my-video/chunks.json
```

**可選** — 如果你想優先找某種類型的亮點，可以先提示 AI 注意這些主題：
```bash
bun ytclip-2-highlight-moments/scripts/clip_candidates.ts \
  ~/my-video/transcript-en.srt \
  --focus 'announcement,new outfit' \
  -o ~/my-video/chunks.json
```

### 2b. 讓 AI 評估

打開 Claude Code（或你慣用的 AI 代理），在專案目錄下輸入：

> 讀取 `~/my-video/chunks.json`，按照 `ytclip-2-highlight-moments/references/highlight-evaluation-rubric.md` 中的評分標準，找出前 10-20 個最適合做成 VTuber 粉絲精華的片段。將結果存為 `~/my-video/highlight-moments.md`。

AI 會：
1. 先快速掃過所有區塊，找出粉絲最可能想剪、想轉、想分享的亮點
2. 從 8 個維度深入評估每個候選片段（搞笑、故事性、互動、社群、聯動、遊戲、可剪輯性、扣分項）
3. 輸出一份附上精確時間戳的 Markdown 排名清單

現在你的資料夾長這樣：
```
~/my-video/
  raw-video.mp4
  transcript-en.srt
  chunks.json                ← 預處理後的區塊
  highlight-moments.md           ← 排名後的精華候選片段
```

## 第 3 步 — 剪輯你的精華

打開剪輯軟體，把這份候選清單整理成你真正想發出去的版本。

### 匯入影片

| 軟體 | 匯入方式 |
|------|----------|
| **Premiere Pro** | 檔案 > 匯入（或直接拖進專案面板） |
| **Final Cut Pro** | 檔案 > 輸入 > 媒體 |
| **DaVinci Resolve** | 檔案 > 匯入 > 媒體（或直接拖進媒體池） |

### 剪輯片段

1. 打開 `highlight-moments.md` 查看時間戳與說明
2. 在時間軸上跳到對應的時間點
3. 切出你想保留的反應、公布、笑點、唱段、互動或情緒重點
4. 按照你想要的節奏排列片段
5. 微調長度、轉場與整體節奏

> **先不要加字幕** — 等下一步把字幕重新對齊後再處理。

### 匯出專案 XML

把時間軸匯出成 XML 檔案，這樣下一步才能讀取你的剪輯結果。

| 軟體 | XML 匯出方式 |
|------|--------------|
| **Premiere Pro** | 檔案 > 匯出 > Final Cut Pro XML |
| **Final Cut Pro** | 檔案 > 輸出 XML |
| **DaVinci Resolve** | 檔案 > 匯出 > 時間軸 > FCP 7 XML（或 FCPXML） |

存檔為 `~/my-video/export.xml`。

現在你的資料夾長這樣：
```
~/my-video/
  raw-video.mp4
  transcript-en.srt
  chunks.json
  highlight-moments.md
  export.xml                 ← 你的剪輯決策
```

## 第 4 步 — 把字幕對齊到剪輯時間軸

原始 SRT 的時間戳還是對應整場直播。這一步會把字幕重新對齊到你剪好的精華時間軸。

### 4a. 解析 XML 成片段清單

```bash
bun ytclip-3-remap-srt/scripts/parse_cuts.ts \
  ~/my-video/export.xml \
  --track 0 \
  -o ~/my-video/clip_manifest.json
```

> **注意：** `--track 0` 代表第一條影片軌。如果你的片段在其他軌道上，請改成對應的編號。

### 4b. 重新對齊 SRT

```bash
bun ytclip-3-remap-srt/scripts/remap_srt.ts \
  ~/my-video/transcript-en.srt \
  ~/my-video/clip_manifest.json \
  -o ~/my-video/transcript-en-remapped.srt \
  --gap 50
```

這會只保留實際出現在成品裡的字幕行，並把時間戳調整成符合你剪輯順序的版本。

現在你的資料夾長這樣：
```
~/my-video/
  raw-video.mp4
  transcript-en.srt
  chunks.json
  highlight-moments.md
  export.xml
  clip_manifest.json         ← 解析後的片段時間資料
  transcript-en-remapped.srt ← 對齊剪輯時間軸的字幕
```

## 第 5 步 — 翻譯字幕（AI）

現在把對齊好的字幕翻成目標語言，讓更多人看得懂推在說什麼。打開 Claude Code（或你慣用的 AI 代理）輸入：

**翻譯成繁體中文（台灣）：**
> 把 `~/my-video/transcript-en-remapped.srt` 翻譯成繁體中文（台灣），翻譯時請遵循 `ytclip-4-translate/ytclip-4-translate-zhtw/references/zh-tw-localization.md` 中的在地化規則。存檔為 `~/my-video/transcript-zhtw-remapped.srt`。

**翻譯成英文：**
> 把 `~/my-video/transcript-ja-remapped.srt` 翻譯成英文，並遵循 `ytclip-4-translate/ytclip-4-translate-en/references/en-localization.md` 中的在地化規則。存檔為 `~/my-video/transcript-en-remapped.srt`。

**翻譯成廣東話（香港）：**
> 把 `~/my-video/transcript-en-remapped.srt` 翻譯成廣東話（香港），並遵循 `ytclip-4-translate/ytclip-4-translate-zhhk/references/zhhk-localization.md` 中的在地化規則。存檔為 `~/my-video/transcript-zhhk-remapped.srt`。

**翻譯成簡體中文：**
> 把 `~/my-video/transcript-en-remapped.srt` 翻譯成簡體中文，並遵循 `ytclip-4-translate/ytclip-4-translate-zhcn/references/zhcn-localization.md` 中的在地化規則。存檔為 `~/my-video/transcript-zhcn-remapped.srt`。

**翻譯成日文：**
> 把 `~/my-video/transcript-en-remapped.srt` 翻譯成日文，並遵循 `ytclip-4-translate/ytclip-4-translate-jp/references/jp-localization.md` 中的在地化規則。存檔為 `~/my-video/transcript-ja-remapped.srt`。

AI 會直接讀取你的 SRT 檔案進行翻譯，整個流程可以維持得很輕。每個語言包都附上在地化規則，處理圈內用語、梗和社群語感。

### 可用的翻譯目標

| Skill 資料夾 | 目標語言 | 風格 |
|--------------|----------|------|
| `ytclip-4-translate/ytclip-4-translate-en` | English | 自然、適合烤肉的英文 |
| `ytclip-4-translate/ytclip-4-translate-zhtw` | 繁體中文（台灣） | 台灣 VTuber／烤肉圈語感 |
| `ytclip-4-translate/ytclip-4-translate-zhhk` | 繁體中文（香港） | 香港廣東話烤肉語感 |
| `ytclip-4-translate/ytclip-4-translate-zhcn` | 简体中文 | 簡中 VTuber／網路社群語感 |
| `ytclip-4-translate/ytclip-4-translate-jp` | 日本語 | VTuber／實況圈日文 |

## 第 6 步 — 匯入字幕並輸出成品

### 匯入翻譯後的 SRT

| 軟體 | SRT 匯入方式 |
|------|--------------|
| **Premiere Pro** | 檔案 > 匯入 > 選擇 `.srt` 檔案，然後拖到字幕軌 |
| **Final Cut Pro** | 檔案 > 輸入 > 字幕，選擇 `.srt` 檔案 |
| **DaVinci Resolve** | 檔案 > 匯入 > 字幕，選擇 `.srt` 檔案，拖到字幕軌 |

字幕現在應該能準確對上你剪好的片段。

### 調整字幕樣式（選用）

- **Premiere Pro：** 在「基本圖形」面板中選取字幕，可以調整字型、大小、顏色和位置
- **Final Cut Pro：** 選取字幕片段，在檢閱器面板中調整
- **DaVinci Resolve：** 到 Fusion 或 Edit 頁面調整字幕外觀

### 輸出最終影片

照平常的方式輸出就好。如果影片準備直接發布，通常建議燒字幕；如果還想保留彈性，也可以輸出獨立字幕軌。

| 軟體 | 輸出方式 |
|------|----------|
| **Premiere Pro** | 檔案 > 匯出 > 媒體。在「字幕」選項中選擇「將字幕燒錄至影片」或「建立側車檔案」 |
| **Final Cut Pro** | 檔案 > 分享 > 主檔案（或你偏好的預設）。字幕會自動包含在內 |
| **DaVinci Resolve** | 交付頁面 > 設定格式與編碼器。在「字幕」選項中選擇「匯出字幕」來燒錄 |

---

## 最終專案資料夾

```
~/my-video/
  raw-video.mp4                    原始直播錄影
  transcript-en.srt                字幕原稿（完整直播時間軸）
  chunks.json                      給 AI 評估的逐字稿區塊
  highlight-moments.md                 排名後的精華候選片段
  export.xml                       剪輯時間軸匯出
  clip_manifest.json               解析後的剪輯時間資料
  transcript-en-remapped.srt       對齊成品的字幕
  transcript-zhtw-remapped.srt     翻譯完成、可直接匯入的字幕
```

## 專案結構

```
ytclip-1-transcript/            從 YouTube 抓字幕成 SRT
ytclip-2-highlight-moments/         AI 評估值得剪的亮點 → Markdown
ytclip-3-remap-srt/             把字幕重新對齊到剪好的片段
ytclip-4-translate/ytclip-4-translate-en/          AI 翻譯 → 英文
ytclip-4-translate/ytclip-4-translate-zhtw/        AI 翻譯 → 繁體中文（台灣）
ytclip-4-translate/ytclip-4-translate-zhhk/        AI 翻譯 → 廣東話（香港）
ytclip-4-translate/ytclip-4-translate-zhcn/        AI 翻譯 → 簡體中文
ytclip-4-translate/ytclip-4-translate-jp/          AI 翻譯 → 日文
```

## 評分參考

第 2 步中的 AI 會從 8 個維度評估逐字稿區塊，篩出最值得剪、翻、分享的片段：

| 維度 | 偵測內容 |
|------|----------|
| **funny（搞笑）** | 喜劇品質、反應強度、笑點節奏、荒謬程度 |
| **story（故事性）** | 敘事鉤子、鋪陳/發展/收尾、反轉、出人意料的爆料 |
| **engagement（互動）** | 實況主主動表演、把精力導向觀眾 |
| **community（社群）** | 粉絲社群共鳴、內梗、迷因潛力、宅文化 |
| **collab（聯動）** | 跨頻道合作、VTuber 互動、箱內動態 |
| **gaming（遊戲）** | 神操作、史詩級失誤、暴怒時刻、打 Boss |
| **clipability（可剪輯性）** | 片段獨立性、節奏感、自然的起止點 |
| **penalties（扣分項）** | 日常閒聊、讀 SC、冷場、排程公告 |

完整評分標準請見 `ytclip-2-highlight-moments/references/highlight-evaluation-rubric.md`。
