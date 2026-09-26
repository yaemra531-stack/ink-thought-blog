import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Calendar, Clock, ArrowRight, Tag } from 'lucide-react';

export default function SearchModal({ isOpen, onClose, posts, onSelectPost }) {
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const inputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedTag(null);
    }
  }, [isOpen]);

  // Handle escape
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Extract all unique tags
  const allTags = Array.from(
    new Set(posts.flatMap(p => p.tags || []))
  );

  // Filter posts
  const filtered = posts.filter(post => {
    const matchesTag = !selectedTag || post.tags.includes(selectedTag);
    if (!matchesTag) return false;

    if (!query.trim()) return true;

    const q = query.toLowerCase();
    const titleMatch = post.title.toLowerCase().includes(q);
    const excerptMatch = post.excerpt.toLowerCase().includes(q);
    const contentMatch = post.content.toLowerCase().includes(q);
    const tagMatch = post.tags.some(t => t.toLowerCase().includes(q));

    return titleMatch || excerptMatch || contentMatch || tagMatch;
  });

  return (
    <div className="search-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="search-modal animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="search-input-header">
          <Search size={20} className="search-icon-inside" />
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="搜索文章标题、内容、思考或标签..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button className="clear-btn" onClick={() => setQuery('')} aria-label="清除输入">
              <X size={16} />
            </button>
          )}
          <button className="close-modal-btn" onClick={onClose} aria-label="关闭搜索">
            <span className="kbd-badge">ESC</span>
          </button>
        </div>

        {/* Tag chips in search */}
        <div className="search-tags-bar">
          <span className="tags-label">
            <Tag size={12} />
            <span>分类过滤:</span>
          </span>
          <button
            className={`search-tag-chip ${selectedTag === null ? 'active' : ''}`}
            onClick={() => setSelectedTag(null)}
          >
            全部
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              className={`search-tag-chip ${selectedTag === tag ? 'active' : ''}`}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* Search Results */}
        <div className="search-results-list">
          {filtered.length === 0 ? (
            <div className="search-empty-state">
              <p>未找到与 “{query}” 相关的文章</p>
              <span>不妨尝试搜索关键字如 “排版”、“留白”、“专注” 或切换标签</span>
            </div>
          ) : (
            filtered.map(post => (
              <div
                key={post.slug}
                className="search-result-item"
                onClick={() => {
                  onSelectPost(post);
                  onClose();
                }}
              >
                <div className="result-main">
                  <div className="result-meta">
                    <span className="result-date">
                      <Calendar size={12} /> {post.date}
                    </span>
                    <span className="result-time">
                      <Clock size={12} /> {post.readingTime} 分钟阅读
                    </span>
                  </div>
                  <h4 className="result-title">{post.title}</h4>
                  <p className="result-excerpt">{post.excerpt}</p>
                </div>
                <div className="result-action">
                  <ArrowRight size={16} />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="search-footer-hint">
          <span>
            已找到 <strong>{filtered.length}</strong> 篇文章
          </span>
          <span className="shortcut-tips">使用 ↑ ↓ 导航，回车进入</span>
        </div>
      </div>
    </div>
  );
}
