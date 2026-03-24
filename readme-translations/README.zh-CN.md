# ytclip — 烤肉剪辑小帮手

[English](README.en.md) | [繁體中文](../README.md) | **[简体中文](README.zh-CN.md)** | [日本語](README.jp.md)


使用 AI Agent Skills 辅助，从 YouTube 直播录像剪出粉丝向 VTuber 烤肉切片，并配上翻译字幕。

这套工作流可以帮你抓直播、找出有趣片段、加快剪辑流程、把字幕精准对齐到成片上，再翻译成其他语言，让推的话语带着爱、热情和效率传到更远的地方。

## 准备工作

开始前先把下面工具装好，这样从直播到可发布的烤肉切片会顺很多。

### 1. yt-dlp（从 YouTube 下载视频）

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

**全平台 (pip):**
```bash
pip install yt-dlp
```

验证安装：
```bash
yt-dlp --version
```

### 2. Bun（运行脚本的 JavaScript 运行时）

**macOS / Linux:**
```bash
curl -fsSL https://bun.sh/install | bash
```

**Windows:**
```bash
powershell -c "irm bun.sh/install.ps1 | iex"
```

验证安装：
```bash
bun --version
```

### 3. Claude Code（用于评分和翻译的 AI 代理）

第 2 步和第 5 步会用到 AI 代理，帮你找出有趣片段并处理翻译。这份 README 以 Anthropic 的 **Claude Code** 为例。

1. **注册 Anthropic 账号** — 前往 [claude.ai](https://claude.ai) 注册
2. **订阅计划或 API 密钥** — 使用 Claude Code 的 AI 模型需要有效订阅或 API 密钥，建议使用 Sonnet 4.6 模型。
3. **安装 Claude Code：**
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```
4. **启动：**
   ```bash
   claude
   ```

> **使用其他 AI 代理？** 只要你的 AI 代理看得懂第 2 步和第 5 步用到的 `SKILL.md` 和参考文档，也能照样完成。

### 4. 视频编辑软件

你需要以下其中一款视频编辑软件来剪辑切片：

| 编辑软件 | 平台 | 导出格式 |
|--------|----------|---------------|
| **Adobe Premiere Pro** | Mac / Windows | Final Cut Pro XML |
| **Final Cut Pro** | Mac | FCPXML |
| **DaVinci Resolve** | Mac / Windows / Linux | Final Cut Pro 7 XML |

不需要是专业剪辑师。只要会导入视频、在时间轴裁切、导出 XML 和视频就够了。

---

## 开始使用

### 获取项目

```bash
git clone https://github.com/billietomato/ytclip.git
cd ytclip
```

### 管理你的工作文件夹

建议在 repo 根目录下为每个视频项目建立专用文件夹。所有脚本都从 repo 根目录以相对路径运行，这样最方便。

```bash
mkdir my-video
```

> **提示：** 视频文件和工作产物不需要被 git 追踪。建议将工作文件夹加到 `.gitignore`：
> ```bash
> echo 'my-video/' >> .gitignore
> ```

---

## 工作流总览

```
YouTube URL
    │
    ▼
┌───────────────────────────┐
│ 第 0 步：下载录像           │  yt-dlp
└───────────────────────────┘
    │
    ▼
┌───────────────────────────┐
│ 第 1 步：获取字幕           │  ytclip-1-transcript
└───────────────────────────┘
    │  SRT 文件
    ▼
┌───────────────────────────┐
│ 第 2 步：找出有趣片段        │  ytclip-2-highlight-moments (AI)
└───────────────────────────┘
    │  带时间戳的 Markdown
    ▼
┌───────────────────────────┐
│ 第 3 步：剪辑切片           │  你的视频编辑软件
└───────────────────────────┘
    │  剪辑后的时间轴 + XML 导出
    ▼
┌───────────────────────────┐
│ 第 4 步：重映射字幕         │  ytclip-3-remap-srt
└───────────────────────────┘
    │  重映射后的 SRT
    ▼
┌───────────────────────────┐
│ 第 5 步：翻译字幕           │  ytclip-4-translate/ytclip-4-translate-* (AI)
└───────────────────────────┘
    │  翻译后的 SRT
    ▼
┌───────────────────────────┐
│ 第 6 步：导入并导出         │  你的视频编辑软件
└───────────────────────────┘
    │
    ▼
  带字幕的最终视频
```

---

## 第 0 步 — 下载录像

使用 yt-dlp 下载视频：

```bash
yt-dlp -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]' \
  -o 'raw-video.%(ext)s' \
  'https://www.youtube.com/watch?v=VIDEO_ID'
