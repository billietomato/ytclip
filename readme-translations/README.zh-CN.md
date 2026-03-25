# ytclip — 烤肉剪辑小帮手

[English](README.en.md) | [繁體中文](../README.md) | **[简体中文](README.zh-CN.md)**


使用 AI Agent Skills 辅助，从 YouTube 直播录像剪出粉丝向 VTuber 烤肉切片，并配上翻译字幕。

这套工作流可以帮你抓直播、找出有趣片段、加快剪辑流程、把字幕精准对齐到成片上，翻译成繁体中文、校对错字、再转成简体中文，让推的话语带着爱、热情和效率传到更远的地方。

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

第 2 步、第 5 步和第 6 步会用到 AI 代理，帮你找出有趣片段、翻译和校对。这份 README 以 Anthropic 的 **Claude Code** 为例。

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

> **使用其他 AI 代理？** 只要你的 AI 代理看得懂第 2 步、第 5 步和第 6 步用到的 `SKILL.md` 和参考文档，也能照样完成。

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
─── 第一阶段：下载素材 & 剪辑视频 ──────────────
    │
┌───────────────────────────────┐
│ 第 0 步：下载录像              │  yt-dlp
└───────────────────────────────┘
    │
    ▼
┌───────────────────────────────┐
│ 第 1 步：获取字幕              │  ytclip-1-transcript
└───────────────────────────────┘
    │  SRT 文件
    ▼
┌───────────────────────────────┐
│ 第 2 步：找出有趣片段           │  ytclip-2-highlight-moments (AI)
└───────────────────────────────┘
    │  带时间戳的 Markdown
    ▼
┌───────────────────────────────┐
│ 第 3 步：剪辑切片              │  你的视频编辑软件
└───────────────────────────────┘
    │  剪辑后的时间轴 + XML 导出
    ▼
─── 第二阶段：翻译字幕 & 导出繁中版 ─────────────
    │
┌───────────────────────────────┐
│ 第 4 步：重映射字幕             │  ytclip-3-remap-srt
└───────────────────────────────┘
    │  重映射后的 SRT
    ▼
┌───────────────────────────────┐
│ 第 5 步：翻译 EN → zh-TW      │  ytclip-4-translate-en-to-zhtw (AI)
└───────────────────────────────┘
    │  繁体中文 SRT
    ▼
┌───────────────────────────────┐
│ 第 6 步：校对繁中字幕           │  ytclip-5-proofread-zhtw (AI)
└───────────────────────────────┘
    │  校对后的 SRT
    ▼
┌───────────────────────────────┐
│ 第 7 步：手动调整字幕           │  你的视频编辑软件
└───────────────────────────────┘
    │  微调后的繁中 SRT
    ▼
┌───────────────────────────────┐
│ 第 8 步：导出繁中版视频         │  你的视频编辑软件
└───────────────────────────────┘
    │
    ▼  ✓ 繁中版完成
    │
─── 第三阶段：简中转换 & 导出简中版 ─────────────
    │
┌───────────────────────────────┐
│ 第 9 步：导出繁中 SRT & 转简中  │  ytclip-6-convert-tc-to-sc
└───────────────────────────────┘
    │  简体中文 SRT
    ▼
┌───────────────────────────────┐
│ 第 10 步：检查简中 & 导出      │  你的视频编辑软件
└───────────────────────────────┘
    │
    ▼
  ✓ 繁中版 + 简中版都完成！
```

---

## 第一阶段：下载素材 & 剪辑视频

### 第 0 步 — 下载录像

使用 yt-dlp 下载视频。你可以选择下载整场直播，或只下载特定区段。

**A) 下载整场直播：**
```bash
yt-dlp -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]' \
  -o 'raw-video.%(ext)s' \
  'https://www.youtube.com/watch?v=VIDEO_ID'
```

**B) 只下载特定区段**（例如 `1:00:00` 到 `2:30:00`）：
```bash
yt-dlp --download-sections "*01:00:00-02:30:00" \
  -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]' \
  -o 'raw-video.%(ext)s' \
  'https://www.youtube.com/watch?v=VIDEO_ID'
```

> **提示：** 将 `VIDEO_ID` 替换成这次要剪的直播视频 ID。URL 一定要用单引号包裹，避免 shell 解析问题。

### 第 1 步 — 下载字幕

这一步会把 YouTube 上的字幕抓成 SRT，作为后续找片段、对字幕和翻译的基础。**字幕的时间范围必须和视频一致，导入剪辑软件后才能同步。**

**A) 下载整场字幕**（搭配整场直播视频）：

用 CLI：
```bash
bun ytclip-1-transcript/scripts/main.ts \
  'https://www.youtube.com/watch?v=VIDEO_ID' \
  --format srt \
  -o my-video/transcript-en.srt
