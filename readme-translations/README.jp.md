# ytclip — 切り抜き翻訳お助けツール

[English](../README.md) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | **[日本語](README.jp.md)**


YouTubeの配信アーカイブから、翻訳字幕付きのファンメイドVTuber切り抜きをAIで作れます。

このワークフローでは、配信を取り込み、切り抜き向きの場面を見つけ、編集を効率化し、字幕を仕上がりに合わせて整え、他言語へ翻訳できます。推しの言葉を、愛と情熱と効率で、もっと遠くまで届けるための流れです。

## 必要なもの

始める前に以下を入れておけば、アーカイブから翻訳付き切り抜きまでスムーズに進められます。

### 1. yt-dlp（YouTubeから動画をダウンロード）

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

**全プラットフォーム (pip):**
```bash
pip install yt-dlp
```

動作確認:
```bash
yt-dlp --version
```

### 2. Bun（スクリプト実行用のJavaScriptランタイム）

**macOS / Linux:**
```bash
curl -fsSL https://bun.sh/install | bash
```

**Windows:**
```bash
powershell -c "irm bun.sh/install.ps1 | iex"
```

動作確認:
```bash
bun --version
```

### 3. Claude Code（スコアリング＆翻訳用AIエージェント）

ステップ2とステップ5ではAIエージェントを使い、切り抜き向きの場面探しと翻訳を進めます。このREADMEではAnthropicの**Claude Code**を例にしています。

1. **Anthropicアカウントを作成** — [claude.ai](https://claude.ai) にアクセスしてサインアップ
2. **サブスクリプションまたはAPIキー** — Claude CodeでAIモデルを使うには、有効なサブスクリプションまたはAPIキーが必要です。Sonnet 4.6 モデル推奨です。
3. **Claude Codeをインストール:**
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```
4. **起動:**
   ```bash
   claude
   ```

> **別のAIエージェントを使いたい場合は？** ステップ2と5で使う `SKILL.md` とリファレンスを読めるなら、同じ流れで進められます。

### 4. 動画編集ソフト

以下のいずれかが必要です:

| エディタ | プラットフォーム | エクスポート形式 |
|--------|----------|---------------|
| **Adobe Premiere Pro** | Mac / Windows | Final Cut Pro XML |
| **Final Cut Pro** | Mac | FCPXML |
| **DaVinci Resolve** | Mac / Windows / Linux | Final Cut Pro 7 XML |

プロ並みの編集技術は不要です。動画を読み込み、タイムラインで切り、XMLと動画を書き出せれば十分です。

---

## パイプラインの全体像

```
YouTube URL
    │
    ▼
┌─────────────────────────┐
│ Step 0: アーカイブDL      │  yt-dlp
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│ Step 1: 字幕取得          │  ytclip-1-transcript
└─────────────────────────┘
    │  SRTファイル
    ▼
┌─────────────────────────┐
│ Step 2: 切り抜き向きの    │  ytclip-2-highlight-moments (AI)
│         場面を探す        │
└─────────────────────────┘
    │  タイムスタンプ付きMarkdown
    ▼
┌─────────────────────────┐
│ Step 3: クリップ編集      │  動画編集ソフト
└─────────────────────────┘
    │  編集済みタイムライン + XMLエクスポート
    ▼
┌─────────────────────────┐
│ Step 4: 字幕リマップ      │  ytclip-3-remap-srt
└─────────────────────────┘
    │  リマップ済みSRT
    ▼
┌─────────────────────────┐
│ Step 5: 翻訳             │  ytclip-4-translate/ytclip-4-translate-* (AI)
└─────────────────────────┘
    │  翻訳済みSRT
    ▼
┌─────────────────────────┐
│ Step 6: インポート＆      │  動画編集ソフト
│         エクスポート      │
└─────────────────────────┘
    │
    ▼
  字幕付き完成動画
```

---

## Step 0 — アーカイブをダウンロード

まずは今回の切り抜き用フォルダを作ります:

```bash
mkdir ~/my-video && cd ~/my-video
```

yt-dlpで動画をダウンロード:

```bash
yt-dlp -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]' \
  -o 'raw-video.%(ext)s' \
  'https://www.youtube.com/watch?v=VIDEO_ID'
