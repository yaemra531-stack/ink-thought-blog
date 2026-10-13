import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Moon,
  Search,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Send,
  Type,
  PenLine,
  Copy,
  Check,
  Columns,
  AlignLeft,
  User,
  Headphones
} from 'lucide-react';
import alanInterview from '../content/alanInterview.json';
import wealthFreedomRaw from '../content/wealthFreedomCurated.json';
import { renderMarkdown } from '../utils/markdownParser';

const FONT_SIZES = ['sm', 'base', 'lg', 'xl'];
const FONT_SIZE_LABELS = {
  sm: '小',
  base: '标准',
  lg: '稍大',
  xl: '特大',
};

// 预留的人物智库体系配置（以人为基础展开阅读）
const AVAILABLE_FIGURES = [
  {
    id: 'justin-sun',
    name: '孙宇晨',
    avatar: '👤',
    title: '波场 TRON 创始人',
    desc: '2026 艾伦访谈 7 专题 + 财富自由之路 167 精读专题全集',
    countBadge: '174 篇收录',
    active: true,
  },
  {
    id: 'elon-musk',
    name: 'Elon Musk',
    avatar: '🚀',
    title: '特斯拉 / SpaceX 首席执行官',
    desc: '第一性原理、极限工程与深度传记访谈精读',
    countBadge: '筹备中',
    active: false,
  },
  {
    id: 'alex-wang',
    name: 'Alex Wang',
    avatar: '⚡',
    title: 'Scale AI 创始人兼 CEO',
    desc: '数据基础设施演进、AI 生态与青年创业实录',
    countBadge: '筹备中',
    active: false,
  },
  {
    id: 'sam-altman',
    name: 'Sam Altman',
    avatar: '🧠',
    title: 'OpenAI 首席执行官',
    desc: 'AGI 演进路线、创业哲学与尺度定律思考',
    countBadge: '筹备中',
    active: false,
  },
];

// 归一化财富自由之路 167 篇高浓度精读专题
const wealthFreedomTopics = wealthFreedomRaw.map((item, idx) => ({
  id: idx + 1,
  key: `wf-${item['期号']}-${idx + 1}`,
  episodeNo: item['期号'],
  unit: item['单元'] || '通用',
  originalTitle: item['原标题'] || item['专题'],
  title: item['专题'] || item['原标题'],
  core: item['命题'] || '',
  closing: item['收束'] || '',
  segments: (item.segments || []).map((seg, sIdx) => ({
    id: sIdx + 1,
    time: seg.time || '',
    lead: seg.lead || '',
    quote: Array.isArray(seg.quote) ? seg.quote : [seg.quote].filter(Boolean),
    claim: seg.claim || '',
    skeleton: Array.isArray(seg.skeleton) ? seg.skeleton : [seg.skeleton].filter(Boolean),
    hook: seg.hook || '',
    note: seg.note || '',
  })),
}));

