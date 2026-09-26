import React, { useState } from 'react';
import WritingReferenceCard from './WritingReferenceCard';
import PostCard from './PostCard';
import { BookMarked, Sparkles, FolderDown, Compass, Award } from 'lucide-react';

export default function ReferenceSection({ posts, onSelectPost }) {
  const [selectedAuthor, setSelectedAuthor] = useState('all'); // 'all' | 'Paul Graham' | 'Tim Urban'

  // Filter only reference posts (slug starting with 'ref-' or tag '经典研读')
  const referencePosts = posts.filter(
    p => p.slug.startsWith('ref-') || (p.tags && p.tags.includes('经典研读'))
  );

  const filteredPosts = referencePosts.filter(p => {
    if (selectedAuthor === 'all') return true;
    return p.author.toLowerCase().includes(selectedAuthor.toLowerCase());
  });

  return (
    <section className="reference-page animate-fade-in">
      {/* Intro Header */}
      <div className="section-intro">
        <div className="section-title-wrap">
          <span className="section-pretitle">CANON & MASTERY</span>
          <h1 className="section-title">参考与经典研读</h1>
        </div>
        <p className="section-desc">
          好文章是一面明镜。向 <strong>Tim Urban</strong> 学习将抽象命题具象化与拟人化的场景构筑力；向{' '}
          <strong>Paul Graham</strong> 学习删繁就简、像说话一样写作的思辨穿透力。
        </p>

        {/* Filter Tabs */}
        <div className="ref-filter-row">
          <button
            className={`filter-pill ${selectedAuthor === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedAuthor('all')}
          >
            全部研读篇目 ({referencePosts.length})
          </button>
          <button
            className={`filter-pill ${selectedAuthor === 'Paul Graham' ? 'active' : ''}`}
            onClick={() => setSelectedAuthor('Paul Graham')}
          >
            Paul Graham 随笔 (2 篇)
          </button>
          <button
            className={`filter-pill ${selectedAuthor === 'Tim Urban' ? 'active' : ''}`}
            onClick={() => setSelectedAuthor('Tim Urban')}
          >
            Tim Urban 深度长文 (3 篇)
          </button>
        </div>
      </div>

      {/* Embedded Top Reference Methodology Card */}
      <WritingReferenceCard />

      {/* Translated Masterworks Grid */}
      <div className="ref-posts-section">
        <div className="ref-section-heading">
          <Award size={18} className="award-icon" />
          <h2>代表作中文精译文库</h2>
        </div>

        <div className="posts-grid">
          {filteredPosts.map((post, idx) => (
            <div
              key={post.slug}
              className="animate-fade-in"
              style={{ animationDelay: `${idx * 0.08}s` }}
            >
              <PostCard
                post={post}
                onSelectPost={onSelectPost}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Downloaded Offline Kit Reminder */}
      <div className="local-md-banner" style={{ marginTop: '3.5rem' }}>
        <FolderDown size={24} className="banner-icon" />
        <div className="banner-text">
          <h4>离线研读包已归档至本地</h4>
          <p>
            上述代表作的完整中英文对照原稿与写作方法论，已自动保存在你的电脑目录：
            <br />
            <code>~/Downloads/博客研读代表作/</code>
          </p>
        </div>
      </div>
    </section>
  );
}