```

> **提示：** 将 `VIDEO_ID` 替换成这次要剪的直播视频 ID。URL 一定要用单引号包裹，避免 shell 解析问题。

如果你只想先处理特定区段，例如 `1:00:00` 到 `2:30:00`：
```bash
yt-dlp --download-sections "*01:00:00-02:30:00" \
  -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]' \
  -o 'raw-video.%(ext)s' \
  'https://www.youtube.com/watch?v=VIDEO_ID'
```

现在你的文件夹长这样：
```
my-video/
  raw-video.mp4
```

## 第 1 步 — 下载字幕

这一步会把 YouTube 上的字幕抓成 SRT，作为后续找片段、对字幕和翻译的基础。

```bash
bun ytclip-1-transcript/scripts/main.ts \
  'https://www.youtube.com/watch?v=VIDEO_ID' \
  --format srt \
  -o my-video/transcript-en.srt
```

**选择其他语言**，如果原片本来就有你想用的字幕版本，也可以直接抓那个：
```bash
# 先查看可用的字幕语言
bun ytclip-1-transcript/scripts/main.ts 'https://www.youtube.com/watch?v=VIDEO_ID' --list

# 下载日语字幕
bun ytclip-1-transcript/scripts/main.ts 'https://www.youtube.com/watch?v=VIDEO_ID' \
  --format srt --languages ja -o my-video/transcript-ja.srt
```

现在你的文件夹长这样：
```
my-video/
  raw-video.mp4
  transcript-en.srt          ← 带录像时间戳的英文字幕
```

## 第 2 步 — 找出有趣片段（AI）

这一步分两段：先把字幕切成区块，再让 AI 找出最有趣的片段。

### 2a. 分块字幕

```bash
bun ytclip-2-highlight-moments/scripts/clip_candidates.ts \
  my-video/transcript-en.srt \
  -o my-video/chunks.json
```

**可选** — 如果你想优先找某类亮点，可以先提示 AI 注意这些主题：
```bash
bun ytclip-2-highlight-moments/scripts/clip_candidates.ts \
  my-video/transcript-en.srt \
  --focus 'announcement,new outfit' \
  -o my-video/chunks.json
```

### 2b. 让 AI 进行评估

在本项目目录下打开 Claude Code（或你的 AI 代理），输入：

> Use ytclip-2-highlight-moments skill. 读取 `my-video/chunks.json`，按照 `ytclip-2-highlight-moments/references/highlight-evaluation-rubric.md` 中的评分标准，找出前 10-20 个最适合做成 VTuber 粉丝向切片的片段。结果保存为 `my-video/highlight-moments.md`。

AI 会：
1. 先快速扫过所有区块，找出粉丝最可能想剪、想转、想分享的亮点
2. 从 8 个维度（搞笑、叙事、互动、社区、联动、游戏、可切片性、扣分项）深度评估每个候选片段
3. 输出一份附带精确时间戳的 Markdown 排名清单

现在你的文件夹长这样：
```
my-video/
  raw-video.mp4
  transcript-en.srt
  chunks.json                ← 预处理后的字幕分块
  highlight-moments.md           ← 排名后的精华候选片段
```

## 第 3 步 — 剪辑你的切片（自己来！）

打开视频编辑软件，把这份候选清单整理成你真正想发出去的版本。

### 导入视频

| 编辑软件 | 导入方式 |
|--------|---------------|
| **Premiere Pro** | 文件 > 导入（或拖入项目面板） |
| **Final Cut Pro** | 文件 > 导入 > 媒体 |
| **DaVinci Resolve** | 文件 > 导入 > 媒体（或拖入媒体池） |

### 剪切片段

1. 打开 `highlight-moments.md` 查看时间戳和说明
2. 在时间轴中跳到对应的位置
3. 切出你想保留的反应、公布、笑点、唱段、互动或情绪重点
4. 按你想要的节奏排列切片
5. 微调长度、转场和整体节奏

> **先别加字幕** — 等下一步把字幕重新对齐后再处理。

### 导出项目 XML

把时间轴导出成 XML 文件，这样下一步才能读取你的剪辑结果。

| 编辑软件 | XML 导出方式 |
|--------|-------------------|
| **Premiere Pro** | 文件 > 导出 > Final Cut Pro XML |
| **Final Cut Pro** | 文件 > 导出 XML |
| **DaVinci Resolve** | 文件 > 导出 > 时间轴 > FCP 7 XML（或 FCPXML） |

保存为 `my-video/export.xml`。

现在你的文件夹长这样：
```
my-video/
  raw-video.mp4
  transcript-en.srt
  chunks.json
  highlight-moments.md
  export.xml                 ← 你的剪辑信息
