# 墨语 · Ink & Thought

> 在喧嚣的信息洪流中，为文字与思考留一片开阔的留白。  
> 线上公开访问地址：[https://yaemra531-stack.github.io/ink-thought-blog/](https://yaemra531-stack.github.io/ink-thought-blog/)

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite)
![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub_Pages-22c55e?logo=github)

---

## 为什么会有这个项目？

这是我正在构建的个人创作与认知演进体系中的一个新系统。

在此之前，我已经开发并开源了另一个项目：[**雅思 AI 图文工作台（ielts-content-workbench）**](https://github.com/yaemra531-stack/ielts-content-workbench)。那是一个专门针对小红书平台、面向高频实操的图文创作系统，核心目标是记录我亲自用 AI 备考雅思、拆解题目、测试卡点的全过程。

但随着探索的深入，我愈发强烈地感受到：**碎片化的平台图文，装不下那些需要长线沉淀与反复咀嚼的思考。**

于是有了现在的「墨语 · Ink & Thought」。

---

## 两套系统的分工与互补

我和 AI 正在同步推进这两套截然不同、却又彼此滋养的系统：

| 系统名称 | 核心阵地 | 承载内容与使命 | 交互节奏 |
| :--- | :--- | :--- | :--- |
| **[系统 A：雅思 AI 图文工作台](https://github.com/yaemra531-stack/ielts-content-workbench)** | 小红书 / 社交媒体 | 面向具体场景的**行动实践**。真实记录用 AI 解决雅思学习问题的踩坑、验证、出图与成文。 | 高频、短周期、重在执行与反馈 |
| **[系统 B：墨语个人独立博客](https://github.com/yaemra531-stack/ink-thought-blog)** | 独立站点 / 个人自留地 | 面向心智模型的**深度思考**。记录每天想法的变化、工具之道的反思、方法论的沉淀以及慢思考随笔。 | 沉静、长周期、重在溯源与本质 |

一个往外走，连接真实的社交受众与学习场景；一个往内走，构建自己的数字花园与精神锚点。

---

## 坦率的自白：关于价值与需求的演进

坦率地说，站在今天这个时间节点上，我其实也还没完全想透它们最终的商业价值到底有多大，甚至它们最精确的终极需求是什么，我也一直在持续叩问和推敲。

但我坚信几件事：

1. **先在真实的场景里把系统搭起来**：闭门空想需求永远想不明白，唯有自己每天真真切切地使用它、被它卡住、再在迭代中修剪它，系统的生命力才会长出来。
2. **从模糊印象走向硬核产品**：不追求一开局就很完美，但要保证每一次修改都在往更深的需求层面推进。
3. **相信持续迭代的力量**：无论是雅思工作台还是这个博客系统，只要我保持高密度的输入、思考与公开输出，通过两套系统的交叉演进，它们最终一定会变得非常强大、非常有价值。

接下来的时间里，我会先把这两个系统彻底搭扎实、用顺手；随后我会把两套系统的代码仓库与实测数据完整交给 AI 进行全局交叉分析，深入研讨它们能够衍生出的独特生态价值，探索它们未来该如何生长。

---

## 本项目的核心特色

- **人文排版美感**：中文采用思源宋体（Noto Serif SC），西文采用古典衬线体（Newsreader），字距与行高经光学调校，留出大片呼吸空间；
- **三套阅读主题**：日间纸白（Paper）、古典羊皮纸（Sepia）、暗夜黑曜石（Velvet Dark）；
- **纯本地 Markdown 驱动**：坚持数据主权，所有文章存放在 `src/content/posts/*.md`，天然配合 Git 版本控制与长期留存；
- **经典研读文库**：收录并精译了 **Paul Graham**（《如何简练写作》、《随笔的时代》）与 **Tim Urban**（《为什么拖延者总在拖延》、《费米悖论》、《人工智能革命》）等大师的代表作与写作参考卡片；
- **极简无感部署**：基于 GitHub Actions 自动化编译，本地每次写完 `git push`，GitHub Pages 会在几十秒内自动完成全网上线。

---

## 当前已收录精选

- 🌟 **《一份教程，其实是四份教程》**（首页头条）：反思“看懂一份教程”与“走完一件事”之间的巨大鸿沟，剖析规划谬误、侯世达定律与时间盒实战；
- 📖 **经典研读**：Paul Graham 与 Tim Urban 写作心法精要及代表作中文全本。

---

## 本地开发与工作流

```bash
# 1. 克隆仓库
git clone https://github.com/yaemra531-stack/ink-thought-blog.git
cd ink-thought-blog

# 2. 安装依赖并启动本地预览
npm install
npm run dev

# 3. 添加新文章
# 直接在 src/content/posts/ 下新建 .md 文件，提交并推送到 main 分支即可全网自动发布：
git add .
git commit -m "feat: 发布新随笔"
git push
```

---

© 2026 墨语博客. 由 Vite + React 驱动，以纯粹文字呈现。
