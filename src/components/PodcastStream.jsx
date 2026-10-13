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
  Maximize2,
  Minimize2,
  Type,
  Quote,
  PenLine,
  Trash2,
  Copy,
  Download,
  Check,
  X,
  ExternalLink,
  MessageSquareQuote,
  PanelRightClose,
  PanelRightOpen,
  BookMarked,
  Share2
} from 'lucide-react';
import podcastsIndex from '../content/podcastsIndex.json';
import { renderMarkdown } from '../utils/markdownParser';

// 懒加载所有分篇 Markdown 文本（Vite 会按需分包，不占用首页打包体积）
const podcastModules = import.meta.glob('/src/content/podcasts/*.md', {
  query: '?raw',
  import: 'default',
});

const FONT_SIZES = ['sm', 'base', 'lg', 'xl'];
const FONT_SIZE_LABELS = {
  sm: '小',
  base: '标准',
  lg: '稍大',
  xl: '特大',
};

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

  // 是否处于全屏沉浸阅读态（专注模式隐藏侧栏目录）
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [currentEpisodeContent, setCurrentEpisodeContent] = useState('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // 夜读字号档位
  const [fontSize, setFontSize] = useState(() => {
    try {
      return localStorage.getItem('ink_podcast_font_size') || 'base';
    } catch {
      return 'base';
    }
  });

  // 搜索与栏目筛选
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColumn, setSelectedColumn] = useState('全部');

  // 读者已读打卡记录（存储在 localStorage）
  const [readEpisodeIds, setReadEpisodeIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ink_podcast_read_history') || '[]');
    } catch {
      return [];
    }
  });

  // ========== 右侧阅读批注与笔记系统 (Marginalia) ==========
  // 右侧边栏是否展开（在大屏默认展开，支持随时收起）
  const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('ink_podcast_panel_open');
      if (saved !== null) return saved === 'true';
    } catch {}
    return typeof window !== 'undefined' ? window.innerWidth >= 1200 : true;
  });

  // 全部已保存批注列表
  const [annotations, setAnnotations] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ink_podcast_annotations') || '[]');
    } catch {
      return [];
    }
  });

  // 批注展示 Tab：'current' (本篇) 或 'all' (全部已沉淀笔记)
  const [notesTab, setNotesTab] = useState('current');

  // 当前正在编写的批注：引文与个人思考
  const [activeQuote, setActiveQuote] = useState('');
  const [thoughtInput, setThoughtInput] = useState('');
  const [syncToThoughts, setSyncToThoughts] = useState(true);
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);
  const [copiedNoteId, setCopiedNoteId] = useState(null);
  const [exportFeedback, setExportFeedback] = useState(false);

  // 划词浮动摘录按钮状态
  const [floatingBtn, setFloatingBtn] = useState({
    visible: false,
    x: 0,
    y: 0,
    text: '',
  });

  // 底部随手记兼容输入框
  const [nightNote, setNightNote] = useState('');
  const [bottomNoteSavedFeedback, setBottomNoteSavedFeedback] = useState(false);

  const contentRef = useRef(null);
  const readerAreaRef = useRef(null);
  const thoughtInputRef = useRef(null);
  const notesPanelRef = useRef(null);

  // 提取全部栏目分类
  const columnsList = useMemo(() => {
    const set = new Set();
    podcastsIndex.forEach(p => {
      if (p.column && p.column !== '漫谈') set.add(p.column);
    });
    return [
      '全部',
      '创刊词',
      '战略',
      '90后不买房',
      '比特币',
      '全球流动性过剩',
      '医疗',
      '番外',
      ...Array.from(set).filter(
        c => !['全部', '创刊词', '战略', '90后不买房', '比特币', '全球流动性过剩', '医疗', '番外'].includes(c)
      ),
    ];
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

  // 当前篇目下的批注列表
  const currentEpisodeNotes = useMemo(() => {
    return annotations.filter(n => n.episodeId === activeEpisode.id);
  }, [annotations, activeEpisode.id]);

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

    // 清除当前的划词状态
    setFloatingBtn({ visible: false, x: 0, y: 0, text: '' });

    // 回滚正文到顶部
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return () => {
      isMounted = false;
    };
  }, [activeEpisodeId, activeEpisode]);

  // 监听划词选择，显示浮动「✦ 摘录批注」按钮
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setFloatingBtn(prev => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }

    const selectedText = selection.toString().trim();
    if (selectedText.length < 2) {
      setFloatingBtn(prev => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }

    // 检查划词区域是否在正文内
    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        // 计算按钮位置，稍微向上偏移
        const btnX = Math.min(Math.max(rect.left + rect.width / 2, 80), window.innerWidth - 80);
        const btnY = Math.max(rect.top - 46, 10);

        setFloatingBtn({
          visible: true,
          x: btnX,
          y: btnY,
          text: selectedText,
        });
      }
    } catch {
      // 容错处理
    }
  };

  // 点击浮动按钮：将选中原文带入右侧批注栏
  const handleApplySelectionToNote = () => {
    if (!floatingBtn.text) return;

    setActiveQuote(floatingBtn.text);
    setIsNotesPanelOpen(true);
    setNotesTab('current');
    localStorage.setItem('ink_podcast_panel_open', 'true');

    // 清除选择框与浮动按钮
    setFloatingBtn({ visible: false, x: 0, y: 0, text: '' });
    window.getSelection()?.removeAllRanges();

    // 聚焦到想法输入框
    setTimeout(() => {
      if (thoughtInputRef.current) {
        thoughtInputRef.current.focus();
        thoughtInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 120);
  };

  // 保存批注卡片
  const handleSaveAnnotation = () => {
    if (!activeQuote.trim() && !thoughtInput.trim()) return;

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      episodeId: activeEpisode.id,
      episodeTitle: activeEpisode.title,
      quote: activeQuote.trim(),
      thought: thoughtInput.trim(),
      createdAt: timeStr,
      timestamp: Date.now(),
    };

    const nextAnnotations = [newNote, ...annotations];
    setAnnotations(nextAnnotations);
    try {
      localStorage.setItem('ink_podcast_annotations', JSON.stringify(nextAnnotations));
    } catch (e) {
      console.error('存储批注失败', e);
    }

    // 若勾选了同步至博客「速记」流
    if (syncToThoughts && thoughtInput.trim()) {
      const summaryText = newNote.quote
        ? `【夜读批注 · ${activeEpisode.id} ${activeEpisode.title}】\n> ${newNote.quote}\n\n${newNote.thought}`
        : `【夜读批注 · ${activeEpisode.id} ${activeEpisode.title}】\n${newNote.thought}`;

      const newThought = {
        id: `t-podcast-${Date.now()}`,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        content: summaryText,
        location: `睡前夜读 · 第${activeEpisode.id}篇`,
      };

      try {
        const existingThoughts = JSON.parse(localStorage.getItem('ink_user_thoughts') || '[]');
        existingThoughts.unshift(newThought);
        localStorage.setItem('ink_user_thoughts', JSON.stringify(existingThoughts));

        fetch('https://creator-api-worker.yaemra531.workers.dev/api/thoughts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newThought),
        }).catch(() => {});
      } catch (e) {}
    }

    // 清空编辑器并提示
    setActiveQuote('');
    setThoughtInput('');
    setNoteSavedFeedback(true);
    setTimeout(() => setNoteSavedFeedback(false), 2600);
  };

  // 删除某条批注
  const handleDeleteAnnotation = id => {
    const nextList = annotations.filter(item => item.id !== id);
    setAnnotations(nextList);
    try {
      localStorage.setItem('ink_podcast_annotations', JSON.stringify(nextList));
    } catch {}
  };

  // 复制单条笔记卡片（格式化为 Markdown）
  const handleCopyNote = note => {
    let md = '';
    if (note.quote) {
      md += `> ${note.quote}\n\n`;
    }
    if (note.thought) {
      md += `**思考笔记：** ${note.thought}\n\n`;
    }
    md += `—— 来自《#${note.episodeId} ${note.episodeTitle}》（${note.createdAt}）`;

    navigator.clipboard.writeText(md).then(() => {
      setCopiedNoteId(note.id);
      setTimeout(() => setCopiedNoteId(null), 2000);
    }).catch(() => {});
  };

  // 导出/复制本篇全部批注
  const handleExportEpisodeNotes = () => {
    const notesToExport = notesTab === 'current' ? currentEpisodeNotes : annotations;
    if (notesToExport.length === 0) return;

    let content = `# 《${activeEpisode.fullTitle}》阅读批注合集

`;
    notesToExport.forEach((n, idx) => {
      content += `### 批注卡片 ${idx + 1}（${n.createdAt}）\n`;
      if (n.quote) {
        content += `> ${n.quote}\n\n`;
      }
      if (n.thought) {
        content += `**我的想法：**\n${n.thought}\n\n`;
      }
      content += `---\n\n`;
    });

    navigator.clipboard.writeText(content).then(() => {
      setExportFeedback(true);
      setTimeout(() => setExportFeedback(false), 2400);
    }).catch(() => {});
  };

  // 标记当前篇目为已读/未读切换
  const toggleMarkRead = id => {
    setReadEpisodeIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('ink_podcast_read_history', JSON.stringify(next));
      return next;
    });
  };

  // 切换字号
  const handleToggleFontSize = () => {
    const nextIdx = (FONT_SIZES.indexOf(fontSize) + 1) % FONT_SIZES.length;
    const nextSize = FONT_SIZES[nextIdx];
    setFontSize(nextSize);
    localStorage.setItem('ink_podcast_font_size', nextSize);
  };

  // 切换上一篇/下一篇
  const currentIndex = podcastsIndex.findIndex(p => p.id === activeEpisodeId);
  const prevEpisode = currentIndex > 0 ? podcastsIndex[currentIndex - 1] : null;
  const nextEpisode = currentIndex < podcastsIndex.length - 1 ? podcastsIndex[currentIndex + 1] : null;

  const handleSelectEpisode = id => {
    setActiveEpisodeId(id);
    if (window.innerWidth < 860) {
      setIsReadingMode(true);
    }
  };

  // 切换右侧边栏展开/收起
  const toggleNotesPanel = () => {
    setIsNotesPanelOpen(prev => {
      const next = !prev;
      localStorage.setItem('ink_podcast_panel_open', String(next));
      return next;
    });
  };

  // 底部随手夜注保存（同步兼容保留）
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

      fetch('https://creator-api-worker.yaemra531.workers.dev/api/thoughts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newThought),
      }).catch(() => {});

      // 同时自动加入到卡片批注库
      const now = new Date();
      const autoNote = {
        id: `note-${Date.now()}`,
        episodeId: activeEpisode.id,
        episodeTitle: activeEpisode.title,
        quote: '',
        thought: nightNote.trim(),
        createdAt: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        timestamp: Date.now(),
      };
      setAnnotations(prev => [autoNote, ...prev]);

      setBottomNoteSavedFeedback(true);
      setNightNote('');
      setTimeout(() => setBottomNoteSavedFeedback(false), 2500);
    } catch (e) {
      console.error('保存夜读随笔失败', e);
    }
  };

  // 格式化正文 Markdown：优雅渲染独白与对话
  const formattedHtml = useMemo(() => {
    if (!currentEpisodeContent) return '';
    let processed = currentEpisodeContent;

    // 清理顶部的重复大标题（页面已有精致标题栏）
    processed = processed.replace(/^#\s+.*?\n+/, '');
    processed = processed.replace(/^>\s+出自.*?合集.*?\n+/, '');

    // 独白篇防呆（清除残余的讲话人标签）
    processed = processed.replace(/\*\*讲话人1\*\*/g, '');

    // 将 🎙️ **孙宇晨** · 0:15 转换为精致的主讲人标识卡
    processed = processed.replace(
      /🎙️\s*\*\*孙宇晨\*\*(?:\s*·\s*(\d+:\d+))?/g,
      (match, time) => {
        const timeHtml = time ? `<span class="speaker-time">${time}</span>` : '';
        return `<div class="speaker-bubble speaker-sun"><span class="speaker-name">🎙️ 孙宇晨</span>${timeHtml}</div>`;
      }
    );

    return renderMarkdown(processed);
  }, [currentEpisodeContent]);

  return (
    <div className="podcast-container animate-fade-in" onMouseUp={handleTextSelection}>
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
                <BookOpen size={13} />
                <span>已收录 154 篇逐字稿</span>
              </span>
              <span className="podcast-chip-muted">
                <CheckCircle2 size={13} />
                <span>已读 {readEpisodeIds.length} / 154</span>
              </span>
              {annotations.length > 0 && (
                <span className="podcast-chip-accent" onClick={toggleNotesPanel} title="已沉淀批注卡片">
                  <PenLine size={13} />
                  <span>批注卡片 {annotations.length}</span>
                </span>
              )}
            </div>
            <span className="podcast-status-time">
              <Clock size={12} />
              <span>适合入睡前 15–20 分钟</span>
            </span>
          </div>

          <div className="podcast-anchor-box">
            <span className="podcast-anchor-label">
              <Bookmark size={13} />
              <span>上次读到：第 {activeEpisode?.id || '006'} 篇</span>
            </span>
            <span className="podcast-anchor-title">{activeEpisode?.title}</span>
            <button
              type="button"
              className="podcast-btn-resume"
              onClick={() => setIsReadingMode(!isReadingMode)}
            >
              <span>{isReadingMode ? '显示目录' : '沉浸全屏阅读'}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 划词浮动摘录按钮 */}
      {floatingBtn.visible && (
        <div
          className="podcast-floating-annotate-btn"
          style={{
            position: 'fixed',
            left: `${floatingBtn.x}px`,
            top: `${floatingBtn.y}px`,
            zIndex: 9999,
            transform: 'translateX(-50%)',
          }}
          onMouseDown={e => {
            e.preventDefault();
            e.stopPropagation();
            handleApplySelectionToNote();
          }}
        >
          <button type="button" className="podcast-float-btn-inner">
            <Quote size={13} />
            <span>✦ 摘录批注</span>
          </button>
        </div>
      )}

      {/* 主工作台：三栏/自适应架构（左侧目录 + 中间正文 + 右侧边栏笔记） */}
      <div
        className={`podcast-workspace ${isReadingMode ? 'focus-reading' : ''} ${
          isNotesPanelOpen ? 'has-notes-panel' : 'notes-panel-closed'
        }`}
      >
        {/* 1. 目录侧边栏 */}
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
                const epNotesCount = annotations.filter(n => n.episodeId === item.id).length;
                return (
                  <div
                    key={item.id}
                    className={`podcast-item-card ${isActive ? 'is-active' : ''} ${isRead ? 'is-read' : ''}`}
                    onClick={() => handleSelectEpisode(item.id)}
                  >
                    <div className="podcast-item-header">
                      <span className="podcast-item-id">#{item.id}</span>
                      <span className="podcast-item-col">{item.column}</span>
                      <span className="podcast-item-mode-badge">{item.modeLabel || '独白'}</span>
                      {isRead && <span className="podcast-read-badge">✓ 已过</span>}
                      {epNotesCount > 0 && (
                        <span className="podcast-notes-badge" title={`已记 ${epNotesCount} 条笔记`}>
                          ✎ {epNotesCount}
                        </span>
                      )}
                    </div>
                    <div className="podcast-item-title">{item.title}</div>
                    <div className="podcast-item-meta">
                      <span>{item.wordCount} 字</span>
                      <span>·</span>
                      <span>约 {item.readTimeMinutes || 5} 分钟</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* 2. 逐字稿正文阅读区 */}
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
              {/* 右侧批注栏展开/收起切换 */}
              <button
                type="button"
                className={`podcast-action-btn notes-toggle-btn ${isNotesPanelOpen ? 'active' : ''}`}
                onClick={toggleNotesPanel}
                title={isNotesPanelOpen ? '收起右侧批注栏' : '展开右侧批注栏'}
              >
                <PenLine size={14} />
                <span>批注卡片 {currentEpisodeNotes.length > 0 ? `(${currentEpisodeNotes.length})` : ''}</span>
              </button>

              {/* 字号调节 */}
              <button
                type="button"
                className="podcast-action-btn font-btn"
                onClick={handleToggleFontSize}
                title={`当前字号: ${FONT_SIZE_LABELS[fontSize]}，点击切换`}
              >
                <Type size={14} />
                <span>{FONT_SIZE_LABELS[fontSize]}</span>
              </button>

              {/* 沉浸全屏模式切换 */}
              <button
                type="button"
                className={`podcast-action-btn ${isReadingMode ? 'active' : ''}`}
                onClick={() => setIsReadingMode(!isReadingMode)}
                title={isReadingMode ? '显示侧栏目录' : '沉浸模式（隐藏侧栏）'}
              >
                {isReadingMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                <span>{isReadingMode ? '退出沉浸' : '沉浸'}</span>
              </button>

              {/* 标为已读 */}
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
              <span className="podcast-article-mode-tag">{activeEpisode.modeLabel || '独白漫谈'}</span>
              <span className="podcast-article-words">
                {activeEpisode.wordCount} 字 · 约 {activeEpisode.readTimeMinutes || 5} 分钟读完
              </span>
            </div>
            <h1 className="podcast-article-h1">{activeEpisode.fullTitle}</h1>
          </div>

          {/* 核心切片：睡前心智滑梯 */}
          {activeEpisode.sliceQuote && (
            <div className="podcast-insight-slice-card">
              <div className="podcast-slice-header">
                <Sparkles size={14} className="podcast-slice-icon" />
                <span className="podcast-slice-label">睡前认知切片 · 心智滑梯</span>
                <span className="podcast-slice-hint">30秒摄入核心观点</span>
              </div>
              <p className="podcast-slice-quote">“{activeEpisode.sliceQuote}”</p>
            </div>
          )}

          {/* 逐字稿正文主体 */}
          {isLoadingContent ? (
            <div className="podcast-loading">
              <Moon size={24} className="animate-spin text-amber-500" />
              <p>正在舒缓翻开逐字稿...</p>
            </div>
          ) : (
            <div
              ref={readerAreaRef}
              className={`podcast-transcript-body font-size-${fontSize}`}
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
              <span className="podcast-note-tip">（若读到哪句话有触动，顺手敲一句，会自动沉淀到博客速记与批注卡片）</span>
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
            {bottomNoteSavedFeedback && (
              <div className="podcast-note-feedback">
                ✓ 已成功沉淀至「速记」流与批注库，安稳入睡吧。
              </div>
            )}
          </div>
        </section>

        {/* 3. 右侧边栏：边读边记 · 原文引用与思考批注 (Marginalia Panel) */}
        {isNotesPanelOpen && (
          <aside className="podcast-annotations-panel" ref={notesPanelRef}>
            {/* 侧栏顶端标题与操作 */}
            <div className="podcast-annotations-header">
              <div className="podcast-ann-title-wrap">
                <PenLine size={16} className="text-amber-600 dark:text-amber-400" />
                <span className="podcast-ann-title">边读边记 · 批注卡片</span>
              </div>
              <div className="podcast-ann-actions">
                <button
                  type="button"
                  className="podcast-ann-header-btn"
                  onClick={handleExportEpisodeNotes}
                  disabled={notesTab === 'current' ? currentEpisodeNotes.length === 0 : annotations.length === 0}
                  title="复制全部批注为 Markdown 格式"
                >
                  <Share2 size={13} />
                  <span>{exportFeedback ? '已复制全部' : '导出 Markdown'}</span>
                </button>
                <button
                  type="button"
                  className="podcast-ann-close-btn"
                  onClick={toggleNotesPanel}
                  title="收起右侧批注栏"
                >
                  <PanelRightClose size={14} />
                </button>
              </div>
            </div>

            {/* Tab 切换：本篇批注 vs 全部随笔 */}
            <div className="podcast-ann-tabs">
              <button
                type="button"
                className={`podcast-ann-tab ${notesTab === 'current' ? 'active' : ''}`}
                onClick={() => setNotesTab('current')}
              >
                本篇批注 ({currentEpisodeNotes.length})
              </button>
              <button
                type="button"
                className={`podcast-ann-tab ${notesTab === 'all' ? 'active' : ''}`}
                onClick={() => setNotesTab('all')}
              >
                全部卡片 ({annotations.length})
              </button>
            </div>

            {/* 新批注编辑器卡片 */}
            <div className="podcast-composer-card">
              <div className="podcast-composer-header">
                <span className="podcast-composer-label">
                  <Sparkles size={13} className="text-amber-500" />
                  <span>{activeQuote ? '已选中引用原文' : '新批注卡片'}</span>
                </span>
                {activeQuote && (
                  <button
                    type="button"
                    className="podcast-clear-quote-btn"
                    onClick={() => setActiveQuote('')}
                    title="移除该段引用"
                  >
                    <X size={12} />
                    <span>清除引用</span>
                  </button>
                )}
              </div>

              {/* 选中的引用原文展示 */}
              {activeQuote ? (
                <div className="podcast-quote-preview-box">
                  <Quote size={13} className="podcast-quote-symbol" />
                  <p className="podcast-quote-preview-text">“{activeQuote}”</p>
                </div>
              ) : (
                <div className="podcast-quote-guide-tip">
                  <span>💡 划选左侧逐字稿中的任意文字，即可一键带入引用；亦可在此直接手写思考。</span>
                </div>
              )}

              {/* 个人思考输入区 */}
              <div className="podcast-thought-input-wrap">
                <textarea
                  ref={thoughtInputRef}
                  className="podcast-thought-textarea"
                  rows="3"
                  placeholder="写下你的想法、共鸣、反思或认知迁移..."
                  value={thoughtInput}
                  onChange={e => setThoughtInput(e.target.value)}
                />
              </div>

              {/* 编辑器底部操作区 */}
              <div className="podcast-composer-footer">
                <label className="podcast-sync-checkbox">
                  <input
                    type="checkbox"
                    checked={syncToThoughts}
                    onChange={e => setSyncToThoughts(e.target.checked)}
                  />
                  <span>同步沉淀至速记流</span>
                </label>

                <button
                  type="button"
                  className="podcast-btn-save-ann"
                  disabled={!activeQuote.trim() && !thoughtInput.trim()}
                  onClick={handleSaveAnnotation}
                >
                  <Send size={13} />
                  <span>生成笔记卡片</span>
                </button>
              </div>

              {noteSavedFeedback && (
                <div className="podcast-ann-saved-toast">
                  ✓ 笔记卡片已沉淀！可随时复制导出。
                </div>
              )}
            </div>

            {/* 已沉淀批注卡片流 */}
            <div className="podcast-annotations-stream">
              {(notesTab === 'current' ? currentEpisodeNotes : annotations).length === 0 ? (
                <div className="podcast-ann-empty">
                  <div className="podcast-ann-empty-icon">
                    <MessageSquareQuote size={28} />
                  </div>
                  <p className="podcast-ann-empty-title">
                    {notesTab === 'current' ? '本篇暂无批注卡片' : '尚未沉淀任何批注'}
                  </p>
                  <p className="podcast-ann-empty-sub">
                    在左侧阅读时，选中有心智密度的句子，点击「摘录批注」，让深夜的顿悟转化为成型的思考资产。
                  </p>
                </div>
              ) : (
                (notesTab === 'current' ? currentEpisodeNotes : annotations).map(note => {
                  const isCopied = copiedNoteId === note.id;
                  return (
                    <div key={note.id} className="podcast-note-card">
                      {/* 卡片头部：篇目信息与时间 */}
                      <div className="podcast-note-card-meta">
                        <span
                          className="podcast-note-ep-tag"
                          onClick={() => {
                            if (note.episodeId !== activeEpisode.id) {
                              setActiveEpisodeId(note.episodeId);
                            }
                          }}
                          title="跳转至该篇阅读"
                        >
                          #{note.episodeId} {note.episodeTitle}
                        </span>
                        <span className="podcast-note-time">{note.createdAt}</span>
                      </div>

                      {/* 原文引用块 */}
                      {note.quote && (
                        <div className="podcast-card-quote">
                          <span className="podcast-card-quote-bar" />
                          <p className="podcast-card-quote-text">“{note.quote}”</p>
                        </div>
                      )}

                      {/* 我的想法正文 */}
                      {note.thought && (
                        <div className="podcast-card-thought">
                          <p className="podcast-card-thought-text">{note.thought}</p>
                        </div>
                      )}

                      {/* 卡片底部操作栏 */}
                      <div className="podcast-card-footer">
                        <button
                          type="button"
                          className="podcast-card-act-btn"
                          onClick={() => handleCopyNote(note)}
                          title="复制为 Markdown 格式"
                        >
                          {isCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          <span>{isCopied ? '已复制' : '复制卡片'}</span>
                        </button>
                        <button
                          type="button"
                          className="podcast-card-act-btn delete"
                          onClick={() => handleDeleteAnnotation(note.id)}
                          title="删除此条笔记"
                        >
                          <Trash2 size={12} />
                          <span>删除</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