```

或用 AI 代理：
> Use ytclip-1-transcript skill. 下载 `https://www.youtube.com/watch?v=VIDEO_ID` 的完整英文字幕，保存为 `my-video/transcript-en.srt`。

**B) 只下载特定区段的字幕**（搭配用 `--download-sections` 下载的视频区段）：

用 CLI：
```bash
bun ytclip-1-transcript/scripts/main.ts \
  'https://www.youtube.com/watch?v=VIDEO_ID' \
  --format srt \
  --section '01:00:00-02:30:00' \
  -o my-video/transcript-en.srt
```

或用 AI 代理：
> Use ytclip-1-transcript skill. 下载 `https://www.youtube.com/watch?v=VIDEO_ID` 的英文字幕，只提取 `01:00:00-02:30:00` 区段，时间戳归零从 00:00:00 开始。保存为 `my-video/transcript-en.srt`。

> **时间同步：** `--section` 会自动把时间戳归零到 `00:00:00` 开始，和 yt-dlp 的 `--download-sections` 输出的视频完全同步。导入剪辑软件后视频和字幕会自动对齐。

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
  transcript-en.srt          ← 英文字幕，时间戳和视频同步
```

### 第 2 步 — 找出有趣片段（AI）

这一步分两段：先把字幕切成区块，再让 AI 找出最有趣的片段。

#### 2a. 分块字幕

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

#### 2b. 让 AI 进行评估

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
  highlight-moments.md       ← 排名后的精华候选片段
```

### 第 3 步 — 剪辑你的切片（自己来！）

打开视频编辑软件，把这份候选清单整理成你真正想发出去的版本。

#### 导入视频

| 编辑软件 | 导入方式 |
|--------|---------------|
| **Premiere Pro** | 文件 > 导入（或拖入项目面板） |
| **Final Cut Pro** | 文件 > 导入 > 媒体 |
| **DaVinci Resolve** | 文件 > 导入 > 媒体（或拖入媒体池） |

#### 剪切片段

1. 打开 `highlight-moments.md` 查看时间戳和说明
2. 在时间轴中跳到对应的位置
3. 切出你想保留的反应、公布、笑点、唱段、互动或情绪重点
4. 按你想要的节奏排列切片
5. 微调长度、转场和整体节奏

> **先别加字幕** — 等第二阶段翻译好字幕再处理。

#### 导出项目 XML

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

---

## 第二阶段：翻译字幕 & 导出繁中版

### 第 4 步 — 将字幕重映射到剪辑后的时间轴

原始 SRT 的时间戳还对应整场直播。这一步会把字幕重新对齐到你剪好的切片时间轴。

#### 4a. 解析 XML 生成切片清单

```bash
bun ytclip-3-remap-srt/scripts/parse_cuts.ts \
  my-video/export.xml \
  --track 0 \
  -o my-video/clip_manifest.json
```

> **注意：** `--track 0` 表示第一条视频轨道。如果你的切片在其他轨道上，请修改该数字。

#### 4b. 重映射 SRT

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
  ...（前面的文件）
  clip_manifest.json         ← 解析后的切片时间数据
  transcript-en-remapped.srt ← 匹配剪辑后时间轴的字幕
