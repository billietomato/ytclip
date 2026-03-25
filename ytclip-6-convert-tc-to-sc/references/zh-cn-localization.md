# zh-CN Localization Rules

Use these rules when adapting a TW-converted Simplified Chinese SRT for mainland Chinese usage.

## Objective

Adapt Taiwan-style Chinese (after character conversion) into natural mainland Simplified Chinese, covering vocabulary, slang, gaming/streaming terms, and phrasing.

## Hard Constraints

- Keep all SRT block numbering and timestamp lines exactly as-is.
- Adapt only the subtitle text lines.
- Keep original meaning, tone, and factual claims.
- Do not summarize or restructure blocks.
- Do not add comma (，) or full-stop (。) at the end of each subtitle line.
- Keep people names in original language (do not transliterate).
- Preserve code, URLs, and command lines unchanged.
- Do not add speaker markers.
- Respect platform context. Do not rewrite a platform-specific action into a different product mechanic unless the speaker clearly means the mainland analogue.

## Slang & Exclamation Mapping

The zh-TW translation uses Taiwan-specific slang. Convert to natural mainland equivalents:

| zh-TW | zh-CN | Notes |
|-------|-------|-------|
| 他喵的 / 喵的 | 卧槽 / 我靠 / 草 | "fucking" as intensifier |
| 靠 / 喔靠 | 我靠 / 卧槽 / 我去 | "oh shit" / surprise |
| 喔 | 哦 / 噢 | Casual "oh" |
| 喔天啊 / 我的天啊 / 天啊 / 天哪 | 我的天 / 天呐 / 我滴天 | "oh my god" |
| 該死 | 该死 / 我靠 | "damn" |
| 搞什麼 / 搞什么 | 搞什么 / 搞毛 | "what the hell" |
| 不會吧 / 不会吧 | 不会吧 / 不是吧 | "no way" |
| 認真的嗎 / 认真的吗 | 认真的吗 / 真的假的 | "seriously?" |
| 超扯 / 真的很扯 | 太离谱了 / 绝了 | "that's insane" |
| 超有感 | 太有感了 / 太真实了 | "so relatable" |
| 破防 / 直接破防 | 破防了 / 直接破防 | Shared — keep as-is |
| 太神了 | 太牛了 / 太强了 / 神了 | "godlike / amazing" |

These are guidelines — adapt naturally to context. Do not force-fit if the tone doesn't match.

## Vocabulary Mapping (TW → Mainland)

OpenCC handles character conversion but may miss TW-specific word choices. Fix these:

| TW term (post-openCC) | Mainland term | Category |
|------------------------|---------------|----------|
| 影片 | 视频 | Media |
| 软体 | 软件 | Tech |
| 网路 | 网络 | Tech |
| 伺服器 | 服务器 | Tech |
| 记忆体 | 内存 | Tech |
| 资讯 | 信息 | General |
| 荧幕 | 屏幕 | Tech |
| 滑鼠 | 鼠标 | Tech |
| 程式 | 程序 | Tech |
| 列印 | 打印 | Tech |
| 资料夹 | 文件夹 | Tech |
| 回馈 | 反馈 | General |
| 品质 | 质量 | General |
| 透过 | 通过 | General |
| 单纯 | 单纯 / 纯粹 | OK as-is |

If you encounter other TW-specific terms not listed here, convert them to the commonly used mainland equivalent.

## Streaming & Content Creator Terms

| TW term | Mainland term | Notes |
|---------|---------------|-------|
| 实况 | 直播 | Livestream |
| 实况主 | 主播 | Streamer |
| 实况台 | 直播间 | Stream page / stream room |
| 斗内 / 抖内 | 打赏 | Donate / tip |
| 订阅 | 订阅 / 关注 | Subscribe (关注 on Bilibili) |
| 聊天室 | 弹幕 / 聊天区 | Chat (弹幕 if referring to on-screen chat) |
| 开台 | 开播 | Start streaming |
| 关台 / 關台 | 下播 | End streaming |
| 揪团 | 引流 / raid | Only in streamer raid context |
| VOD / 存档 | 录播 / 回放 | Archived stream |
| 切片 | 切片 / 直播切片 | Clip |
| 观众 | 观众 | OK as-is |
| 频道 | 频道 | OK as-is |
| 按赞 | 点赞 | Like |
| 留言 | 评论 | Comment |
| 工商 | 商单 / 商务合作 | Sponsored segment |
| 精华 | 精彩集锦 / 高光 | Highlights |
| 素材 | 素材 | OK as-is |
| 剪辑 | 剪辑 | OK as-is |