```

## 第 4 步 — 将字幕重映射到剪辑后的时间轴

原始 SRT 的时间戳还对应整场直播。这一步会把字幕重新对齐到你剪好的切片时间轴。

### 4a. 解析 XML 生成切片清单

```bash
bun ytclip-3-remap-srt/scripts/parse_cuts.ts \
  my-video/export.xml \
  --track 0 \
  -o my-video/clip_manifest.json
```

> **注意：** `--track 0` 表示第一条视频轨道。如果你的切片在其他轨道上，请修改该数字。

### 4b. 重映射 SRT

```bash
bun ytclip-3-remap-srt/scripts/remap_srt.ts \
  my-video/transcript-en.srt \
  my-video/clip_manifest.json \
  -o my-video/transcript-en-remapped.srt \
  --gap 50
```

这会只保留实际出现在成片里的字幕行，并把时间戳调整成符合你剪辑顺序的版本。

现在你的文件夹长这样：
```
my-video/
  raw-video.mp4
  transcript-en.srt
  chunks.json
  highlight-moments.md
  export.xml
  clip_manifest.json         ← 解析后的切片时间数据
  transcript-en-remapped.srt ← 匹配剪辑后时间轴的字幕
```

## 第 5 步 — 翻译字幕（AI）

现在把对齐好的字幕翻成目标语言，让更多人听懂推在说什么。打开 Claude Code（或你的 AI 代理），输入：

**翻译为简体中文：**
> Use ytclip-4-translate-zhcn skill. 将 `my-video/transcript-en-remapped.srt` 按照 `ytclip-4-translate/ytclip-4-translate-zhcn/references/zhcn-localization.md` 中的本地化规则翻译为简体中文。保存为 `my-video/transcript-zhcn-remapped.srt`。

**翻译为繁体中文（台湾）：**
> Use ytclip-4-translate-zhtw skill. 将 `my-video/transcript-en-remapped.srt` 翻译为繁体中文（台湾），并遵循 `ytclip-4-translate/ytclip-4-translate-zhtw/references/zh-tw-localization.md` 中的本地化规则。保存为 `my-video/transcript-zhtw-remapped.srt`。

**翻译为英文：**
> Use ytclip-4-translate-en skill. 将 `my-video/transcript-ja-remapped.srt` 翻译为英文，并遵循 `ytclip-4-translate/ytclip-4-translate-en/references/en-localization.md` 中的本地化规则。保存为 `my-video/transcript-en-remapped.srt`。

**翻译为粤语（香港）：**
> Use ytclip-4-translate-zhhk skill. 将 `my-video/transcript-en-remapped.srt` 翻译为粤语（香港），并遵循 `ytclip-4-translate/ytclip-4-translate-zhhk/references/zhhk-localization.md` 中的本地化规则。保存为 `my-video/transcript-zhhk-remapped.srt`。

**翻译为日语：**
> Use ytclip-4-translate-jp skill. 将 `my-video/transcript-en-remapped.srt` 翻译为日语，并遵循 `ytclip-4-translate/ytclip-4-translate-jp/references/jp-localization.md` 中的本地化规则。保存为 `my-video/transcript-ja-remapped.srt`。

AI 会直接读取你的 SRT 文件来完成翻译，整个流程可以保持得很轻。每个语言包都附带本地化规则，处理圈内用语、梗和社区语感。

### 可用的翻译目标

| 技能文件夹 | 目标语言 | 风格 |
|-------------|-----------------|-------|
| `ytclip-4-translate/ytclip-4-translate-en` | English | 自然、适合烤肉的英文 |
| `ytclip-4-translate/ytclip-4-translate-zhtw` | 繁體中文 (台灣) | 台湾 VTuber / 烤肉圈语感 |
| `ytclip-4-translate/ytclip-4-translate-zhhk` | 繁體中文 (香港) | 香港粤语烤肉语感 |
| `ytclip-4-translate/ytclip-4-translate-zhcn` | 简体中文 | 简中 VTuber / 网络社区语感 |
| `ytclip-4-translate/ytclip-4-translate-jp` | 日本語 | VTuber / 直播圈日语 |

## 第 6 步 — 导入字幕并导出成品

### 导入翻译后的 SRT

| 编辑软件 | SRT 导入方式 |
|--------|-------------------|
| **Premiere Pro** | 文件 > 导入 > 选择 `.srt` 文件，然后拖到字幕轨道上 |
| **Final Cut Pro** | 文件 > 导入 > 字幕，选择 `.srt` 文件 |
| **DaVinci Resolve** | 文件 > 导入 > 字幕，选择 `.srt` 文件，拖到字幕轨道 |

字幕现在应该能准确对上你剪好的切片。

### 设置字幕样式（可选）

- **Premiere Pro：** 在基本图形面板中选中字幕，修改字体、大小、颜色和位置
- **Final Cut Pro：** 选中字幕片段，在检查器面板中调整
- **DaVinci Resolve：** 进入 Fusion 或编辑页面来调整字幕样式

### 导出最终视频

按平时的方式导出就行。如果视频准备直接发布，通常建议烧字幕；如果还想保留弹性，也可以导出独立字幕轨。

| 编辑软件 | 导出方式 |
|--------|---------------|
| **Premiere Pro** | 文件 > 导出 > 媒体。在字幕选项中选择"将字幕烧录到视频中"或"创建附属文件" |
| **Final Cut Pro** | 文件 > 共享 > 母版文件（或你偏好的预设）。字幕会自动包含在内 |
| **DaVinci Resolve** | 交付页面 > 设置格式和编码。在字幕选项中选择"导出字幕"以烧录 |

---

## 最终项目文件夹

```
my-video/
  raw-video.mp4                    原始直播录像
  transcript-en.srt                字幕原稿（完整直播时间轴）
  chunks.json                      给 AI 评估的字幕区块
  highlight-moments.md                 排名后的精华候选片段
  export.xml                       剪辑时间轴导出
  clip_manifest.json               解析后的剪辑时间数据
  transcript-en-remapped.srt       对齐成片的字幕
  transcript-zhtw-remapped.srt     翻译完成、可直接导入的字幕