```

> **ヒント:** `VIDEO_ID` は今回切り抜きたい配信の動画IDに置き換えてください。URLはシングルクォートで囲むとシェルの問題を回避できます。

特定の区間だけ先に扱いたい場合、たとえば `1:00:00` から `2:30:00`:
```bash
yt-dlp --download-sections "*01:00:00-02:30:00" \
  -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]' \
  -o 'raw-video.%(ext)s' \
  'https://www.youtube.com/watch?v=VIDEO_ID'
```

フォルダの中身はこうなります:
```
~/my-video/
  raw-video.mp4
```

## Step 1 — 字幕をダウンロード

YouTubeから字幕をSRTとして取得します。切り抜き候補探し、字幕合わせ、翻訳の土台になります。

```bash
bun ytclip-1-transcript/scripts/main.ts \
  'https://www.youtube.com/watch?v=VIDEO_ID' \
  --format srt \
  -o ~/my-video/transcript-en.srt
```

**別の言語を選ぶ場合**、元動画に使いたい字幕があるならそのまま取得できます:
```bash
# まず利用可能な言語を確認
bun ytclip-1-transcript/scripts/main.ts 'https://www.youtube.com/watch?v=VIDEO_ID' --list

# 日本語字幕をダウンロード
bun ytclip-1-transcript/scripts/main.ts 'https://www.youtube.com/watch?v=VIDEO_ID' \
  --format srt --languages ja -o ~/my-video/transcript-ja.srt
```

フォルダの中身はこうなります:
```
~/my-video/
  raw-video.mp4
  transcript-en.srt          ← アーカイブのタイムスタンプ付き英語字幕
```

## Step 2 — 切り抜き向きの場面を探す（AI）

まず字幕をチャンク化し、その後AIにファンメイド切り抜き向きの場面を評価させます。

### 2a. 字幕をチャンクに分割

```bash
bun ytclip-2-highlight-moments/scripts/clip_candidates.ts \
  ~/my-video/transcript-en.srt \
  -o ~/my-video/chunks.json
```

**オプション** — 特定のテーマを優先して探したい場合:
```bash
bun ytclip-2-highlight-moments/scripts/clip_candidates.ts \
  ~/my-video/transcript-en.srt \
  --focus 'announcement,new outfit' \
  -o ~/my-video/chunks.json
```

### 2b. AIに評価させる

このプロジェクトのディレクトリでClaude Code（または使用中のAIエージェント）を開いて、以下のように依頼します:

> `~/my-video/chunks.json` を読んで、`ytclip-2-highlight-moments/references/highlight-evaluation-rubric.md` のルーブリックに従い、ファンメイドのVTuber切り抜き向きの場面を上位10〜20個選んでください。結果は `~/my-video/highlight-moments.md` に保存してください。

AIは以下の処理を行います:
1. ファンが切り抜いて共有したくなる瞬間を洗い出す
2. 各候補を8つの観点（ユーモア、ストーリー、エンゲージメント、コミュニティ、コラボ、ゲーミング、クリップ適性、ペナルティ）で詳細評価
3. 正確なタイムスタンプ付きのMarkdown候補リストを出力

フォルダの中身はこうなります:
```
~/my-video/
  raw-video.mp4
  transcript-en.srt
  chunks.json                ← 前処理済みチャンク
  highlight-moments.md           ← タイムスタンプ付き候補リスト
```

## Step 3 — クリップを編集する

動画編集ソフトを開き、候補リストを実際に投稿したい切り抜きへ仕上げます。

### 動画をインポート

| エディタ | インポート方法 |
|--------|---------------|
| **Premiere Pro** | ファイル > 読み込み（またはプロジェクトパネルにドラッグ） |
| **Final Cut Pro** | ファイル > 読み込む > メディア |
| **DaVinci Resolve** | ファイル > 読み込み > メディア（またはメディアプールにドラッグ） |

### カット編集

1. `highlight-moments.md` を開いてタイムスタンプとメモを確認
2. タイムラインで該当箇所に移動
3. 残したいリアクション、告知、笑いどころ、歌パート、やり取り、感情の山を切り出す
4. 出したい流れに合わせてクリップを並べる
5. テンポやつながりを整える

> **字幕はまだ追加しないでください** — 次のステップでリマップしてから合わせます。

### プロジェクトXMLをエクスポート

次のステップで編集結果を読み取れるよう、タイムラインをXMLとして書き出します。

| エディタ | XMLエクスポート方法 |
|--------|-------------------|
| **Premiere Pro** | ファイル > 書き出し > Final Cut Pro XML |
| **Final Cut Pro** | ファイル > XMLを書き出す |
| **DaVinci Resolve** | ファイル > 書き出し > タイムライン > FCP 7 XML（またはFCPXML） |

`~/my-video/export.xml` として保存してください。

フォルダの中身はこうなります:
```
~/my-video/
  raw-video.mp4
  transcript-en.srt
  chunks.json
  highlight-moments.md
  export.xml                 ← 編集内容