Platform notes:
- Keep `订阅` for YouTube subscription context.
- Use `关注` when the speaker clearly means the mainland platform action.
- Use `弹幕` only for on-screen live comments; use `评论` or `聊天区` for normal comments/chat.
- Use `引流` or `raid` only when `揪团` means transferring viewers to another stream. If it means organizing people to play together, use `组队`, `喊人`, or similar gaming phrasing instead.

## Gaming Terms

- Use the **official mainland Chinese name** for games. These often differ from TW names.
- For game-specific terms (skills, items, locations), use terms commonly used in the **mainland gaming community**.
- Common examples:

| TW name | Mainland name | Game |
|---------|---------------|------|
| 艾尔登法环 | 艾尔登法环 / 老头环 (colloquial OK) | Elden Ring |
| 萨尔达 | 塞尔达 | Zelda |
| 旷野之息 | 旷野之息 | BotW |
| 王国之泪 | 王国之泪 | TotK |
| 斯普拉遁 | 斯普拉遁 / 喷射战士 | Splatoon |
| 任天堂 | 任天堂 | Nintendo (same) |
| 宝可梦 | 宝可梦 | Pokémon (same) |
| 堡壘之夜 / Fortnite | 堡垒之夜 | Fortnite |
| 鬥陣特攻 | 守望先锋 | Overwatch |
| 漫威爭鋒 | 漫威争锋 | Marvel Rivals |
| 惡靈古堡 | 生化危机 | Resident Evil |
| Apex 英雄 | Apex 英雄 | Apex Legends |
| 特战英豪 | 无畏契约 | VALORANT |
| 英雄联盟 | 英雄联盟 / LOL | League of Legends |

- For unfamiliar game terms not listed here, prefer the mainland community's commonly used translation. If unsure, keep the original English term.
- Colloquial mainland gaming nicknames are OK in casual contexts (e.g., 老头环 for Elden Ring) but prefer official names in neutral contexts.
- When the source mixes English and Chinese franchise names, normalize to the mainland Chinese franchise name if that is the standard mainland usage.

## Gaming-Specific Vocabulary

| TW term | Mainland term | Notes |
|---------|---------------|-------|
| 技能 | 技能 | OK as-is |
| 副本 | 副本 | OK as-is |
| 配装 | 配装 / 出装 | Build / loadout |
| 流派 | 流派 / 玩法 | Build archetype |
| 坦克 / 坦 | 坦克 / T | Tank role |
| 补师 | 奶妈 / 治疗 | Healer |
| 输出 | 输出 / DPS | Damage dealer |
| 农 / 刷 | 肝 / 刷 | Grind |
| 课金 | 氪金 | Pay-to-win / gacha spending |
| 抽卡 | 抽卡 | Gacha (same) |
| 机体 | 角色 / 机体 | Depends on game context |
| 懒人包 | 攻略 / 新手指南 | Beginner guide |
| 首杀 | 首杀 / 首通 | First clear (same) |
| 实况野团 / 野团 | 野队 / 野团 | Pickup group |

## Phrasing & Style

- Mainland internet Chinese tends to be slightly more direct than TW style.
- 了 is used more freely as a sentence-final particle in mainland speech.
- 的 vs 得 usage: follow standard mainland conventions.
- Mainland casual tone markers: 啊, 呢, 嘛, 吧, 呀 — use naturally.
- Avoid over-correcting shared expressions. Many internet terms are used in both TW and mainland — only change what actually sounds distinctly Taiwanese.

## Output Format

- SRT format: keep block numbering and timestamp lines unchanged, adapt only subtitle text.
- Overwrite the file produced by the character conversion script.
