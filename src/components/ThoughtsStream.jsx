import React, { useState } from 'react';
import { Sparkles, MapPin, Clock, Plus, Send, Heart } from 'lucide-react';
import initialThoughts from '../content/thoughts.json';

export default function ThoughtsStream() {
  const [thoughts, setThoughts] = useState(() => {
    try {
      const saved = localStorage.getItem('ink_user_thoughts');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return initialThoughts;
  });

  const [newThought, setNewThought] = useState('');
  const [location, setLocation] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [likes, setLikes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ink_thought_likes') || '{}');
    } catch {
      return {};
    }
  });

  const handleAddThought = e => {
    e.preventDefault();
    if (!newThought.trim()) return;

    const now = new Date();
    const item = {
      id: `t-${Date.now()}`,
      date: now.toISOString().split('T')[0],
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      content: newThought.trim(),
      location: location.trim() || '书房',
    };

    const updated = [item, ...thoughts];
    setThoughts(updated);
    localStorage.setItem('ink_user_thoughts', JSON.stringify(updated));
    setNewThought('');
    setLocation('');
    setShowInput(false);
  };

  const handleToggleLike = id => {
    const updated = { ...likes, [id]: (likes[id] || 0) + 1 };
    setLikes(updated);
    localStorage.setItem('ink_thought_likes', JSON.stringify(updated));
  };

  return (
    <section className="thoughts-container">
      <div className="section-intro">
        <div className="section-title-wrap">
          <span className="section-pretitle">B-SIDES & VIGNETTES</span>
          <h1 className="section-title">灵感速记与碎片</h1>
        </div>
        <p className="section-desc">
          无需长篇大论。闪念的电光火石、偶遇的字句、黄昏的风与书页的翻动，皆是生活的微型诗。
        </p>

        <button
          className="add-thought-toggle-btn"
          onClick={() => setShowInput(!showInput)}
        >
          <Plus size={16} />
          <span>{showInput ? '收起编辑器' : '记下一则灵感'}</span>
        </button>
      </div>

      {showInput && (
        <form className="new-thought-form animate-fade-in" onSubmit={handleAddThought}>
          <textarea
            placeholder="记下此时此刻的思考、翻开书本看到的好句子..."
            value={newThought}
            onChange={e => setNewThought(e.target.value)}
            rows={3}
            required
          />
          <div className="form-actions">
            <input
              type="text"
              placeholder="地点或心境（例如：午后阳台、夜雨书房）"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="location-input"
            />
            <button type="submit" className="submit-thought-btn">
              <Send size={14} />
              <span>发布速记</span>
            </button>
          </div>
        </form>
      )}

      <div className="thoughts-timeline">
        {thoughts.length === 0 ? (
          <div className="empty-thoughts-box" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-medium)' }}>
            <Sparkles size={28} style={{ color: 'var(--accent-primary)', marginBottom: '0.75rem', opacity: 0.8 }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.45rem' }}>暂无速记碎片</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '38ch', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
              生活里的顿悟与灵感转瞬即逝。点击上方“记下一则灵感”，捕捉你的第一条思考记录。
            </p>
            <button className="submit-thought-btn" onClick={() => setShowInput(true)}>
              <Plus size={14} /> <span>立即起笔记录</span>
            </button>
          </div>
        ) : (
          thoughts.map((item, index) => (
            <article key={item.id} className="thought-card animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="thought-header">
                <span className="thought-meta">
                  <Clock size={12} />
                  <span>{item.date} {item.time}</span>
                </span>
                {item.location && (
                  <span className="thought-location">
                    <MapPin size={11} />
                    <span>{item.location}</span>
                  </span>
                )}
              </div>

              <p className="thought-content">{item.content}</p>

              <div className="thought-footer">
                <button
                  className={`like-chip-btn ${(likes[item.id] || 0) > 0 ? 'liked' : ''}`}
                  onClick={() => handleToggleLike(item.id)}
                  aria-label="点赞速记"
                >
                  <Heart size={13} fill={(likes[item.id] || 0) > 0 ? 'currentColor' : 'none'} />
                  <span>{(likes[item.id] || 0) > 0 ? likes[item.id] : '心动'}</span>
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
