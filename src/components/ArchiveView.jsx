import React, { useState } from 'react';
import { Calendar, Clock, Tag, ChevronRight, Archive, Sparkles } from 'lucide-react';

export default function ArchiveView({ posts, onSelectPost }) {
  const [selectedTag, setSelectedTag] = useState(null);

  // Filter posts if tag selected
  const filteredPosts = selectedTag
    ? posts.filter(p => p.tags.includes(selectedTag))
    : posts;

  // Group posts by Year
  const groupedByYear = filteredPosts.reduce((acc, post) => {
    const year = post.date.split('-')[0] || '2026';
    if (!acc[year]) acc[year] = [];
    acc[year].push(post);
    return acc;
  }, {});

  const years = Object.keys(groupedByYear).sort((a, b) => Number(b) - Number(a));

  // All tags
  const allTags = Array.from(new Set(posts.flatMap(p => p.tags || [])));

  return (
    <section className="archive-container animate-fade-in">
      <div className="section-intro">
        <div className="section-title-wrap">
          <span className="section-pretitle">CHRONOLOGICAL VAULT</span>
          <h1 className="section-title">岁月长河与归档</h1>
        </div>
        <p className="section-desc">
          时光如白驹过隙，每一篇留下的文字，都是思想在岁月河床里沉淀的一枚卵石。全站共计{' '}
          <strong>{posts.length}</strong> 篇文章。
        </p>

        {/* Tag Filter bar */}
        <div className="archive-tags-bar">
          <button
            className={`archive-tag-pill ${selectedTag === null ? 'active' : ''}`}
            onClick={() => setSelectedTag(null)}
          >
            全部文章 ({posts.length})
          </button>
          {allTags.map(tag => {
            const count = posts.filter(p => p.tags.includes(tag)).length;
            return (
              <button
                key={tag}
                className={`archive-tag-pill ${selectedTag === tag ? 'active' : ''}`}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              >
                #{tag} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="archive-timeline">
        {years.map(year => (
          <div key={year} className="archive-year-group">
            <div className="archive-year-marker">
              <span className="year-number">{year}</span>
              <span className="year-post-count">{groupedByYear[year].length} 篇文章</span>
            </div>

            <div className="archive-posts-list">
              {groupedByYear[year].map(post => (
                <article
                  key={post.slug}
                  className="archive-post-row"
                  onClick={() => onSelectPost(post)}
                >
                  <div className="archive-date-col">
                    <span className="archive-date-str">
                      {post.date.slice(5)} {/* MM-DD */}
                    </span>
                  </div>

                  <div className="archive-main-col">
                    <h3 className="archive-post-title">
                      <span>{post.title}</span>
                      {post.featured && (
                        <span className="archive-featured-dot" title="精选文章">
                          <Sparkles size={11} />
                        </span>
                      )}
                    </h3>
                    <div className="archive-post-meta">
                      <span className="archive-reading-time">
                        <Clock size={11} /> {post.readingTime} 分钟
                      </span>
                      <span className="meta-separator">·</span>
                      <div className="archive-tags">
                        {post.tags.map(t => (
                          <span key={t} className="archive-inline-tag">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="archive-arrow-col">
                    <ChevronRight size={16} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