```

## Step 4 — 字幕を編集に合わせてリマップ

元のSRTはフル配信のタイムスタンプのままです。このステップで、仕上げた切り抜きのタイミングに合わせてリマップします。

### 4a. XMLからクリップマニフェストを作成

```bash
bun ytclip-3-remap-srt/scripts/parse_cuts.ts \
  ~/my-video/export.xml \
  --track 0 \
  -o ~/my-video/clip_manifest.json
```

> **注意:** `--track 0` は最初のビデオトラックを意味します。クリップが別のトラックにある場合は番号を変更してください。

### 4b. SRTをリマップ

```bash
bun ytclip-3-remap-srt/scripts/remap_srt.ts \
  ~/my-video/transcript-en.srt \
  ~/my-video/clip_manifest.json \
  -o ~/my-video/transcript-en-remapped.srt \
  --gap 50
```

実際に残した区間の字幕だけが残り、タイムスタンプも完成した並びに合わせて調整されます。

フォルダの中身はこうなります:
```
~/my-video/
  raw-video.mp4
  transcript-en.srt
  chunks.json
  highlight-moments.md
  export.xml
  clip_manifest.json         ← パース済みクリップタイミング
  transcript-en-remapped.srt ← 編集に合わせた字幕
```

## Step 5 — 字幕を翻訳する（AI）

リマップ済み字幕をターゲット言語に翻訳して、推しの言葉をもっと多くの人に届けます。Claude Code（または使用中のAIエージェント）を開いて、以下のように依頼します:

**日本語に翻訳:**
> `~/my-video/transcript-en-remapped.srt` を `ytclip-4-translate/ytclip-4-translate-jp/references/jp-localization.md` のローカライズルールに従って日本語に翻訳してください。`~/my-video/transcript-jp-remapped.srt` として保存してください。

**繁體中文（台湾）に翻訳:**
> `~/my-video/transcript-en-remapped.srt` を繁體中文（台湾）に翻訳し、`ytclip-4-translate/ytclip-4-translate-zhtw/references/zh-tw-localization.md` のローカライズルールに従ってください。`~/my-video/transcript-zhtw-remapped.srt` として保存してください。

**英語に翻訳:**
> `~/my-video/transcript-ja-remapped.srt` を英語に翻訳し、`ytclip-4-translate/ytclip-4-translate-en/references/en-localization.md` のローカライズルールに従ってください。`~/my-video/transcript-en-remapped.srt` として保存してください。

**広東語（香港）に翻訳:**
> `~/my-video/transcript-en-remapped.srt` を広東語（香港）に翻訳し、`ytclip-4-translate/ytclip-4-translate-zhhk/references/zhhk-localization.md` のローカライズルールに従ってください。`~/my-video/transcript-zhhk-remapped.srt` として保存してください。

**简体中文に翻訳:**
> `~/my-video/transcript-en-remapped.srt` を简体中文に翻訳し、`ytclip-4-translate/ytclip-4-translate-zhcn/references/zhcn-localization.md` のローカライズルールに従ってください。`~/my-video/transcript-zhcn-remapped.srt` として保存してください。

AIがSRTをそのまま読み込んで翻訳するので、ワークフローを軽く保てます。各言語パックには、界隈の言い回し、ネタ、コミュニティの温度感を扱うためのローカライズルールが入っています。

### 利用可能な翻訳先

| スキルフォルダ | ターゲット言語 | スタイル |
|-------------|-----------------|-------|
| `ytclip-4-translate/ytclip-4-translate-en` | English | 切り抜き向けの自然な英語 |
| `ytclip-4-translate/ytclip-4-translate-zhtw` | 繁體中文 (台灣) | 台湾VTuber・烤肉コミュニティの語感 |
| `ytclip-4-translate/ytclip-4-translate-zhhk` | 繁體中文 (香港) | 香港広東語の烤肉語感 |
| `ytclip-4-translate/ytclip-4-translate-zhcn` | 简体中文 | 简中VTuber・ネットコミュニティの語感 |
| `ytclip-4-translate/ytclip-4-translate-jp` | 日本語 | VTuber・配信界隈の日本語 |

## Step 6 — 字幕をインポートしてエクスポート

### 翻訳済みSRTをインポート

| エディタ | SRTインポート方法 |
|--------|-------------------|
| **Premiere Pro** | ファイル > 読み込み > `.srt` ファイルを選択し、キャプショントラックにドラッグ |
| **Final Cut Pro** | ファイル > 読み込む > キャプション、`.srt` ファイルを選択 |
| **DaVinci Resolve** | ファイル > 読み込み > サブタイトル、`.srt` ファイルを選択し、サブタイトルトラックにドラッグ |

字幕は編集後のクリップにきれいに合うはずです。

### 字幕のスタイル調整（任意）

- **Premiere Pro:** エッセンシャルグラフィックスパネルでキャプションを選択し、フォント・サイズ・色・位置を変更
- **Final Cut Pro:** キャプションクリップを選択し、インスペクタパネルで調整
- **DaVinci Resolve:** FusionまたはEditページでサブタイトルの見た目を調整

### 最終動画をエクスポート

通常通り書き出してください。すぐ投稿するなら字幕焼き込み、後で調整したいなら別トラックでも構いません。

| エディタ | エクスポート方法 |
|--------|---------------|
| **Premiere Pro** | ファイル > 書き出し > メディア。キャプション設定で「ビデオに焼き付け」または「サイドカーファイルを作成」を選択 |
| **Final Cut Pro** | ファイル > 共有 > マスターファイル（または任意のプリセット）。キャプションは自動で含まれます |
| **DaVinci Resolve** | デリバーページでフォーマットとコーデックを設定。サブタイトルで「サブタイトルを書き出し」を選択して焼き付け |

---

## 最終的なプロジェクトフォルダ

```
~/my-video/
  raw-video.mp4                    元の配信アーカイブ
  transcript-en.srt                字幕の元データ（フル配信タイムライン）
  chunks.json                      AI評価用の字幕チャンク
  highlight-moments.md                 タイムスタンプ付き候補リスト
  export.xml                       編集タイムラインのエクスポート
  clip_manifest.json               解析済みのカットタイミング
  transcript-en-remapped.srt       切り抜きに合わせた字幕
  transcript-jp-remapped.srt       すぐ読み込める翻訳済み字幕
