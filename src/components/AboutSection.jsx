import React from 'react';
import { Feather, Terminal, Compass, BookOpen, Mail, Heart, Sparkles, FolderGit2 } from 'lucide-react';

export default function AboutSection({ onOpenNewPost }) {
  return (
    <article className="about-page animate-fade-in">
      {/* Intro Header */}
      <header className="about-header">
        <div className="author-avatar-wrap">
          <div className="author-monogram">墨</div>
        </div>
        <div className="author-info">
          <span className="author-role">CREATOR & INDIE DEVELOPER</span>
          <h1 className="author-name">清墨 (InkMaster)</h1>
          <p className="author-tagline">
            手艺人、数字园丁、文字排版偏执狂。信奉“少，却更好”的克制之美。
          </p>
        </div>
      </header>

      {/* Manifesto */}
      <section className="about-block">
        <h2 className="about-block-title">
          <Compass size={18} />
          <span>建站宣言：为何在算法时代重拾独立写作？</span>
        </h2>
        <div className="about-prose">
          <p>
            我们生活在一个算法疯狂喂养注意力的年代。短视频在十几秒内撕扯感官，时间线以毫秒为单位更替，人们习惯了浮光掠影的碎片，却逐渐失去了坐下来读完一篇两万字长文的从容。
          </p>
          <p>
            搭建这个小站，是为了给自己筑造一处精神的防波堤。这里没有点赞排名的焦虑，没有算法推荐的绑架，只有白纸黑字、段落间的呼吸，以及对技术、设计与思想纯粹的凝视。
          </p>
          <blockquote className="editorial-quote">
            <div className="quote-ornament">“</div>
            <div className="quote-content">
              “我写作，不是为了向世界宣告什么，而是为了理清自己内心奔涌的迷茫与光线。”
            </div>
          </blockquote>
        </div>
      </section>

      {/* Principles */}
      <section className="about-block">
        <h2 className="about-block-title">
          <Feather size={18} />
          <span>三个创作法则</span>
        </h2>
        <div className="principles-grid">
          <div className="principle-card">
            <div className="principle-num">01</div>
            <h3>真诚与原创</h3>
            <p>不写人云亦云的空话，每篇文章都来自亲身的踩坑实践或深度的个人反思。</p>
          </div>
          <div className="principle-card">
            <div className="principle-num">02</div>
            <h3>克制与留白</h3>
            <p>重视排版呼吸感。代码追求正交与精炼，文字拒绝冗余注水。</p>
          </div>
          <div className="principle-card">
            <div className="principle-num">03</div>
            <h3>数据主权</h3>
            <p>100% 坚持本地 Markdown 纯文本管理，文字属于自己，永不依赖任何封闭平台。</p>
          </div>
        </div>
      </section>

      {/* Tech Stack & Workflow Guide */}
      <section className="about-block">
        <h2 className="about-block-title">
          <Terminal size={18} />
          <span>博客技术架构与本地写作流</span>
        </h2>
        <div className="tech-box">
          <ul className="tech-list">
            <li>
              <strong>前端工程：</strong> Vite + React 19，极速毫秒级热加载
            </li>
            <li>
              <strong>排版设计：</strong> 原生 Vanilla CSS，Newsreader + Noto Serif SC 中西文精心度量
            </li>
            <li>
              <strong>文章源文件：</strong> 存放在 <code>src/content/posts/*.md</code>，天然支持 Git 备份
            </li>
            <li>
              <strong>语法高亮：</strong> Highlight.js 深度定制暗黑/纸质代码主题
            </li>
          </ul>

          <div className="local-md-banner">
            <FolderGit2 size={24} className="banner-icon" />
            <div className="banner-text">
              <h4>想要添加你的新文章？</h4>
              <p>
                你既可以在 <code>src/content/posts/</code> 目录下直接新建 <code>.md</code> 文件，也可以点击上方导航栏的“<strong>写文章</strong>”按钮，通过内建编辑器实时预览并一键下载！
              </p>
            </div>
            <button className="primary-action-btn" onClick={onOpenNewPost}>
              立即起草文章
            </button>
          </div>
        </div>
      </section>

      {/* Social Links */}
      <section className="about-block">
        <h2 className="about-block-title">
          <Mail size={18} />
          <span>联络与交谈</span>
        </h2>
        <p className="about-prose">
          如果你对文章中的观点有任何启发，或者想探讨设计、技术与生活，随时欢迎来信交流：
        </p>
        <div className="social-links-row">
          <a href="https://github.com" target="_blank" rel="noreferrer" className="social-link-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
            <span>GitHub</span>
          </a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-link-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>Twitter / X</span>
          </a>
          <a href="mailto:hello@example.com" className="social-link-btn">
            <Mail size={16} />
            <span>邮箱来信</span>
          </a>
        </div>
      </section>
    </article>
  );
}
