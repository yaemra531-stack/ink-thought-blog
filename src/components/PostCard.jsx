import React from 'react';
import { Calendar, Clock, ArrowUpRight, Sparkles, FileText } from 'lucide-react';

export default function PostCard({ post, onSelectPost, onTagClick }) {
  return (
    <article
      className="post-card"
      onClick={() => onSelectPost(post)}
      tabIndex={0}
      role="button"
      onKeyDown={e => {
        if (e.key === 'Enter') onSelectPost(post);
      }}
    >
      <div className="post-card-meta">
        <div className="meta-left">
          <span className="meta-item">
            <Calendar size={13} />
            <time dateTime={post.date}>{post.date}</time>
          </span>
          <span className="meta-separator">·</span>
          <span className="meta-item">
            <Clock size={13} />
            <span>约 {post.readingTime} 分钟</span>
          </span>
        </div>

        {post.featured && (
          <span className="featured-badge">
            <Sparkles size={11} />
            <span>精选</span>
          </span>
        )}
        {post.isCustomDraft && (
          <span className="draft-badge">
            <FileText size={11} />
            <span>本地草稿</span>
          </span>
        )}
      </div>

      <h2 className="post-card-title">
        <span>{post.title}</span>
        <ArrowUpRight size={18} className="post-arrow" />
      </h2>

      <p className="post-card-excerpt">{post.excerpt}</p>

      <div className="post-card-footer">
        <div className="post-card-tags" onClick={e => e.stopPropagation()}>
          {post.tags.map(tag => (
            <span
              key={tag}
              className="tag-chip"
              onClick={() => onTagClick && onTagClick(tag)}
            >
              #{tag}
            </span>
          ))}
        </div>

        <span className="read-more-text">
          阅读全文 <span className="read-more-arrow">→</span>
        </span>
      </div>
    </article>
  );
}
