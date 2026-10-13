---
description: 播客随笔（Podcast Stream）双栏对照精读排版与数据规范（硬约束）
globs: ["**/PodcastStream.jsx", "**/wealthFreedom*.json", "**/alanInterview.json", "**/*podcast*"]
---

# 播客随笔双栏对照精读规范 (Hard Invariants)

每次处理个人博客的播客随笔 (`PodcastStream.jsx`)、人物智库、播客专辑导入或样式修改时，必须严格遵守以下硬性约束，绝对禁止破坏左右双栏布局：

## 1. 布局结构硬约束
- 主容器必须使用 `.contrast-dual-pair`（`display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)`）。
- 严禁将主容器改为单列堆叠或重命名为没有 grid 定义的类名（如 `contrast-split-row` 等）。
- 左右两栏必须保持职责分离：
  - **左栏 (`.contrast-pane-left`)**：原声对照输入。包含：顶部原声标签、`💬 引子：`、原文长引用段落、底部出处溯源卡。
  - **右栏 (`.contrast-pane-right`)**：核心剖析与做题笔记。包含：切片标签、大号核心论点、引子复述、**先抓骨架深色胶囊 (`.contrast-bone-capsule`)**、**逻辑推演链条列表 (`.contrast-skeleton-steplist`) 带圆形编号 1, 2...**、**金句 Sparkles 提炼 (`.contrast-hook-quote`)**、**深度思考与随笔记录卡片 (`.contrast-reflection-card`)**。

## 2. 顶部与底部元件硬约束
- 顶部必须保留：专题 Hero 卡片（大标题 + 一句话命题）、认知降温提示横幅（深夜思维滑梯）、切片单选胶囊组。
- 底部必须保留：翻页卡正下方的极简打卡落款。

## 3. 数据契约硬约束
所有收录的播客专题与切片数据，必须归一化为标准的 `PodcastTopic` 与 `PodcastSegment` 结构，提供 `time`, `lead`, `quote` (数组), `claim`, `skeleton` (数组), `hook`, `note` 字段。
