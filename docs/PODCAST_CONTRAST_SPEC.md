# 播客随笔 · 双栏对照精读系统设计规范与数据契约 (Specification & Contract)

> **版本**：v1.0.0 (2026-10-14 定稿固化)  
> **核心状态**：**永久固化规范 (Locked Standard)**。任何后续新增人物（如 Elon Musk、Alex Wang 等）、新播客专辑导入或前端组件调整，必须无条件遵循本规范。

---

## 1. 核心定位与初衷 (Mindset & Vision)

- **认知思维滑梯**：
  > “深夜睡不着时，看未知的新东西会激发多巴胺导致兴奋；听过、熟悉、不带压迫感的内容是最好的‘思维滑梯’——平复心率与脑电波，自然产生睡意。”
- **双栏做题精读，拒绝浮躁通读**：
  读者并非走马观花，而是左手抓原声事实输入、右手做认知骨架拆解，形成深度沉浸。

---

## 2. 界面与布局绝对约束 (Layout & UI Invariants)

必须严格遵循以下层次结构与 CSS 布局约定，**严禁将左右栏合并或降解为单列堆叠**：

### 2.1 顶部级联收敛导航 (Cascading Header)
- **人物切换 (`AVAILABLE_FIGURES`)**：
  - 孙宇晨（现已收录 2026 访谈 7 专题 + 财富自由精读 167 专题，共计 174 篇收录）。
  - 预留拓展位：Elon Musk（第一性原理/极限工程）、Alex Wang（Scale AI/数据基建）、Sam Altman（OpenAI/AGI 路线）等。
- **系列切换胶囊**：
  - 专辑系列多选胶囊（如 `艾伦长访谈 7/7` 与 `财富自由之路 0/167`），带实时读毕状态。
- **专题选择器**：支持点击快速直达任意专题。
- **功能控制组**：
  - 系列阅读总进度胶囊（`进度 X/Y 篇 (Z%)`，全读毕时呈现绿底 `✓ 全篇读毕 100%`）。
  - 双栏「对照」与单栏「通读」模式切换。
  - 字号调节器（`小`、`标准`、`稍大`、`特大`）。
  - 顶部微型打卡状态徽标（`已过` / `打卡`）。
  - 快捷上一篇 / 下一篇导航箭头。

### 2.2 专题 Hero 命题卡片 (`.contrast-topic-hero`)
- **头部元信息**：专题编号、原声时间区间 / 专辑期号、对话双方（🎙️ 孙宇晨 × 邵艾伦）。
- **专题大标题**：醒目大字号。
- **一句话命题**：带高亮命题前缀与核心命题定义。

### 2.3 认知降温横幅 (`.contrast-mindset-banner`)
- 包含月牙图标 🌙 与“思维滑梯”心智平复提示文案。

### 2.4 切片聚焦胶囊组 (`.contrast-pills-row`)
- 提供 `全部切片 (N)` 与每个具体 `切片 01`、`切片 02`... 的高亮切换按钮。

### 2.5 核心主体：左右双栏对照网格 (`.contrast-dual-pair`)
- **必须维持 `display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);` 左右 50%:50% 响应式双栏**。
- **【左栏 · 原声对照输入】(`.contrast-pane-left`)**：
  1. 顶部标签：`对照相关原声 · 🎙️ [演讲者/人物]（[期号/场景]）`
  2. 引子卡片（`.contrast-quote-lead`）：`💬 引子：...`
  3. 原声长引用段落（`.contrast-original-quote-body`）：完整真实的长段落呈现。
  4. 底部出处卡片（`.contrast-source-card`）：原声音频时间/期号标签 + 「到原文看这一段 →」跳转入口 + 出处版权说明。
- **【右栏 · 核心剖析与随笔记录】(`.contrast-pane-right`)**：
  1. 切片标签：`切片 0X · 核心论点剖析`
  2. 大号核心论点：清晰醒目。
  3. 引子复述。
  4. **先抓骨架深色胶囊**（`.contrast-bone-capsule`）：提纲挈领的认知骨架。
  5. **逐块拆解 / 逻辑推演链条**（`.contrast-breakdown-box`）：
     - 标题：`▶ 逻辑推演链条与认知骨架`
     - 包含圆圈带号序号步骤（`1, 2, 3...`）的递进式推理。
  6. **金句 Sparkles 提炼**（`.contrast-hook-quote`）：✨ 认知重点。
  7. **深度思考与随笔记录卡片**（`.contrast-reflection-card`）：
     - 随笔输入框、一键复制切片卡片按钮、打卡与随笔本地持久化存储。

### 2.6 底部导航与极简落款打卡
- 宽幅上一篇 / 下一篇专题卡片。
- **正下方极简打卡落款**（`.contrast-footer-checkin-wrap`）：
  - 点击一键打卡 / 取消打卡（`读毕打卡 · 记录今日推进` / `✓ 本篇已打卡 · 心智归位`）。
  - 动态展示当前系列的已读进度比。

---

## 3. 标准化数据契约 (Data Schema)

后续无论录入哪位人物或哪个专辑，数据源均须归一化为如下结构：

```typescript
interface PodcastTopic {
  id: number;
  key: string;                 // 唯一键，例如 'wf-001-1' 或 'alan-topic-01'
  episodeNo?: string | number; // 期号
  unit?: string;               // 所属单元，如「财富与自由」
  originalTitle?: string;      // 原标题
  title: string;               // 专题标题
  core: string;                // 一句话命题
  closing?: string;            // 收束语
  time_start?: string;         // 针对长访谈的时间起点
  time_end?: string;           // 针对长访谈的时间终点
  segments: PodcastSegment[];
}

interface PodcastSegment {
  id: number;
  time?: string;               // 原声定位或时间戳
  lead: string;                // 引子：主持人问或背景引入
  quote: string[];             // 原声长引用段落数组
  claim: string;               // 核心论点剖析
  skeleton: string[];          // 逻辑推演步骤列表
  hook?: string;               // 认知重点 / 金句提炼
  note?: string;               // 预设思考题或思考随笔
}
```

---

## 4. 严禁改动项 (Non-Negotiable Invariants)

1. **容器类名不可变**：严禁将 `.contrast-dual-pair` 篡改为单列类名（如 `contrast-split-row`）；
2. **三核心卡片不可省**：严禁省略「先抓骨架胶囊 (`.contrast-bone-capsule`)」、「逻辑推演链条列表 (`.contrast-skeleton-steplist`)」与「深度思考与随笔记录 (`.contrast-reflection-card`)」；
3. **左右栏不可合流**：严禁将左栏原文与右栏切片合并到同一列内；
4. **视觉回归机制**：任何前端更新或样式调整，必须以孙宇晨艾伦访谈专题 07 及财富自由第 1 期的左右双栏视图为基准进行视觉校验！
