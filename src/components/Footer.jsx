import React from 'react';
import { Feather, ArrowUp, Rss, Heart } from 'lucide-react';

export default function Footer({ totalPosts, totalWords, isZenMode }) {
  if (isZenMode) return null;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              <Feather size={16} />
              <span>墨语 · Ink & Thought</span>
            </div>
            <p className="footer-quote">
              “瞻彼阕者，虚室生白，吉祥止止。” —— 在喧嚣的信息洪流中，为文字与思考留一片开阔的留白。
            </p>
          </div>

          <div className="footer-stats">
            <div className="stat-pill">
              <span className="stat-label">收录文集</span>
              <span className="stat-val">{totalPosts} 篇</span>
            </div>
            <div className="stat-pill">
              <span className="stat-label">总字数约</span>
              <span className="stat-val">{(totalWords || 12000).toLocaleString()} 字</span>
            </div>
            <div className="stat-pill">
              <span className="stat-label">架构体系</span>
              <span className="stat-val">Markdown 原生</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copyright">
            <span>© {new Date().getFullYear()} 墨语博客. 由 Vite + React 驱动，以纯粹文字呈现。</span>
          </div>

          <div className="footer-actions">
            <a
              href="#rss"
              onClick={e => {
                e.preventDefault();
                alert('RSS 订阅源地址：/rss.xml (支持在 NetNewsWire、Feedly 等阅读器中订阅)');
              }}
              className="footer-link"
              title="RSS 订阅"
            >
              <Rss size={14} />
              <span>RSS 订阅</span>
            </a>

            <button className="back-to-top-btn" onClick={scrollToTop} aria-label="返回顶部">
              <ArrowUp size={14} />
              <span>回到顶部</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
