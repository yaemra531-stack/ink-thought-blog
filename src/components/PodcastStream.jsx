import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Headphones,
  Moon,
  Search,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCcw,
  Send,
  SlidersHorizontal,
} from 'lucide-react';
import podcastsIndex from '../content/podcastsIndex.json';
import { renderMarkdown } from '../utils/markdownParser';

// 懒加载所有分篇 Markdown 文本（Vite 会按需分包，不占用首页打包体积）
const podcastModules = import.meta.glob('/src/content/podcasts/*.md', {
  query: '?raw',
  import: 'default',
});

export default function PodcastStream({ isAuthor, onToggleAuthorMode }) {
  // 当前选中的篇目 ID（默认从 localStorage 读取上次阅读，没有则默认第 006 篇创刊词）
  const [activeEpisodeId, setActiveEpisodeId] = useState(() => {
    try {
      const saved = localStorage.getItem('ink_podcast_last_read');
      if (saved && podcastsIndex.some(p => p.id === saved)) {
        return saved;
      }
    } catch {}
    return '006';
  });

  // 是否处于全屏沉浸阅读态（在移动端或专注模式下隐藏目录）
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [currentEpisodeContent, setCurrentEpisodeContent] = useState('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // 搜索与栏目筛选
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColumn, setSelectedColumn] = useState('全部');

  // 读者睡前随手批注
  const [nightNote, setNightNote] = useState('');
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);

  // 已读打卡记录（存储在 localStorage）
  const [readEpisodeIds, setReadEpisodeIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ink_podcast_read_history') || '[]');
    } catch {
      return [];
    }
  });

  const contentRef = useRef(null);

  // 提取全部栏目分类
  const columnsList = useMemo(() => {
    const set = new Set();
    podcastsIndex.forEach(p => {
      if (p.column && p.column !== '漫谈') set.add(p.column);
    });
    return ['全部', '创刊词', '战略', '90后不买房', '比特币', '全球流动性过剩', '医疗', '番外', ...Array.from(set).filter(c => !['全部', '创刊词', '战略', '90后不买房', '比特币', '全球流动性过剩', '医疗', '番外'].includes(c))];
  }, []);

  // 过滤篇目列表
  const filteredEpisodes = useMemo(() => {
    return podcastsIndex.filter(item => {
      const matchesSearch =
        !searchQuery ||
        item.id.includes(searchQuery) ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.column.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesColumn =
        selectedColumn === '全部' ||
        item.column === selectedColumn ||
        (selectedColumn === '90后' && item.column.includes('90后'));

      return matchesSearch && matchesColumn;
    });
  }, [searchQuery, selectedColumn]);

  // 获取当前正在阅读的篇目元数据
  const activeEpisode = useMemo(() => {
    return podcastsIndex.find(p => p.id === activeEpisodeId) || podcastsIndex[0];
  }, [activeEpisodeId]);

  // 加载当前选中篇目的正文内容
  useEffect(() => {
    if (!activeEpisode) return;

    let isMounted = true;
    setIsLoadingContent(true);

    const loadContent = async () => {
      const filePath = `/src/content/podcasts/${activeEpisode.filename}`;
      const loader = podcastModules[filePath];
      if (loader) {
        try {
          const raw = await loader();
          if (isMounted) {
            setCurrentEpisodeContent(raw);
            setIsLoadingContent(false);
          }
        } catch (err) {
          console.error('加载逐字稿失败', err);
          if (isMounted) {
            setCurrentEpisodeContent('### 加载失败\n未能读取该篇逐字稿文件，请稍后重试。');
            setIsLoadingContent(false);
          }
        }
      } else {
        if (isMounted) {
          setCurrentEpisodeContent('### 未找到该篇逐字稿\n文件路径不存在。');
          setIsLoadingContent(false);
        }
      }
    };

    loadContent();

    // 更新最近阅读位置
    localStorage.setItem('ink_podcast_last_read', activeEpisode.id);

    // 回滚正文到顶部
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return () => {
      isMounted = false;
    };
  }, [activeEpisodeId, activeEpisode]);

  // 标记当前篇目为已读/未读切换
  const toggleMarkRead = (id) => {
    setReadEpisodeIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('ink_podcast_read_history', JSON.stringify(next));
      return next;
    });
  };

  // 切换上一篇/下一篇
  const currentIndex = podcastsIndex.findIndex(p => p.id === activeEpisodeId);
  const prevEpisode = currentIndex > 0 ? podcastsIndex[currentIndex - 1] : null;
  const nextEpisode = currentIndex < podcastsIndex.length - 1 ? podcastsIndex[currentIndex + 1] : null;

  const handleSelectEpisode = (id) => {
    setActiveEpisodeId(id);
    setIsReadingMode(true);
  };

  // 保存深夜随笔批注到博客「速记」
  const handleSaveNightNote = () => {
    if (!nightNote.trim()) return;

    const noteText = `【夜读批注 · ${activeEpisode.id} ${activeEpisode.title}】\n${nightNote.trim()}`;
    const newThought = {
      id: `t-night-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      content: noteText,
      location: `睡前夜读 · 第${activeEpisode.id}篇`,
    };

    try {
      const existing = JSON.parse(localStorage.getItem('ink_user_thoughts') || '[]');
      existing.unshift(newThought);
      localStorage.setItem('ink_user_thoughts', JSON.stringify(existing));

      // 若有云端 API 同步机制则触发
      fetch('https://creator-api-worker.yaemra531.workers.dev/api/thoughts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newThought),
      }).catch(() => {});

      setNoteSavedFeedback(true);
      setNightNote('');
      setTimeout(() => setNoteSavedFeedback(false), 2500);
    } catch (e) {
      console.error('保存夜读随笔失败', e);
    }
  };

  // 格式化正文 Markdown：给讲话人（如 **讲话人1**）加上高亮类名，使排版极具播客现场感
  const formattedHtml = useMemo(() => {
    if (!currentEpisodeContent) return '';
    let processed = currentEpisodeContent;

    // 清理顶部的重复大标题（页面已有精致标题栏）
    processed = processed.replace(/^#\s+.*?\n+/, '');
    processed = processed.replace(/^>\s+出自.*?合集.*?\n+/, '');

    // 将 **讲话人1**（0:15）转为专门的对话者徽标
    processed = processed.replace(
      /\*\*讲话人1\*\*\s*（(\d+:\d+)）/g,
      '<div class="speaker-bubble speaker-sun"><span class="speaker-name">孙宇晨</span><span class="speaker-time">$1</span></div>'
    );
    processed = processed.replace(
      /\*\*讲话人2\*\*\s*（(\d+:\d+)）/g,
      '<div class="speaker-bubble speaker-host"><span class="speaker-name">访谈对话</span><span class="speaker-time">$1</span></div>'
    );

    return renderMarkdown(processed);
  }, [currentEpisodeContent]);

  return (
    <div className="podcast-container animate-fade-in">
      {/* 顶部总览区：左上角原封不动初衷 + 右侧阅读锚点 */}
      <div className="podcast-header-grid">
        {/* 左上角：认知降温 · 原文初衷 */}
        <div className="podcast-mindset-card">
          <div className="podcast-mindset-header">
            <div className="podcast-moon-badge">
              <Moon size={15} />
            </div>
            <span className="podcast-mindset-title">认知降温 · 睡前听读初衷</span>
          </div>
          <div className="podcast-mindset-content">
            <p className="podcast-mindset-p">
              深夜睡不着时，看未知的新东西会激发多巴胺和求知欲，导致大脑过度兴奋更睡不着；但如果什么都不看硬躺着，又会陷入焦虑的反刍。
            </p>
            <p className="podcast-mindset-p highlight">
              听过、熟悉、不带压迫感，但本身又有思维密度的内容，恰好是最好的“思维滑梯”——既没有新鲜感的刺激，又能在熟悉的语境里自然平复心率与脑电波，不知不觉产生睡意。
            </p>
          </div>
        </div>

        {/* 右上角：最近阅读锚点与总览 */}
        <div className="podcast-status-card">
          <div className="podcast-status-top">
            <div className="podcast-status-stats">
              <span className="podcast-chip-primary">
                <Headphones size={13} />
                <span>154 篇全量收录</span>
              </span>
              <span className="podcast-chip-muted">
                <CheckCircle2 size={13} />
                <span>已读 {readEpisodeIds.length} / 154</span>
              </span>
            </div>
          </div>

          <div className="podcast-anchor-box">
            <div className="podcast-anchor-label">
              <Clock size={14} />
              <span>昨晚读到这里：</span>
            </div>
            <div className="podcast-anchor-title">
              <strong>#{activeEpisode.id}</strong> {activeEpisode.fullTitle}
            </div>
            <button
              type="button"
              className="podcast-btn-resume"
              onClick={() => setIsReadingMode(true)}
            >
              <span>沉浸阅读</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 主工作台：左侧目录 + 右侧正文 */}
      <div className={`podcast-workspace ${isReadingMode ? 'focus-reading' : ''}`}>
        {/* 目录侧边栏 */}
        <aside className="podcast-sidebar">
          {/* 搜索与栏目快速过滤 */}
          <div className="podcast-sidebar-filter">
            <div className="podcast-search-wrap">
              <Search size={14} className="podcast-search-icon" />
              <input
                type="text"
                placeholder="搜索编号或主题..."
                className="podcast-search-input"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="podcast-search-clear"
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="podcast-columns-pills">
              {columnsList.slice(0, 10).map(col => (
                <button
                  key={col}
                  type="button"
                  className={`podcast-pill ${selectedColumn === col ? 'active' : ''}`}
                  onClick={() => setSelectedColumn(col)}
                >
                  {col}
                </button>
              ))}
            </div>
          </div>

          {/* 篇目列表 */}
          <div className="podcast-list-scroll">
            {filteredEpisodes.length === 0 ? (
              <div className="podcast-empty-tip">未找到匹配篇目</div>
            ) : (
              filteredEpisodes.map(item => {
                const isActive = item.id === activeEpisodeId;
                const isRead = readEpisodeIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`podcast-item-card ${isActive ? 'is-active' : ''} ${isRead ? 'is-read' : ''}`}
                    onClick={() => handleSelectEpisode(item.id)}
                  >
                    <div className="podcast-item-header">
                      <span className="podcast-item-id">#{item.id}</span>
                      <span className="podcast-item-col">{item.column}</span>
                      {isRead && <span className="podcast-read-badge">✓ 已过一遍</span>}
                    </div>
                    <div className="podcast-item-title">{item.title}</div>
                    <div className="podcast-item-meta">
                      <span>{item.wordCount} 字</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* 逐字稿正文沉浸阅读区 */}
        <section className="podcast-main-reader" ref={contentRef}>
          {/* 阅读器顶部控制条 */}
          <div className="podcast-reader-topbar">
            <div className="podcast-reader-nav-btns">
              <button
                type="button"
                className="podcast-nav-btn"
                disabled={!prevEpisode}
                onClick={() => prevEpisode && setActiveEpisodeId(prevEpisode.id)}
                title="上一篇"
              >
                <ChevronLeft size={16} />
                <span>上一篇</span>
              </button>

              <button
                type="button"
                className="podcast-nav-btn"
                disabled={!nextEpisode}
                onClick={() => nextEpisode && setActiveEpisodeId(nextEpisode.id)}
                title="下一篇"
              >
                <span>下一篇</span>
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="podcast-reader-actions">
              <button
                type="button"
                className={`podcast-action-btn ${readEpisodeIds.includes(activeEpisode.id) ? 'active' : ''}`}
                onClick={() => toggleMarkRead(activeEpisode.id)}
                title="标记为今晚已读完"
              >
                <CheckCircle2 size={15} />
                <span>{readEpisodeIds.includes(activeEpisode.id) ? '已读完' : '标为已读'}</span>
              </button>
            </div>
          </div>

          {/* 文章元信息 */}
          <div className="podcast-article-header">
            <div className="podcast-article-tags">
              <span className="podcast-article-num">第 {activeEpisode.id} 篇</span>
              <span className="podcast-article-column-tag">{activeEpisode.column}</span>
              <span className="podcast-article-words">{activeEpisode.wordCount} 字 · 听力对谈逐字稿</span>
            </div>
            <h1 className="podcast-article-h1">{activeEpisode.fullTitle}</h1>
          </div>

          {/* 逐字稿正文主体 */}
          {isLoadingContent ? (
            <div className="podcast-loading">
              <Moon size={24} className="animate-spin text-amber-500" />
              <p>正在舒缓翻开逐字稿...</p>
            </div>
          ) : (
            <div
              className="podcast-transcript-body"
              dangerouslySetInnerHTML={{ __html: formattedHtml }}
            />
          )}

          {/* 文章底部翻页导航 */}
          <div className="podcast-reader-footer-nav">
            {prevEpisode ? (
              <button
                type="button"
                className="podcast-footer-card prev"
                onClick={() => setActiveEpisodeId(prevEpisode.id)}
              >
                <span className="nav-dir">← 上一篇 (#{prevEpisode.id})</span>
                <span className="nav-title">{prevEpisode.title}</span>
              </button>
            ) : <div />}

            {nextEpisode && (
              <button
                type="button"
                className="podcast-footer-card next"
                onClick={() => setActiveEpisodeId(nextEpisode.id)}
              >
                <span className="nav-dir">下一篇 (#{nextEpisode.id}) →</span>
                <span className="nav-title">{nextEpisode.title}</span>
              </button>
            )}
          </div>

          {/* 底部随手夜注区域 */}
          <div className="podcast-night-notes-box">
            <div className="podcast-note-header">
              <Sparkles size={16} className="text-amber-500" />
              <span>深夜闪念 · 随手批注</span>
              <span className="podcast-note-tip">（若读到哪句话有触动，顺手敲一句，会自动沉淀到博客速记里）</span>
            </div>
            <div className="podcast-note-input-row">
              <textarea
                className="podcast-note-textarea"
                rows="2"
                placeholder="躺下前记一句心得，不费力，想记就记..."
                value={nightNote}
                onChange={e => setNightNote(e.target.value)}
              />
              <button
                type="button"
                className="podcast-btn-save-note"
                disabled={!nightNote.trim()}
                onClick={handleSaveNightNote}
              >
                <Send size={14} />
                <span>记下</span>
              </button>
            </div>
            {noteSavedFeedback && (
              <div className="podcast-note-feedback">
                ✓ 已成功沉淀至「速记」流，安稳入睡吧。
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