```

## 项目结构

```
ytclip/
├── ytclip-1-transcript/                 从 YouTube 抓字幕成 SRT
│   └── scripts/main.ts
├── ytclip-2-highlight-moments/          AI 找出有趣片段 → Markdown
│   ├── scripts/clip_candidates.ts
│   └── references/
│       └── highlight-evaluation-rubric.md
├── ytclip-3-remap-srt/                  把字幕重新对齐到剪好的片段
│   └── scripts/
│       ├── parse_cuts.ts
│       └── remap_srt.ts
├── ytclip-4-translate/                  AI 翻译字幕（多语言）
│   ├── ytclip-4-translate-en/           → English
│   │   ├── SKILL.md
│   │   └── references/en-localization.md
│   ├── ytclip-4-translate-zhtw/         → 繁体中文（台湾）
│   │   ├── SKILL.md
│   │   └── references/zh-tw-localization.md
│   ├── ytclip-4-translate-zhhk/         → 繁体中文（香港）
│   │   ├── SKILL.md
│   │   └── references/zhhk-localization.md
│   ├── ytclip-4-translate-zhcn/         → 简体中文
│   │   ├── SKILL.md
│   │   └── references/zhcn-localization.md
│   └── ytclip-4-translate-jp/           → 日本語
│       ├── SKILL.md
│       └── references/jp-localization.md
└── readme-translations/                 其他语言的 README
```

## 评分参考

第 2 步中的 AI 会从 8 个维度评估字幕分块，筛出最有趣、最值得翻译和分享的片段：

| 维度 | 检测内容 |
|-----------|-----------------|
| **funny（搞笑）** | 喜剧质量、反应强度、节奏感、荒诞程度 |
| **story（叙事）** | 叙事钩子、铺垫/递进/高潮、反转、出人意料的爆料 |
| **engagement（互动）** | 主播积极展示内容、引导观众参与 |
| **community（社区）** | 粉丝社区共鸣、梗、meme 潜力、宅文化 |
| **collab（联动）** | 跨创作者内容、VTuber 互动、团体动态 |
| **gaming（游戏）** | 绝地翻盘、史诗级失误、暴怒时刻、Boss 战 |
| **clipability（可切片性）** | 独立成片的连贯性、节奏感、自然的起止边界 |
| **penalties（扣分项）** | 日常闲聊、念打赏、冷场、行程安排 |

完整评分标准见 `ytclip-2-highlight-moments/references/highlight-evaluation-rubric.md`。