```

### 第 5 步 — 翻译字幕 EN → zh-TW（AI）

把对齐好的英文字幕翻成繁体中文（台湾）。打开 Claude Code（或你的 AI 代理），输入：

> Use ytclip-4-translate-en-to-zhtw skill. 将 `my-video/transcript-en-remapped.srt` 翻译为繁体中文（台湾），并遵循 `ytclip-4-translate-en-to-zhtw/references/zh-tw-localization.md` 中的本地化规则。保存为 `my-video/transcript-zhtw-remapped.srt`。

AI 会直接读取你的 SRT 文件来完成翻译，附带本地化规则处理台湾圈内用语、梗和社区语感。

### 第 6 步 — 校对繁中字幕（AI）

让 AI 校对翻译好的繁中 SRT，只抓真正的错字，不会给你风格建议。打开 Claude Code 输入：

> Use ytclip-5-proofread-zhtw skill. 校对 `my-video/transcript-zhtw-remapped.srt`，只列出确定的错字（错别字、乱码、明显打错的字）。

AI 会报告每一条错字的 SRT 区块编号、原文和正确写法。如果没有错字，就会告诉你文件是干净的。校对完毕后，先把错字修正回 SRT 文件。

### 第 7 步 — 手动调整字幕

把校对过的繁中 SRT 导入视频编辑软件，对照视频逐行检查字幕：

| 编辑软件 | SRT 导入方式 |
|--------|-------------------|
| **Premiere Pro** | 文件 > 导入 > 选择 `.srt` 文件，然后拖到字幕轨道上 |
| **Final Cut Pro** | 文件 > 导入 > 字幕，选择 `.srt` 文件 |
| **DaVinci Resolve** | 文件 > 导入 > 字幕，选择 `.srt` 文件，拖到字幕轨道 |

逐行播放并检查：

1. **时间轴微调** — 自动对齐后部分字幕可能差几帧，手动拉齐
2. **用字修润** — AI 翻译不一定完全合你的语感，这里是最后修正的机会
3. **确认不挡画面** — 字幕位置不要遮到重要画面元素

> 这一步是品质把关的关键。之后导出的 SRT 也会用来转简中，所以现在修好就不用改两次。

### 第 8 步 — 导出繁中版视频

字幕调好之后，导出繁体中文字幕版的视频。

#### 设置字幕样式（可选）

- **Premiere Pro：** 在基本图形面板中选中字幕，修改字体、大小、颜色和位置
- **Final Cut Pro：** 选中字幕片段，在检查器面板中调整
- **DaVinci Resolve：** 进入 Fusion 或编辑页面来调整字幕样式

#### 导出视频

| 编辑软件 | 导出方式 |
|--------|---------------|
| **Premiere Pro** | 文件 > 导出 > 媒体。在字幕选项中选择"将字幕烧录到视频中"或"创建附属文件" |
| **Final Cut Pro** | 文件 > 共享 > 母版文件（或你偏好的预设）。字幕会自动包含在内 |
| **DaVinci Resolve** | 交付页面 > 设置格式和编码。在字幕选项中选择"导出字幕"以烧录 |

繁中版完成！

---

## 第三阶段：简中转换 & 导出简中版

### 第 9 步 — 导出繁中 SRT 并转简中

先从视频编辑软件导出你手动调整过的繁中 SRT，再转成简体中文。

#### 9a. 导出调整后的繁中 SRT

| 编辑软件 | SRT 导出方式 |
|--------|-------------------|
| **Premiere Pro** | 文件 > 导出 > 字幕，选择 SRT 格式 |
| **Final Cut Pro** | 文件 > 导出字幕，选择 SRT 格式 |
| **DaVinci Resolve** | 交付页面 > 字幕选项 > 导出为独立 SRT 文件 |

保存为 `my-video/transcript-zhtw-final.srt`。

#### 9b. 转简中

```bash
bun ytclip-6-convert-tc-to-sc/scripts/convert.ts \
  my-video/transcript-zhtw-final.srt \
  -o my-video/transcript-zhcn-final.srt
```

> **注意：** 这只是字符对应转换，不会调整用语或语感。如果需要大陆本地化（例如把「影片」改成「视频」），需要另外处理。

### 第 10 步 — 检查简中字幕并导出简中版

把简中 SRT 导入视频编辑软件，快速过一遍确认转换结果没问题。

#### 导入简中 SRT

用第 7 步同样的导入方式，把 `my-video/transcript-zhcn-final.srt` 导入视频编辑软件。记得先移除或停用繁中字幕轨道。

#### 快速检查

1. 播放几段确认简体字符转换正确
2. 留意繁简转换可能漏掉的特殊用语
3. 确认时间轴和繁中版一致

#### 导出简中版视频

用第 8 步同样的导出方式，导出简体中文字幕版的视频。

繁中版 + 简中版都完成！

---

## 最终项目文件夹

```
my-video/
  raw-video.mp4                    原始直播录像
  transcript-en.srt                字幕原稿（完整直播时间轴）
  chunks.json                      给 AI 评估的字幕区块
  highlight-moments.md             排名后的精华候选片段
  export.xml                       剪辑时间轴导出
  clip_manifest.json               解析后的剪辑时间数据
  transcript-en-remapped.srt       对齐成片的英文字幕
  transcript-zhtw-remapped.srt     AI 翻译校对后的繁体中文字幕
  transcript-zhtw-final.srt        手动调整后的繁中字幕（从编辑软件导出）
  transcript-zhcn-final.srt        简体中文字幕（繁→简转换）
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
├── ytclip-4-translate-en-to-zhtw/       AI 翻译英文字幕 → 繁体中文（台湾）
│   ├── SKILL.md
│   └── references/zh-tw-localization.md
├── ytclip-5-proofread-zhtw/             AI 校对繁中字幕，抓错字
│   └── SKILL.md
├── ytclip-6-convert-tc-to-sc/           繁中转简中（纯字符转换）
│   └── scripts/convert.ts
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

> AI 的评分结果仅供参考。最好的片段永远是你亲眼看完直播后、发自内心想分享的那一刻。做个有爱的烤肉man，让 VTuber 文化走得更远！
