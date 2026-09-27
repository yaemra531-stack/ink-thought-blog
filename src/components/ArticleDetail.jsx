import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  PenLine,
  Calendar,
  Clock,
  BookOpen,
  Share2,
  Heart,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  List
} from 'lucide-react';
import { renderMarkdown, extractHeadings } from '../utils/markdownParser';
import TableOfContents from './TableOfContents';

export default function ArticleDetail({
  post,
  allPosts,
  onBack,
  onSelectPost,
  isZenMode,
  setIsZenMode,
  onTogglePrefs,
  onEditPost,
}) {
  const [likes, setLikes] = useState(() => {
    try {
      const saved = localStorage.getItem(`ink_likes_${post.slug}`);
      return saved ? parseInt(saved, 10) : 12;
    } catch {
      return 12;
    }
  });
  const [hasLiked, setHasLiked] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  const headings = extractHeadings(post.content);
  const htmlContent = renderMarkdown(post.content);

  // Find previous and next articles
  const currentIndex = allPosts.findIndex(p => p.slug === post.slug);
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  // Scroll to top when post changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [post.slug]);

  // Bind code block copy buttons
  useEffect(() => {
    const handleCodeCopy = e => {
      const btn = e.target.closest('.copy-code-btn');
      if (!btn) return;

      const codeRaw = btn.getAttribute('data-code');
      if (codeRaw) {
        navigator.clipboard.writeText(decodeURIComponent(codeRaw));
        const span = btn.querySelector('span');
        if (span) {
          const original = span.textContent;
          span.textContent = '已复制!';
          btn.style.color = '#10B981';
          setTimeout(() => {
            span.textContent = original;
            btn.style.color = '';
          }, 2000);
        }
      }
    };

    document.addEventListener('click', handleCodeCopy);
    return () => document.removeEventListener('click', handleCodeCopy);
  }, [htmlContent]);

  const handleLike = () => {
    const newCount = likes + 1;
    setLikes(newCount);
    setHasLiked(true);
    try {
      localStorage.setItem(`ink_likes_${post.slug}`, newCount.toString());
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  return (
    <article className={`article-detail-view ${isZenMode ? 'zen-reading' : ''}`}>
      {/* Top Utility Bar */}
      <div className="article-top-toolbar">
        <button className="back-nav-btn" onClick={onBack} aria-label="返回文章列表">
          <ArrowLeft size={16} />
          <span>返回文集</span>
        </button>

        <div className="article-top-actions">
          {headings.length > 0 && (
            <button
              className="action-pill-btn mobile-toc-toggle"
              onClick={() => setMobileTocOpen(!mobileTocOpen)}
              title="查看文章目录"
            >
              <List size={15} />
              <span>目录</span>
            </button>
          )}

          <button
            className="action-pill-btn"
            onClick={() => setIsZenMode(!isZenMode)}
            title={isZenMode ? '退出专注模式' : '开启沉浸专注模式'}
          >
            {isZenMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span>{isZenMode ? '退出专注' : '专注模式'}</span>
          </button>

          <button
            className="action-pill-btn"
            onClick={() => onEditPost && onEditPost(post)}
            title="编辑修改文章内容"
          >
            <PenLine size={15} />
            <span>编辑文章</span>
          </button>

          <button
            className="action-pill-btn"
            onClick={handleShare}
            title="分享文章链接"
          >
            {shareCopied ? <Check size={15} /> : <Share2 size={15} />}
            <span>{shareCopied ? '链接已复制！' : '分享'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Collapsible TOC Drawer */}
      {mobileTocOpen && (
        <div className="mobile-toc-wrapper animate-slide-down">
          <TableOfContents
            headings={headings}
            isMobileDrawer={true}
            onClose={() => setMobileTocOpen(false)}
          />
        </div>
      )}

      {/* Main Layout: Article + Sidebar TOC */}
      <div className="article-layout-grid">
        <div className="article-main-body">
          {/* Header */}
          <header className="article-hero-header">
            <div className="article-meta-tags">
              {post.tags.map(tag => (
                <span key={tag} className="tag-chip">
                  #{tag}
                </span>
              ))}
            </div>

            <h1 className="article-title">{post.title}</h1>

            <div className="article-byline">
              <div className="byline-item">
                <Calendar size={14} />
                <time dateTime={post.date}>{post.date}</time>
              </div>
              <span className="byline-sep">·</span>
              <div className="byline-item">
                <Clock size={14} />
                <span>约 {post.readingTime} 分钟阅读</span>
              </div>
              <span className="byline-sep">·</span>
              <div className="byline-item">
                <BookOpen size={14} />
                <span>共 {post.wordCount} 字</span>
              </div>
              <span className="byline-sep">·</span>
              <div className="byline-item author-byline">
                <span>文 / {post.author}</span>
              </div>
            </div>

            {post.excerpt && (
              <div className="article-lead-excerpt">
                <p>{post.excerpt}</p>
              </div>
            )}
          </header>

          <div className="article-divider-ornament">
            <span>✤</span>
          </div>

          {/* Rendered HTML */}
          <div
            className="article-content"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* Article Footer & Interactions */}
          <footer className="article-bottom-section">
            <div className="interaction-row">
              <button
                className={`like-button ${hasLiked ? 'liked' : ''}`}
                onClick={handleLike}
                aria-label="为本文鼓掌"
              >
                <Heart size={18} fill={hasLiked ? 'currentColor' : 'none'} />
                <span>喜欢与鼓掌 ({likes})</span>
              </button>

              <button className="share-bottom-btn" onClick={handleShare}>
                <Share2 size={16} />
                <span>{shareCopied ? '已复制分享链接！' : '分享此篇给朋友'}</span>
              </button>
            </div>

            {/* Author Vignette Card */}
            <div className="author-card-vignette">
              <div className="author-vignette-avatar">墨</div>
              <div className="author-vignette-content">
                <h4>{post.author || '清墨'}</h4>
                <p>
                  记录技术、设计与生活中的微小顿悟。坚持本地纯文本写作，用文字构筑自留地。
                </p>
              </div>
            </div>

            {/* Previous / Next Navigation */}
            <nav className="prev-next-nav" aria-label="相邻文章导航">
              {prevPost ? (
                <div
                  className="nav-card prev-card"
                  onClick={() => onSelectPost(prevPost)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="nav-card-label">
                    <ChevronLeft size={14} />
                    <span>上一篇</span>
                  </div>
                  <h4 className="nav-card-title">{prevPost.title}</h4>
                </div>
              ) : (
                <div className="nav-card empty" />
              )}

              {nextPost ? (
                <div
                  className="nav-card next-card"
                  onClick={() => onSelectPost(nextPost)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="nav-card-label">
                    <span>下一篇</span>
                    <ChevronRight size={14} />
                  </div>
                  <h4 className="nav-card-title">{nextPost.title}</h4>
                </div>
              ) : (
                <div className="nav-card empty" />
              )}
            </nav>
          </footer>
        </div>

        {/* Desktop Sidebar TOC */}
        {!isZenMode && headings.length > 0 && (
          <aside className="article-sidebar-toc">
            <div className="sticky-toc-box">
              <TableOfContents headings={headings} />
            </div>
          </aside>
        )}
      </div>
    </article>
  );
}