```

## プロジェクト構成

```
ytclip-1-transcript/            YouTube字幕をSRTとして取得
ytclip-2-highlight-moments/         AIで切り抜き向きの場面を評価 → Markdown
ytclip-3-remap-srt/             字幕を編集済みカットに合わせてリマップ
ytclip-4-translate/ytclip-4-translate-en/          AI翻訳 → 英語
ytclip-4-translate/ytclip-4-translate-zhtw/        AI翻訳 → 繁體中文（台湾）
ytclip-4-translate/ytclip-4-translate-zhhk/        AI翻訳 → 繁體中文（香港）
ytclip-4-translate/ytclip-4-translate-zhcn/        AI翻訳 → 简体中文
ytclip-4-translate/ytclip-4-translate-jp/          AI翻訳 → 日本語
```

## スコアリングの基準

Step 2では、AIが字幕チャンクを8つの観点で評価し、切り抜き・翻訳・共有に向いた場面を拾い上げます:

| 観点 | 検出する内容 |
|-----------|-----------------|
| **funny** | コメディのクオリティ、リアクションの強さ、ボケのタイミング、シュールさ |
| **story** | 話の引き、フリ→展開→オチの構造、予想外の展開、驚きの暴露 |
| **engagement** | 配信者がアクティブにプレゼンしている、視聴者にエネルギーを向けている |
| **community** | ファンコミュニティとの共鳴、内輪ネタ、ミームのポテンシャル、オタク文化 |
| **collab** | コラボ配信、VTuber同士のやり取り、箱内のダイナミクス |
| **gaming** | クラッチプレイ、大失敗、キレ芸、ボス戦 |
| **clipability** | 単体で成立するか、テンポ、切り抜きとして自然な区切り |
| **penalties** | 雑談タイム、スパチャ読み、無音区間、スケジュール告知 |

詳細なスコアリング基準は `ytclip-2-highlight-moments/references/highlight-evaluation-rubric.md` を参照してください。