export default function PodcastStream({ isAuthor, onToggleAuthorMode }) {
  // 当前阅读系列：'alan-2026'（2026 最新 4.5h 访谈，默认）或 'wealth-freedom-154'（财富自由精读 167 专题）
  const [activeSeries, setActiveSeries] = useState(() => {
    try {
      return localStorage.getItem('ink_podcast_active_series') || 'alan-2026';
    } catch {
      return 'alan-2026';
    }
  });

  // 2026 艾伦访谈当前专题 ID（1 - 7）
  const [activeAlanTopicId, setActiveAlanTopicId] = useState(() => {
    try {
      const saved = parseInt(localStorage.getItem('ink_alan_last_topic'), 10);
      if (saved >= 1 && saved <= alanInterview.topics.length) return saved;
    } catch {}
    return 1;
  });

  // 财富自由之路精读专题 ID（1 - 167）
  const [activeWfTopicId, setActiveWfTopicId] = useState(() => {
    try {
      const saved = parseInt(localStorage.getItem('ink_wf_last_topic'), 10);
      if (saved >= 1 && saved <= wealthFreedomTopics.length) return saved;
    } catch {}
    return 2; // 默认停在第 006 期创刊词「先给自己做战略」
  });

  // 浏览模式：'contrast'（左右对照精读，默认）或 'full'（全篇通读）
  const [viewMode, setViewMode] = useState('contrast');

  // 当前激活的切片索引（0 代表查看全部切片对照流，1 代表只看切片1...）
  const [activeSliceIdx, setActiveSliceIdx] = useState(0);

  // 精读人物与人物下拉浮层
  const [activeFigureId, setActiveFigureId] = useState('justin-sun');
  const [isFigureMenuOpen, setIsFigureMenuOpen] = useState(false);
  const figureDropdownRef = useRef(null);

  // 章节/专题下拉选择浮层
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 字号档位
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

  // 已读记录
  const [readEpisodeIds, setReadEpisodeIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ink_podcast_read_history') || '[]');
    } catch {
      return [];
    }
  });

  // 用户随笔笔记
  const [sliceNotes, setSliceNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ink_podcast_slice_notes') || '{}');
    } catch {
      return {};
    }
  });

  // 正在编辑的切片笔记暂存
  const [editingNoteSliceKey, setEditingNoteSliceKey] = useState(null);
  const [noteDraftText, setNoteDraftText] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  const contentRef = useRef(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsCatalogOpen(false);
      }
      if (figureDropdownRef.current && !figureDropdownRef.current.contains(event.target)) {
        setIsFigureMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 切换系列
  const handleSwitchSeries = seriesKey => {
    setActiveSeries(seriesKey);
    localStorage.setItem('ink_podcast_active_series', seriesKey);
    setActiveSliceIdx(0);
    setIsCatalogOpen(false);
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 提取全部单元栏目（财富自由之路 167 篇用）
  const columnsList = useMemo(() => {
    const set = new Set();
    wealthFreedomTopics.forEach(t => {
      if (t.unit) set.add(t.unit);
    });
    return ['全部', ...Array.from(set)];
  }, []);

  // 当前选中的专题对象
  const currentAlanTopic = useMemo(() => {
    return alanInterview.topics.find(t => t.id === activeAlanTopicId) || alanInterview.topics[0];
  }, [activeAlanTopicId]);

  const currentWfTopic = useMemo(() => {
    return wealthFreedomTopics.find(t => t.id === activeWfTopicId) || wealthFreedomTopics[0];
  }, [activeWfTopicId]);

  const activeTopic = activeSeries === 'alan-2026' ? currentAlanTopic : currentWfTopic;

  // 过滤后的目录列表
  const filteredAlanTopics = useMemo(() => {
    if (!searchQuery) return alanInterview.topics;
    const q = searchQuery.toLowerCase();
    return alanInterview.topics.filter(t => 
      t.title.toLowerCase().includes(q) ||
      (t.core && t.core.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const filteredWfTopics = useMemo(() => {
    return wealthFreedomTopics.filter(item => {
      const matchCol = selectedColumn === '全部' || item.unit === selectedColumn;
      if (!matchCol) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.core.toLowerCase().includes(q) ||
        item.originalTitle.toLowerCase().includes(q) ||
        item.episodeNo.toLowerCase().includes(q) ||
        item.unit.toLowerCase().includes(q)
      );
    });
  }, [selectedColumn, searchQuery]);

  // 选择具体专题
  const handleSelectAlanTopic = topicId => {
    setActiveAlanTopicId(topicId);
    localStorage.setItem('ink_alan_last_topic', topicId);
    setActiveSliceIdx(0);
    setIsCatalogOpen(false);
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectWfTopic = topicId => {
    setActiveWfTopicId(topicId);
    localStorage.setItem('ink_wf_last_topic', topicId);
    setActiveSliceIdx(0);
    setIsCatalogOpen(false);
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 构建当前专题的双栏切片数据
  const currentSlices = useMemo(() => {
    if (!activeTopic) return [];
    const isAlan = activeSeries === 'alan-2026';
    return (activeTopic.segments || []).map((seg, idx) => ({
      id: idx + 1,
      tag: `切片 0${idx + 1} · 核心论点剖析`,
      title: seg.claim,
      assertion: seg.lead || `原声 ${seg.time || ''} 关键认知`,
      lead: seg.lead,
      bone: `先抓骨架 · ${seg.skeleton[0] || '核心逻辑推演'}`,
      skeletonList: seg.skeleton || [],
      hook: seg.hook,
      originalQuoteList: seg.quote || [],
      originalQuote: (seg.quote || []).join('\n\n'),
      timeBadge: isAlan
        ? `🎙️ 孙宇晨 · ${seg.time_start || '0:00'} - ${seg.time_end || ''} 原声`
        : `🎙️ 孙宇晨 · ${seg.time || ''} 原声`,
      sliceKey: isAlan
        ? `alan-t${activeTopic.id}-s${idx + 1}`
        : `wf-t${activeTopic.id}-s${idx + 1}`,
      sourceHint: isAlan
        ? `出自《孙宇晨 × 邵艾伦｜年轻人如何抓住AI时代的机会？》专题 0${activeTopic.id} · ${activeTopic.title}`
        : `出自《孙宇晨·财富自由革命之路》第 ${activeTopic.episodeNo} 期 · ${activeTopic.originalTitle}`,
      topicCore: activeTopic.core,
      note: seg.note || '',
    }));
  }, [activeSeries, activeTopic]);

  // 全篇通读 Markdown HTML 生成
  const formattedFullHtml = useMemo(() => {
    if (!activeTopic) return '';
    let md = `# ${activeTopic.episodeNo ? `第 ${activeTopic.episodeNo} 期　` : ''}${activeTopic.title}\n\n`;
    if (activeSeries === 'alan-2026') {
      md += `*原访谈约 ${activeTopic.time_start} – ${activeTopic.time_end} ｜ 孙宇晨 × 邵艾伦*\n\n`;
    } else {
      md += `*单元：${activeTopic.unit} ｜ 出自《${activeTopic.originalTitle}》*\n\n`;
    }
    if (activeTopic.core) {
      md += `**一句话命题：${activeTopic.core}**\n\n---\n\n`;
    }
    (activeTopic.segments || []).forEach((seg, idx) => {
      md += `### 切片 0${idx + 1} ${seg.time ? `（${seg.time}）` : ''}\n\n`;
      if (seg.lead) md += `*${seg.lead}*\n\n`;
      md += `**原话**\n\n`;
      (seg.quote || []).forEach(q => {
        md += `> ${q}\n>\n`;
      });
      if (seg.claim) {
        md += `\n**命题**　${seg.claim}\n\n`;
      }
      if (seg.skeleton && seg.skeleton.length > 0) {
        md += `**骨架**\n\n`;
        seg.skeleton.forEach(s => {
          md += `- ${s}\n`;
        });
      }
      if (seg.hook) {
        md += `\n*${seg.hook}*\n\n`;
      }
      if (seg.note) {
        md += `\n<small>注：${seg.note}</small>\n\n`;
      }
      md += `---\n\n`;
    });
    if (activeTopic.closing) {
      md += `### 今晚收束\n\n`;
      if (Array.isArray(activeTopic.closing)) {
        activeTopic.closing.forEach(c => {
          md += `> ${c}\n`;
        });
      } else {
        md += `> ${activeTopic.closing}\n`;
      }
    }
    return renderMarkdown(md);
  }, [activeSeries, activeTopic]);

  // 保存切片随笔笔记
  const handleSaveSliceNote = sliceKey => {
    if (!noteDraftText.trim()) return;

    const updated = {
      ...sliceNotes,
      [sliceKey]: {
        text: noteDraftText.trim(),
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    };

    setSliceNotes(updated);
    try {
      localStorage.setItem('ink_podcast_slice_notes', JSON.stringify(updated));
    } catch {}

    setEditingNoteSliceKey(null);
    setNoteDraftText('');
  };

  // 复制骨架卡片为引用文本
  const handleCopySliceCard = slice => {
    const noteObj = sliceNotes[slice.sliceKey];
    const sourceTitle = activeSeries === 'alan-2026'
      ? `【2026 访谈 · 专题 0${activeTopic.id}】${activeTopic.title}`
      : `【财富自由之路 · 第 ${activeTopic.episodeNo} 期】${activeTopic.title}`;

    let md = `### ${sourceTitle} ${slice.tag}\n\n`;
    md += `> ${slice.originalQuote}\n\n`;
    md += `**【核心论点剖析】**\n${slice.title}\n\n`;
    if (slice.skeletonList && slice.skeletonList.length > 0) {
      md += `**【先抓骨架】**\n`;
      slice.skeletonList.forEach(s => {
        md += `- ${s}\n`;
      });
      md += `\n`;
    }
    if (slice.hook) {
      md += `**【精辟金句】** ${slice.hook}\n\n`;
    }
    if (noteObj?.text) {
      md += `**【我的随笔思考】**\n${noteObj.text}\n\n`;
    }
    md += `—— 来自《博客随笔 · 夜读对照》`;

    navigator.clipboard.writeText(md).then(() => {
      setCopiedKey(slice.sliceKey);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  // 字号切换
  const handleToggleFontSize = () => {
    const currentIndex = FONT_SIZES.indexOf(fontSize);
    const nextIndex = (currentIndex + 1) % FONT_SIZES.length;
    const nextSize = FONT_SIZES[nextIndex];
    setFontSize(nextSize);
    localStorage.setItem('ink_podcast_font_size', nextSize);
  };

  // 标为已读
  const toggleMarkRead = targetKey => {
    const isRead = readEpisodeIds.includes(targetKey);
    let updated;
    if (isRead) {
      updated = readEpisodeIds.filter(id => id !== targetKey);
    } else {
      updated = [...readEpisodeIds, targetKey];
    }
    setReadEpisodeIds(updated);
    localStorage.setItem('ink_podcast_read_history', JSON.stringify(updated));
  };

  // 当前篇目的唯一键与状态
  const currentEpisodeKey = activeSeries === 'alan-2026'
    ? `alan-${activeAlanTopicId}`
    : `wf-${activeWfTopicId}`;
  const isCurrentRead = readEpisodeIds.includes(currentEpisodeKey);

  // 艾伦访谈进度统计 (共 7 专题)
  const alanStats = useMemo(() => {
    const total = alanInterview.topics.length;
    const completed = alanInterview.topics.filter(t => readEpisodeIds.includes(`alan-${t.id}`)).length;
    const percent = Math.round((completed / total) * 100);
    return { completed, total, percent, isAllDone: completed === total && total > 0 };
  }, [readEpisodeIds]);

  // 财富自由之路精读进度统计 (共 167 专题)
  const classicStats = useMemo(() => {
    const total = wealthFreedomTopics.length;
    const completed = wealthFreedomTopics.filter(t => readEpisodeIds.includes(`wf-${t.id}`)).length;
    const percent = Math.round((completed / total) * 100);
    return { completed, total, percent, isAllDone: completed === total && total > 0 };
  }, [readEpisodeIds]);

  // 当前激活系列的进度统计
  const currentStats = activeSeries === 'alan-2026' ? alanStats : classicStats;
  const currentUnit = '专题';

  // 翻页导航控制
  const prevTopic = useMemo(() => {
    if (activeSeries === 'alan-2026') {
      return activeAlanTopicId > 1 ? alanInterview.topics[activeAlanTopicId - 2] : null;
    } else {
      const idx = wealthFreedomTopics.findIndex(t => t.id === activeWfTopicId);
      return idx > 0 ? wealthFreedomTopics[idx - 1] : null;
    }
  }, [activeSeries, activeAlanTopicId, activeWfTopicId]);

  const nextTopic = useMemo(() => {
    if (activeSeries === 'alan-2026') {
      return activeAlanTopicId < alanInterview.topics.length ? alanInterview.topics[activeAlanTopicId] : null;
    } else {
      const idx = wealthFreedomTopics.findIndex(t => t.id === activeWfTopicId);
      return idx < wealthFreedomTopics.length - 1 ? wealthFreedomTopics[idx + 1] : null;
    }
  }, [activeSeries, activeAlanTopicId, activeWfTopicId]);

  const handleGotoPrevTopic = () => {
    if (!prevTopic) return;
    if (activeSeries === 'alan-2026') {
      handleSelectAlanTopic(prevTopic.id);
    } else {
      handleSelectWfTopic(prevTopic.id);
    }
  };

  const handleGotoNextTopic = () => {
    if (!nextTopic) return;
    if (activeSeries === 'alan-2026') {
      handleSelectAlanTopic(nextTopic.id);
    } else {
      handleSelectWfTopic(nextTopic.id);
    }
  };

  return (
    <div className="podcast-contrast-theme animate-fade-in" ref={contentRef}>
      {/* 顶部极简路径级联工作台导航栏 */}
      <header className="contrast-topbar-container">
        <div className="contrast-cascade-bar">
          {/* 左侧：级联路径导航（人物 / 系列 / 章节） */}
          <div className="contrast-cascade-left">
            {/* 1. 人物下拉选择器 */}
            <div className="contrast-dropdown-wrapper" ref={figureDropdownRef}>
              <button
                type="button"
                className={`contrast-crumb-btn figure-picker-btn ${isFigureMenuOpen ? 'active' : ''}`}
                onClick={() => setIsFigureMenuOpen(!isFigureMenuOpen)}
                title="切换精读人物智库"
              >
                <User size={13} className="text-amber-400" />
                <span className="contrast-crumb-name">
                  {AVAILABLE_FIGURES.find(f => f.id === activeFigureId)?.name || '孙宇晨'}
                </span>
                <span className="contrast-down-arrow">{isFigureMenuOpen ? '▲' : '▾'}</span>
              </button>

              {/* 人物选择浮层 */}
              {isFigureMenuOpen && (
                <div className="contrast-dropdown-panel contrast-figure-menu animate-scale-up">
                  <div className="contrast-dd-header">
                    <span className="contrast-dd-title">精读人物智库</span>
                    <button
                      type="button"
                      className="contrast-dd-close-btn"
                      onClick={() => setIsFigureMenuOpen(false)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="contrast-figure-list">
                    {AVAILABLE_FIGURES.map(fig => (
                      <div
                        key={fig.id}
                        className={`contrast-figure-item ${fig.id === activeFigureId ? 'active' : ''} ${!fig.active ? 'disabled' : ''}`}
                        onClick={() => {
                          if (fig.active) {
                            setActiveFigureId(fig.id);
                            setIsFigureMenuOpen(false);
                          }
                        }}
                      >
                        <span className="contrast-figure-avatar">{fig.avatar}</span>
                        <div className="contrast-figure-info">
                          <div className="contrast-figure-name-row">
                            <span className="contrast-figure-name">{fig.name}</span>
                            <span className={`contrast-figure-status-tag ${fig.active ? 'active' : ''}`}>
                              {fig.countBadge}
                            </span>
                          </div>
                          <span className="contrast-figure-desc">{fig.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <span className="contrast-crumb-sep">/</span>

            {/* 2. 系列切换胶囊组（带实时进度提示） */}
            <div className="contrast-series-capsule-group">
              <button
                type="button"
                className={`contrast-series-chip ${activeSeries === 'alan-2026' ? 'active' : ''}`}
                onClick={() => handleSwitchSeries('alan-2026')}
                title={`2026 艾伦长访谈 · 已读 ${alanStats.completed}/${alanStats.total} 专题`}
              >
                <Sparkles size={12} className="text-amber-400" />
                <span>艾伦长访谈</span>
                <span className="contrast-chip-count">{alanStats.completed}/{alanStats.total}</span>
              </button>
              <button
                type="button"
                className={`contrast-series-chip ${activeSeries === 'wealth-freedom-154' ? 'active' : ''}`}
                onClick={() => handleSwitchSeries('wealth-freedom-154')}
                title={`财富自由之路 · 已读 ${classicStats.completed}/${classicStats.total} 专题`}
              >
                <Headphones size={12} />
                <span>财富自由之路</span>
                <span className="contrast-chip-count">{classicStats.completed}/{classicStats.total}</span>
              </button>
            </div>

            <span className="contrast-crumb-sep">/</span>

            {/* 3. 篇目/章节选择器 */}
            <div className="contrast-dropdown-wrapper" ref={dropdownRef}>
              <button
                type="button"
                className={`contrast-ctrl-btn episode-selector-btn ${isCatalogOpen ? 'active' : ''}`}
                onClick={() => setIsCatalogOpen(!isCatalogOpen)}
                title={activeSeries === 'alan-2026' ? '浏览与切换 7 个精读专题' : '浏览与切换 167 个精读专题'}
              >
                <BookOpen size={13} className="text-amber-400" />
                <span className="contrast-btn-ep-title">
                  {activeSeries === 'alan-2026'
                    ? `专题 0${activeTopic.id} ${activeTopic.title}`
                    : `#${activeTopic.episodeNo} ${activeTopic.title}`}
                </span>
                <span className="contrast-down-arrow">{isCatalogOpen ? '▲' : '▾'}</span>
              </button>

              {/* 轻量章节下拉选择菜单 */}
              {isCatalogOpen && (
                <div className="contrast-dropdown-panel animate-scale-up">
                  <div className="contrast-dd-header">
                    <span className="contrast-dd-title">
                      {activeSeries === 'alan-2026'
                        ? `选读专题（已过 ${alanStats.completed}/${alanStats.total}）`
                        : `选读专题（已过 ${classicStats.completed}/${classicStats.total}）`}
                    </span>
                    <button
                      type="button"
                      className="contrast-dd-close-btn"
                      onClick={() => setIsCatalogOpen(false)}
                    >
                      ✕
                    </button>
                  </div>

                  {/* 搜索框 */}
                  <div className="contrast-dd-search-box">
                    <Search size={13} className="text-amber-400" />
                    <input
                      type="text"
                      placeholder={activeSeries === 'alan-2026' ? '搜索专题名称、核心命题...' : '搜索专题、期号、命题...'}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="contrast-dd-search-input"
                      autoFocus
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className="contrast-dd-clear-btn"
                        onClick={() => setSearchQuery('')}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* 财富自由之路模式下的单元横向筛选条 */}
                  {activeSeries === 'wealth-freedom-154' && (
                    <div className="contrast-dd-columns-bar">
                      {columnsList.map(col => (
                        <button
                          key={col}
                          type="button"
                          className={`contrast-dd-col-chip ${selectedColumn === col ? 'active' : ''}`}
                          onClick={() => setSelectedColumn(col)}
                        >
                          {col}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 章节/专题列表流 */}
                  <div className="contrast-dd-list">
                    {activeSeries === 'alan-2026' ? (
                      filteredAlanTopics.map(t => {
                        const isSelected = t.id === activeAlanTopicId;
                        const isRead = readEpisodeIds.includes(`alan-${t.id}`);
                        return (
                          <div
                            key={t.id}
                            className={`contrast-dd-item ${isSelected ? 'selected' : ''} ${isRead ? 'is-read' : ''}`}
                            onClick={() => handleSelectAlanTopic(t.id)}
                          >
                            <span className="contrast-dd-item-num">0{t.id}</span>
                            <div className="contrast-dd-item-info">
                              <span className="contrast-dd-item-title">{t.title}</span>
                              <span className="contrast-dd-item-core">{t.core}</span>
                            </div>
                            {isRead && <span className="contrast-dd-read">✓ 已过</span>}
                          </div>
                        );
                      })
                    ) : (
                      filteredWfTopics.map(t => {
                        const isSelected = t.id === activeWfTopicId;
                        const isRead = readEpisodeIds.includes(`wf-${t.id}`);
                        return (
                          <div
                            key={t.id}
                            className={`contrast-dd-item ${isSelected ? 'selected' : ''} ${isRead ? 'is-read' : ''}`}
                            onClick={() => handleSelectWfTopic(t.id)}
                          >
                            <span className="contrast-dd-item-num">#{t.episodeNo}</span>
                            <div className="contrast-dd-item-info">
                              <div className="contrast-dd-item-name-row">
                                <span className="contrast-dd-item-title">{t.title}</span>
                                <span className="contrast-dd-item-tag">{t.unit}</span>
                              </div>
                              <span className="contrast-dd-item-core">{t.core}</span>
                            </div>
                            {isRead && <span className="contrast-dd-read">✓ 已过</span>}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：实时系列进度胶囊与操作组 */}
          <div className="contrast-cascade-right">
            {/* 实时系列阅读进度胶囊 */}
            <div
              className={`contrast-progress-chip ${currentStats.isAllDone ? 'all-done' : ''}`}
              title={`当前系列进度：已完成 ${currentStats.completed} / ${currentStats.total} ${currentUnit} (${currentStats.percent}%)`}
            >
              <div className="contrast-progress-info">
                <span className="contrast-progress-text">
                  {currentStats.isAllDone ? '✓ 全篇读毕' : `进度 ${currentStats.completed}/${currentStats.total} ${currentUnit}`}
                </span>
                <span className="contrast-progress-pct">{currentStats.percent}%</span>
              </div>
              <div className="contrast-progress-bar-track">
                <div
                  className="contrast-progress-bar-fill"
                  style={{ width: `${currentStats.percent}%` }}
                />
              </div>
            </div>

            {/* 模式切换胶囊：对照 vs 通读 */}
            <div className="contrast-mode-switch">
              <button
                type="button"
                className={`contrast-mode-btn ${viewMode === 'contrast' ? 'active' : ''}`}
                onClick={() => setViewMode('contrast')}
                title="双栏做题对照精读模式"
              >
                <Columns size={12} />
                <span>对照</span>
              </button>
              <button
                type="button"
                className={`contrast-mode-btn ${viewMode === 'full' ? 'active' : ''}`}
                onClick={() => setViewMode('full')}
                title="单栏通读沉浸模式"
              >
                <AlignLeft size={12} />
                <span>通读</span>
              </button>
            </div>

            {/* 字号切换 */}
            <button
              type="button"
              className="contrast-ctrl-btn font-btn"
              onClick={handleToggleFontSize}
              title={`当前字号: ${FONT_SIZE_LABELS[fontSize]}，点击切换`}
            >
              <Type size={12} />
              <span>{FONT_SIZE_LABELS[fontSize]}</span>
            </button>

            {/* 标为已读 */}
            <button
              type="button"
              className={`contrast-ctrl-btn ${isCurrentRead ? 'is-read' : ''}`}
              onClick={() => toggleMarkRead(currentEpisodeKey)}
              title="标记为今晚已读完"
            >
              <CheckCircle2 size={13} />
              <span>{isCurrentRead ? '已过' : '打卡'}</span>
            </button>

            {/* 顶部小型上一篇/下一篇导航 */}
            <div className="contrast-nav-pair">
              <button
                type="button"
                className="contrast-ctrl-btn nav-btn"
                disabled={!prevTopic}
                onClick={handleGotoPrevTopic}
                title="上一个专题"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                className="contrast-ctrl-btn nav-btn"
                disabled={!nextTopic}
                onClick={handleGotoNextTopic}
                title="下一个专题"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 专题介绍 Hero 卡片 */}
      <section className="contrast-topic-hero animate-fade-in">
        <div className="contrast-topic-hero-header">
          <span className="contrast-topic-hero-badge">
            {activeSeries === 'alan-2026'
              ? `专题 0${activeTopic.id} ｜ 原访谈约 ${activeTopic.time_start} – ${activeTopic.time_end}`
              : `第 ${activeTopic.episodeNo} 期 · ${activeTopic.unit}`}
          </span>
          <span className="contrast-topic-hero-speaker">🎙️ 孙宇晨 × 邵艾伦</span>
        </div>
        <h2 className="contrast-topic-hero-title">{activeTopic.title}</h2>
        <div className="contrast-topic-hero-core">
          <span className="contrast-topic-core-label">一句话命题：</span>
          <span className="contrast-topic-core-text">{activeTopic.core}</span>
        </div>
      </section>

      {/* 认知降温初衷提示 */}
      <div className="contrast-mindset-banner animate-fade-in">
        <Moon size={14} className="text-amber-400 flex-shrink-0" />
        <span className="contrast-mindset-text">
          深夜睡不着时，看未知的新东西会激发多巴胺导致兴奋；听过、熟悉、不带压迫感的内容是最好的“思维滑梯”——平复心率与脑电波，自然产生睡意。
        </span>
      </div>

      {/* 切片快速单选过滤胶囊 */}
      {currentSlices.length > 1 && (
        <div className="contrast-pills-row">
          <button
            type="button"
            className={`contrast-pill-item ${activeSliceIdx === 0 ? 'active' : ''}`}
            onClick={() => setActiveSliceIdx(0)}
          >
            全部切片 ({currentSlices.length})
          </button>
          {currentSlices.map(slice => (
            <button
              key={slice.id}
              type="button"
              className={`contrast-pill-item ${activeSliceIdx === slice.id ? 'active' : ''}`}
              onClick={() => setActiveSliceIdx(slice.id)}
            >
              切片 0{slice.id}
            </button>
          ))}
        </div>
      )}

      {/* 主展示区：左侧相关原文 + 右侧核心论点剖析与随笔笔记 */}
      {viewMode === 'contrast' ? (
        /* 双栏对照精读模式 */
        <main className={`contrast-main-container font-size-${fontSize}`}>
          {currentSlices.length === 0 ? (
            <div className="contrast-loading-box"><p>该专题暂无切片内容</p></div>
          ) : (
            currentSlices.map((slice, sIdx) => {
              if (activeSliceIdx !== 0 && activeSliceIdx !== sIdx + 1) return null;
              const noteObj = sliceNotes[slice.sliceKey];
              const isEditingThis = editingNoteSliceKey === slice.sliceKey;
              const isCopied = copiedKey === slice.sliceKey;

              return (
                <div key={slice.sliceKey} className="contrast-dual-pair animate-fade-in">
                  {/* ====== 【左栏】：对照相关原文（先读原文输入） ====== */}
                  <section className="contrast-pane contrast-pane-left">
                    <div className="contrast-slice-tag-row">
                      <span className="contrast-left-header-label">
                        {activeSeries === 'alan-2026'
                          ? '对照相关原声 · 🎙️ 孙宇晨（对话邵艾伦）'
                          : `对照相关原声 · 🎙️ 孙宇晨（第 ${activeTopic.episodeNo} 期）`}
                      </span>
                    </div>

                    {/* 引子提示 */}
                    {slice.lead && (
                      <div className="contrast-quote-lead">
                        <span>💬 {slice.lead.replace(/^引子：\s*/, '')}</span>
                      </div>
                    )}

                    {/* 原文长引用段落 */}
                    <div className="contrast-original-quote-body">
                      {slice.originalQuoteList.map((para, pIdx) => (
                        <p key={pIdx} className="contrast-quote-p">
                          {para}
                        </p>
                      ))}
                    </div>

                    {/* 原文片段定位卡片 */}
                    <div className="contrast-source-card">
                      <div className="contrast-source-meta">
                        <span className="contrast-source-badge">
                          {slice.timeBadge}
                        </span>
                        <button
                          type="button"
                          className="contrast-btn-goto-full"
                          onClick={() => setViewMode('full')}
                          title="切换到全篇通读看完整上下文"
                        >
                          到原文看这一段 →
                        </button>
                      </div>
                      <p className="contrast-source-hint">
                        {slice.sourceHint}
                      </p>
                    </div>
                  </section>

                  {/* ====== 【右栏】：核心论点剖析 + 骨架拆解 + 随笔笔记 ====== */}
                  <section className="contrast-pane contrast-pane-right">
                    {/* 切片标识 */}
                    <div className="contrast-slice-tag-row">
                      <span className="contrast-slice-q-tag">{slice.tag}</span>
                    </div>

                    {/* 大号核心命题 */}
                    <h2 className="contrast-main-assertion">{slice.title}</h2>
                    {slice.lead && (
                      <p className="contrast-sub-assertion">引子：{slice.lead.replace(/^引子：\s*/, '')}</p>
                    )}

                    {/* 先抓骨架胶囊 */}
                    <div className="contrast-bone-capsule">
                      <span>{slice.bone}</span>
                    </div>

                    {/* 逐块拆解 / 骨架推演链条 */}
                    <div className="contrast-breakdown-box">
                      <div className="contrast-breakdown-title">
                        <span>▶ 逻辑推演链条与认知骨架</span>
                      </div>
                      {slice.skeletonList && slice.skeletonList.length > 0 ? (
                        <div className="contrast-skeleton-steplist">
                          {slice.skeletonList.map((step, sIdx) => (
                            <div key={sIdx} className="contrast-skeleton-step-item">
                              <span className="contrast-skeleton-step-num">{sIdx + 1}</span>
                              <span className="contrast-skeleton-step-text">{step}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    {/* 金句提炼 Hook */}
                    {slice.hook && (
                      <div className="contrast-hook-quote">
                        <Sparkles size={13} className="text-amber-400 flex-shrink-0" />
                        <span>{slice.hook}</span>
                      </div>
                    )}

                    {/* 深度思考与随笔记录卡片（右侧核心笔记区） */}
                    <div className="contrast-reflection-card">
                      <div className="contrast-ref-header">
                        <span className="contrast-ref-title">
                          <PenLine size={13} className="text-amber-400" />
                          <span>深度思考与随笔记录</span>
                        </span>
                        <div className="contrast-ref-actions">
                          <button
                            type="button"
                            className="contrast-ref-btn"
                            onClick={() => {
                              if (isEditingThis) {
                                setEditingNoteSliceKey(null);
                              } else {
                                setEditingNoteSliceKey(slice.sliceKey);
                                setNoteDraftText(noteObj?.text || '');
                              }
                            }}
                          >
                            <PenLine size={12} />
                            <span>{noteObj?.text ? '修改笔记' : '记一笔'}</span>
                          </button>
                          <button
                            type="button"
                            className="contrast-ref-btn"
                            onClick={() => handleCopySliceCard(slice)}
                            title="复制本组对照卡片为 Markdown"
                          >
                            {isCopied ? <Check size={12} className="text-amber-400" /> : <Copy size={12} />}
                            <span>{isCopied ? '已复制' : '复制卡片'}</span>
                          </button>
                        </div>
                      </div>

                      {/* 编辑态输入框 */}
                      {isEditingThis ? (
                        <div className="contrast-note-editor-wrap">
                          <textarea
                            className="contrast-note-textarea"
                            rows="3"
                            placeholder="写下你对左侧原话的思考、共鸣或实践迁移..."
                            value={noteDraftText}
                            onChange={e => setNoteDraftText(e.target.value)}
                            autoFocus
                          />
                          <div className="contrast-note-editor-btns">
                            <button
                              type="button"
                              className="contrast-note-btn save"
                              onClick={() => handleSaveSliceNote(slice.sliceKey)}
                            >
                              <Send size={12} />
                              <span>保存随笔</span>
                            </button>
                            <button
                              type="button"
                              className="contrast-note-btn cancel"
                              onClick={() => setEditingNoteSliceKey(null)}
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : noteObj?.text ? (
                        <div className="contrast-user-note-body">
                          <p className="contrast-user-note-p">{noteObj.text}</p>
                          <span className="contrast-user-note-time">记录于 {noteObj.updatedAt}</span>
                        </div>
                      ) : (
                        <div className="contrast-note-default-tip">
                          <p className="contrast-vocabulary-hint">
                            <strong>认知重点 · </strong>
                            {slice.hook || '把精力集中在根本战略上，不要用战术忙碌掩盖懒惰；在熟悉语境中平复焦虑，安稳入眠。'}
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              );
            })
          )}

          {/* 专题睡前收束语 */}
          {activeTopic.closing && (
            <div className="contrast-closing-card animate-fade-in">
              <div className="contrast-closing-icon">
                <Moon size={22} className="text-amber-400" />
              </div>
              <h3 className="contrast-closing-title">今晚收束 · 心智归位</h3>
              <div className="contrast-closing-body">
                {Array.isArray(activeTopic.closing) ? (
                  activeTopic.closing.map((c, cIdx) => (
                    <p key={cIdx} className="contrast-closing-p">{c}</p>
                  ))
                ) : (
                  <p className="contrast-closing-p">{activeTopic.closing}</p>
                )}
              </div>
            </div>
          )}
        </main>
      ) : (
        /* 全篇长文通读模式 */
        <main className={`contrast-full-reader font-size-${fontSize}`}>
          <div className="contrast-full-article-wrap">
            <div className="contrast-full-header">
              <span className="contrast-full-ep-id">
                {activeSeries === 'alan-2026'
                  ? `专题 0${activeTopic.id} ｜ 原访谈约 ${activeTopic.time_start} – ${activeTopic.time_end}`
                  : `第 ${activeTopic.episodeNo} 期 · ${activeTopic.unit}`}
              </span>
              <h2 className="contrast-full-h1">
                {activeTopic.title}
              </h2>
              <div className="contrast-full-meta">
                <span>核心命题：{activeTopic.core}</span>
              </div>
            </div>

            <div
              className="podcast-article-content"
              dangerouslySetInnerHTML={{ __html: formattedFullHtml }}
            />
          </div>
        </main>
      )}

      {/* 底部翻页控制卡片 */}
      <footer className="contrast-footer-row">
        {prevTopic ? (
          <button
            type="button"
            className="contrast-footer-nav-card prev"
            onClick={handleGotoPrevTopic}
          >
            <div className="contrast-footer-nav-dir">
              <ChevronLeft size={14} />
              <span>上一个专题</span>
            </div>
            <div className="contrast-footer-nav-title">
              {activeSeries === 'alan-2026'
                ? `专题 0${prevTopic.id} · ${prevTopic.title}`
                : `#${prevTopic.episodeNo} ${prevTopic.title}`}
            </div>
          </button>
        ) : <div />}

        {nextTopic ? (
          <button
            type="button"
            className="contrast-footer-nav-card next"
            onClick={handleGotoNextTopic}
          >
            <div className="contrast-footer-nav-dir">
              <span>下一个专题</span>
              <ChevronRight size={14} />
            </div>
            <div className="contrast-footer-nav-title">
              {activeSeries === 'alan-2026'
                ? `专题 0${nextTopic.id} · ${nextTopic.title}`
                : `#${nextTopic.episodeNo} ${nextTopic.title}`}
            </div>
          </button>
        ) : <div />}
      </footer>

      {/* 放在上一个选题和下一个选题正下方的极简打卡落款 */}
      <div className="contrast-footer-checkin-wrap animate-fade-in">
        <button
          type="button"
          className={`contrast-footer-checkin-btn ${isCurrentRead ? 'is-read' : ''}`}
          onClick={() => toggleMarkRead(currentEpisodeKey)}
          title={isCurrentRead ? '本篇已打卡（点击取消）' : '点击打卡记录今日推进'}
        >
          <CheckCircle2 size={15} />
          <span>{isCurrentRead ? '✓ 本篇已打卡 · 心智归位' : '读毕打卡 · 记录今日推进'}</span>
          <span className="contrast-footer-checkin-tag">
            {currentStats.completed}/{currentStats.total} {currentUnit}
          </span>
        </button>
      </div>
    </div>
  );
}
