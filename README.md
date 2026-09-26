# 墨语 · Ink & Thought

> 在喧嚣的信息洪流中，为文字与思考留一片开阔的留白。  
> 一个沉静、专注、追求排版美感的个人独立博客与数字花园。

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite)

---

## 🌟 博客特色与设计哲学

- **极简人文排版**：中文字体采用思源宋体（Noto Serif SC），西文字体搭配古典衬线体（Newsreader），中西文空格与标点经光学调校度量；
- **三套典雅主题**：白天纸白（Paper）、古典羊皮纸（Sepia）、暗夜黑曜石（Velvet Dark）；
- **纯本地 Markdown 驱动**：坚持数据主权，所有文章存放在 `src/content/posts/*.md`，无需数据库，天然支持 Git 版本控制与长期留存；
- **心流阅读体验**：大纲目录（TOC）平滑追踪、全局阅读进度条、代码语法高亮与一键复制；
- **经典研读文库**：收录并精译硅谷导师 Paul Graham（随笔写作法）与 Tim Urban（Wait But Why 深度长文）的代表作；
- **全局快捷搜索**：支持 `⌘K` / `Ctrl+K` 全文即时检索与标签过滤；
- **沉浸专注模式**：支持一键隐藏所有干扰元素，只留下纯粹的文字与思绪。

---

## 🚀 本地开发与启动

```bash
# 1. 安装依赖
npm install

# 2. 启动本地开发服务
npm run dev

# 3. 生产环境打包
npm run build
```

---

## ✍️ 如何添加新文章？

只需在 `src/content/posts/` 目录下新建一个 `.md` 文件，填写标准 Frontmatter 即可：

```markdown
---
title: "你的文章标题"
date: "2026-09-26"
tags: ["思考随笔", "认知思维"]
excerpt: "一两句话概括文章核心..."
featured: false
author: "你的笔名"
---

这里是你的 Markdown 正文内容...
```

Vite 会自动热加载并渲染在首页，提交并推送到 GitHub 后，Vercel 会在 30 秒内自动全网重新部署。

---

© 2026 墨语博客. 由 Vite + React 驱动，以纯粹文字呈现。
