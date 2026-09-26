import React, { useState } from 'react';
import { BookMarked, ChevronDown, ChevronUp, Sparkles, CheckCircle2, ExternalLink, Lightbulb } from 'lucide-react';

export default function WritingReferenceCard() {
  const [expanded, setExpanded] = useState(true);

  return (
    <aside className="writing-ref-card animate-fade-in" aria-label="写作参考卡片">
      <div
        className="ref-card-header"
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
      >
        <div className="ref-header-left">
          <div className="ref-badge">
            <BookMarked size={14} />
            <span>写作心法与参考卡片</span>
          </div>
          <h2 className="ref-title">参考谁 · 学什么 · 看哪篇</h2>
        </div>

        <button className="ref-toggle-btn" aria-label={expanded ? '收起卡片' : '展开卡片'}>
          <span className="toggle-text">{expanded ? '收起指南' : '展开研读卡片'}</span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div className="ref-card-body animate-slide-down">
          {/* Author Comparison Table */}
          <div className="ref-grid">
            <div className="ref-author-box tim-box">
              <div className="author-tag-row">
                <span className="author-name-tag">Tim Urban</span>
                <span className="author-role-sub">Wait But Why 创始人</span>
              </div>
              <h3 className="ref-core-thesis">认知降维与场景化拟人</h3>
              <ul className="ref-learn-list">
                <li>
                  <strong>真实困惑切入：</strong>从自己切身的尴尬与迷茫引出话题，消解说教感。
                </li>
                <li>
                  <strong>概念具象拟人：</strong>用“即时满足猴子”、“恐慌怪兽”等拟人化形象讲透抽象心理学。
                </li>
                <li>
                  <strong>生动画卷代替道理：</strong>道理讲一次容易忘，但鲜明的场景能让读者记很多年。
                </li>
              </ul>
              <div className="ref-works-row">
                <span className="works-label">研读代表作：</span>
                <span className="work-item">《Why Procrastinators Procrastinate》</span>
                <span className="work-item">《The Fermi Paradox》</span>
                <span className="work-item">《The AI Revolution》</span>
              </div>
            </div>

            <div className="ref-author-box paul-box">
              <div className="author-tag-row">
                <span className="author-name-tag">Paul Graham</span>
                <span className="author-role-sub">YC 创始人 / 随笔作家</span>
              </div>
              <h3 className="ref-core-thesis">口语化思辨与逻辑咬合</h3>
              <ul className="ref-learn-list">
                <li>
                  <strong>像说话一样写作：</strong>极简口语化文风，复杂的事不需要复杂的句子。
                </li>
                <li>
                  <strong>好奇心驱动探索：</strong>从一个让自己好奇的现象出发，边探索边追问本质。
                </li>
                <li>
                  <strong>反复推敲直到咬合：</strong>先快速写下真实想法，再不断删减多余废话直到逻辑咬合。
                </li>
              </ul>
              <div className="ref-works-row">
                <span className="works-label">研读代表作：</span>
                <span className="work-item">《The Age of the Essay》</span>
                <span className="work-item">《Writing, Briefly》</span>
              </div>
            </div>
          </div>

          {/* 5-minute pre-writing checklist */}
          <div className="checklist-box">
            <div className="checklist-header">
              <CheckCircle2 size={16} className="checklist-icon" />
              <span>每次下笔前的 5 分钟自检清单：</span>
            </div>
            <div className="checklist-items">
              <span className="check-chip">1. 切入点是否真实？</span>
              <span className="check-chip">2. 是否有具象的类比或场景？</span>
              <span className="check-chip">3. 念出声是否像在说话？</span>
              <span className="check-chip">4. 能否再删掉 20% 的冗余废话？</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
