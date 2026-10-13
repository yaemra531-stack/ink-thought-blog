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
  Compass,
  Headphones
} from 'lucide-react';
import TranscriptAnnotations from './TranscriptAnnotations';
import podcastsIndex from '../content/podcastsIndex.json';
import alanInterview from '../content/alanInterview.json';
import { renderMarkdown } from '../utils/markdownParser';

// 懒加载所有分篇 Markdown 文本（154篇原声）
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

// 预留的人物智库体系配置（以人为基础展开阅读）
const AVAILABLE_FIGURES = [
  {
    id: 'justin-sun',
    name: '孙宇晨',
    avatar: '👤',
    title: '波场 TRON 创始人',
    desc: '2026 艾伦访谈 7 专题 + 财富自由之路 154 篇全集',
    countBadge: '161 篇收录',
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

export default function PodcastStream({ isAuthor, onToggleAuthorMode }) {
  // 当前阅读系列：'alan-2026'（2026 最新 4.5h 访谈，默认）或 'wealth-freedom-154'（经典 154 篇逐字稿）
  const [activeSeries, setActiveSeries] = useState(() => {
    try {
      return localStorage.getItem('ink_podcast_active_series') || 'alan-2026';
    } catch {
      return 'alan-2026';
    }
  });

  // 2026 艾伦访谈当前专题 ID（1 - 7）
  const [activeTopicId, setActiveTopicId] = useState(() => {
    try {
      const saved = parseInt(localStorage.getItem('ink_alan_last_topic'), 10);
      if (saved >= 1 && saved <= 7) return saved;
    } catch {}
    return 1;
  });

  // 154 篇逐字稿篇目 ID
  const [activeEpisodeId, setActiveEpisodeId] = useState(() => {
    try {
      const saved = localStorage.getItem('ink_podcast_last_read');
      if (saved && podcastsIndex.some(p => p.id === saved)) {
        return saved;
      }
    } catch {}
    return '006';
  });

  // 浏览模式：'contrast'（左右对照精读，默认）或 'full'（全篇通读）
  const [viewMode, setViewMode] = useState('contrast');

  // 当前激活的切片索引（0 代表查看全部切片对照流，1 代表只看切片1...）
  const [activeSliceIdx, setActiveSliceIdx] = useState(0);

  // 精读人物与人物下拉浮层
  const [activeFigureId, setActiveFigureId] = useState('justin-sun');
  const [isFigureMenuOpen, setIsFigureMenuOpen] = useState(false);
  const figureDropdownRef = useRef(null);

  // 章节/专题下拉选择浮层（采用按钮正下方的无模糊轻巧 Popover，绝不遮盖全屏）
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  // 正文原始文本与加载状态（用于 154 篇）
  const [currentEpisodeContent, setCurrentEpisodeContent] = useState('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // 内存缓存已加载的内容，切换篇目时 0 延迟秒开
  const contentCacheRef = useRef({});

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

  // 正在编辑的切片笔记输入框
  const [editingNoteSliceKey, setEditingNoteSliceKey] = useState(null);
  const [noteDraftText, setNoteDraftText] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  const contentRef = useRef(null);
  const dropdownRef = useRef(null);

  // 点击外部自动关闭章节下拉菜单
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

  // 提取全部栏目（154 篇用）
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

  // 2026 艾伦访谈当前专题
  const activeTopic = useMemo(() => {
    return alanInterview.topics.find(t => t.id === activeTopicId) || alanInterview.topics[0];
  }, [activeTopicId]);

  // 154 篇当前篇目元信息
  const activeEpisode = useMemo(() => {
    return podcastsIndex.find(p => p.id === activeEpisodeId) || podcastsIndex[0];
  }, [activeEpisodeId]);

  // 过滤后的 154 篇篇目列表
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

  // 过滤后的 2026 专题列表
  const filteredTopics = useMemo(() => {
    if (!searchQuery) return alanInterview.topics;
    const q = searchQuery.toLowerCase();
    return alanInterview.topics.filter(t => 
      t.title.toLowerCase().includes(q) ||
      t.core.toLowerCase().includes(q) ||
      String(t.id).includes(q)
    );
  }, [searchQuery]);

  // 切换 154 篇篇目
  const handleSelectEpisode = newId => {
    setIsCatalogOpen(false);
    if (newId === activeEpisodeId) return;

    setActiveEpisodeId(newId);
    setActiveSliceIdx(0);
    setEditingNoteSliceKey(null);
  };

  // 切换 2026 专题
  const handleSelectTopic = newTopicId => {
    setIsCatalogOpen(false);
    if (newTopicId === activeTopicId) return;

    setActiveTopicId(newTopicId);
    localStorage.setItem('ink_alan_last_topic', String(newTopicId));
    setActiveSliceIdx(0);
    setEditingNoteSliceKey(null);
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 加载 154 篇逐字稿文本
  useEffect(() => {
    if (activeSeries !== 'wealth-freedom-154' || !activeEpisode) return;

    let isMounted = true;
    const cacheKey = activeEpisode.id;

    if (contentCacheRef.current[cacheKey]) {
      setCurrentEpisodeContent(contentCacheRef.current[cacheKey]);
      setIsLoadingContent(false);
      localStorage.setItem('ink_podcast_last_read', activeEpisode.id);
      if (contentRef.current) {
        contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    setIsLoadingContent(true);

    const loadContent = async () => {
      const filePath = `/src/content/podcasts/${activeEpisode.filename}`;
      const loader = podcastModules[filePath];

      if (loader) {
        try {
          const raw = await loader();
          if (isMounted) {
            contentCacheRef.current[cacheKey] = raw;
            setCurrentEpisodeContent(raw);
            setIsLoadingContent(false);
          }
        } catch (err) {
          console.error('加载逐字稿失败', err);
          if (isMounted) {
            const fallback = `# ${activeEpisode.fullTitle}\n\n> 出自《孙宇晨访谈逐字稿》\n\n🎙️ **孙宇晨** · 0:00\n\n${activeEpisode.excerpt || '正在载入内容...'}`;
            setCurrentEpisodeContent(fallback);
            setIsLoadingContent(false);
          }
        }
      } else {
        if (isMounted) {
          const fallback = `# ${activeEpisode.fullTitle}\n\n🎙️ **孙宇晨** · 0:00\n\n${activeEpisode.excerpt || '逐字稿加载中...'}`;
          setCurrentEpisodeContent(fallback);
          setIsLoadingContent(false);
        }
      }
    };

    loadContent();
    localStorage.setItem('ink_podcast_last_read', activeEpisode.id);

    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return () => {
      isMounted = false;
    };
  }, [activeSeries, activeEpisodeId, activeEpisode]);

  // ========== 2026 艾伦访谈切片构建 ==========
  const alanSlices = useMemo(() => {
    if (!activeTopic) return [];
    return activeTopic.segments.map((seg, idx) => ({
      id: idx + 1,
      tag: `切片 0${idx + 1} · 核心论点剖析`,
      title: seg.claim,
      assertion: seg.lead || `原访谈 ${seg.time_start} - ${seg.time_end} 关键认知`,
      lead: seg.lead,
      bone: `先抓骨架 · ${seg.skeleton[0] || '核心逻辑推演'}`,
      skeletonList: seg.skeleton,
      hook: seg.hook,
      originalQuote: seg.quote.join('\n\n'),
      timeBadge: `🎙️ 孙宇晨 · ${seg.time_start} - ${seg.time_end} 原声`,
      sliceKey: `alan-t${activeTopic.id}-s${idx + 1}`,
      sourceHint: `出自《孙宇晨 × 邵艾伦｜年轻人如何抓住AI时代的机会？》专题 0${activeTopic.id} · ${activeTopic.title}`,
      topicCore: activeTopic.core,
    }));
  }, [activeTopic]);

  // ========== 154 篇切片解析构建 ==========
  const parsedClassicSlices = useMemo(() => {
    const raw = currentEpisodeContent || activeEpisode.excerpt || '';
    if (!raw) return [];

    const slices = [];
    const dialogTurnRegex = /(?:^|\n)>\s*💬\s*\*\*提问\s*\/\s*对话\*\*(?:[^\n]*)\n+([\s\S]*?)(?=(?:^|\n)>\s*💬|\n*$)/g;
    let match;
    let index = 1;

    while ((match = dialogTurnRegex.exec(raw)) !== null) {
      const block = match[1].trim();
      if (!block) continue;

      const questionMatch = block.match(/^>\s*(.*?)(?=\n*🎙️|\n*$)/);
      const question = questionMatch ? questionMatch[1].replace(/^>\s*/, '').trim() : '核心认知问题';

      const answerMatch = block.match(/🎙️\s*\*\*孙宇晨\*\*(?:\s*·\s*(\d+:\d+))?\n+([\s\S]*)/);
      const time = answerMatch && answerMatch[1] ? answerMatch[1] : '0:00';
      const answerRaw = answerMatch ? answerMatch[2].trim() : block;

      const paras = answerRaw.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
      const leadSentence = paras[0] || '';
      const boneExcerpt = leadSentence.slice(0, 140);

      slices.push({
        id: index,
        tag: `Q${index} · 核心论点剖析`,
        title: question,
        assertion: boneExcerpt.length > 70 ? `${boneExcerpt.slice(0, 70)}...` : boneExcerpt,
        bone: `先抓骨架 · ${leadSentence.slice(0, 26) || '核心逻辑判断'}`,
        skeletonList: paras.slice(1, 3).map((p, i) => {
          const cleanP = p.replace(/\*\*/g, '').slice(0, 90);
          return i === 0 ? `先看底层逻辑 · ${cleanP}` : `再看现实误区与破局 · ${cleanP}`;
        }),
        originalQuote: answerRaw.slice(0, 600),
        timeBadge: `🎙️ 孙宇晨 · ${time} 原声切片`,
        sliceKey: `${activeEpisode.id}-${index}`,
        sourceHint: `出自《${activeEpisode.fullTitle}》原声访谈逐字稿记录。`,
      });

      index++;
    }

    if (slices.length === 0) {
      const paras = raw
        .split(/\n\n+/)
        .map(p => p.trim())
        .filter(p => p && !p.startsWith('#') && !p.startsWith('>'));

      let sliceIdx = 1;
      for (let i = 0; i < paras.length && sliceIdx <= 6; i += 2) {
        const p1 = paras[i] || '';
        const p2 = paras[i + 1] || '';
        if (p1.length < 30) continue;

        slices.push({
          id: sliceIdx,
          tag: `切片 0${sliceIdx} · 核心论点剖析`,
          title: p1.slice(0, 36) + '...',
          assertion: p1.slice(0, 95) + '...',
          bone: `先抓骨架 · ${p1.slice(0, 24)}`,
          skeletonList: p2 ? [`核心展开 · ${p2.slice(0, 100)}...`] : [`要点拆解 · 认清本质，平复心率与脑电波。`],
          originalQuote: `${p1}\n\n${p2}`.slice(0, 600),
          timeBadge: `🎙️ 孙宇晨 · 音频片段`,
          sliceKey: `${activeEpisode.id}-${sliceIdx}`,
          sourceHint: `出自《${activeEpisode.fullTitle}》原声访谈逐字稿记录。`,
        });
        sliceIdx++;
      }
    }

    if (slices.length === 0) {
      slices.push({
        id: 1,
        tag: `切片 01 · 核心论点剖析`,
        title: activeEpisode.title,
        assertion: activeEpisode.sliceQuote || activeEpisode.excerpt || '正在解析本篇观点...',
        bone: `先抓骨架 · ${activeEpisode.column || '漫谈'}`,
        skeletonList: ['沉浸式听读，在熟悉语境中平复脑电波。'],
        originalQuote: activeEpisode.excerpt || '音频逐字稿加载中...',
        timeBadge: `🎙️ 孙宇晨 · 0:00 原声`,
        sliceKey: `${activeEpisode.id}-1`,
        sourceHint: `出自《${activeEpisode.fullTitle}》原声访谈逐字稿记录。`,
      });
    }

    return slices;
  }, [currentEpisodeContent, activeEpisode]);

  // 当前激活系列对应的全部切片
  const currentSeriesSlices = useMemo(() => {
    return activeSeries === 'alan-2026' ? alanSlices : parsedClassicSlices;
  }, [activeSeries, alanSlices, parsedClassicSlices]);

  // 显示的切片列表
  const displayedSlices = useMemo(() => {
    if (activeSliceIdx === 0) return currentSeriesSlices;
    const match = currentSeriesSlices.find(s => s.id === activeSliceIdx);
    return match ? [match] : currentSeriesSlices;
  }, [currentSeriesSlices, activeSliceIdx]);

  // 全篇逐字稿格式化渲染
  const formattedFullHtml = useMemo(() => {
    if (activeSeries === 'alan-2026') {
      if (!activeTopic) return '';
      let md = `# 专题 0${activeTopic.id}　${activeTopic.title}\n\n`;
      md += `*原访谈约 ${activeTopic.time_start} – ${activeTopic.time_end} ｜ 孙宇晨 × 邵艾伦*\n\n`;
      md += `**一句话命题：${activeTopic.core}**\n\n---\n\n`;
      activeTopic.segments.forEach((seg, idx) => {
        md += `### 切片 0${idx + 1}（${seg.time_start} – ${seg.time_end}）\n\n`;
        if (seg.lead) md += `*${seg.lead}*\n\n`;
        md += `**原话**\n\n`;
        seg.quote.forEach(q => {
          md += `> ${q}\n>\n`;
        });
        md += `\n**命题**　${seg.claim}\n\n`;
        md += `**骨架**\n\n`;
        seg.skeleton.forEach(s => {
          md += `- ${s}\n`;
        });
        if (seg.hook) {
          md += `\n*${seg.hook}*\n\n`;
        }
        md += `---\n\n`;
      });
      if (activeTopic.closing) {
        md += `### 今晚收束\n\n`;
        activeTopic.closing.forEach(c => {
          md += `> ${c}\n`;
        });
      }
      return renderMarkdown(md);
    }

    if (!currentEpisodeContent) return '';
    let processed = currentEpisodeContent;
    processed = processed.replace(/^#\s+.*?\n+/, '');
    processed = processed.replace(/^>\s+出自.*?合集.*?\n+/, '');
    processed = processed.replace(/\*\*讲话人1\*\*/g, '');
    processed = processed.replace(
      /🎙️\s*\*\*孙宇晨\*\*(?:\s*·\s*(\d+:\d+))?/g,
      (match, time) => {
        const timeHtml = time ? `<span class="speaker-time">${time}</span>` : '';
        return `<div class="speaker-bubble speaker-sun"><span class="speaker-name">🎙️ 孙宇晨</span>${timeHtml}</div>`;
      }
    );
    return renderMarkdown(processed);
  }, [activeSeries, activeTopic, currentEpisodeContent]);

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

  // 复制单张切片笔记卡片为 Markdown
  const handleCopySliceCard = slice => {
    const noteObj = sliceNotes[slice.sliceKey];
    const sourceTitle = activeSeries === 'alan-2026'
      ? `【2026 访谈 · 专题 0${activeTopic.id}】${activeTopic.title}`
      : `【${activeEpisode.fullTitle}】`;

    let md = `### ${sourceTitle} ${slice.tag}\n\n`;
    md += `> ${slice.originalQuote}\n\n`;
    md += `**【核心论点剖析】**\n${slice.title}\n${slice.assertion}\n\n`;
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
    }).catch(() => {});
  };

  // 标为已读
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

  // 154 篇上一篇/下一篇
  const currentClassicIndex = podcastsIndex.findIndex(p => p.id === activeEpisodeId);
  const prevClassicEpisode = currentClassicIndex > 0 ? podcastsIndex[currentClassicIndex - 1] : null;
  const nextClassicEpisode = currentClassicIndex < podcastsIndex.length - 1 ? podcastsIndex[currentClassicIndex + 1] : null;

  // 艾伦访谈进度统计
  const alanStats = useMemo(() => {
    const total = alanInterview.topics.length;
    const completed = alanInterview.topics.filter(t => readEpisodeIds.includes(`alan-${t.id}`)).length;
    const percent = Math.round((completed / total) * 100);
    return { completed, total, percent, isAllDone: completed === total && total > 0 };
  }, [readEpisodeIds]);

  // 154 篇经典逐字稿进度统计
  const classicStats = useMemo(() => {
    const total = podcastsIndex.length;
    const completed = podcastsIndex.filter(p => readEpisodeIds.includes(p.id)).length;
    const percent = Math.round((completed / total) * 100);
    return { completed, total, percent, isAllDone: completed === total && total > 0 };
  }, [readEpisodeIds]);

  // 当前激活系列的进度统计
  const currentStats = activeSeries === 'alan-2026' ? alanStats : classicStats;
  const currentUnit = activeSeries === 'alan-2026' ? '专题' : '篇';

  // 2026 专题上一篇/下一篇
  const prevTopic = activeTopicId > 1 ? alanInterview.topics[activeTopicId - 2] : null;
  const nextTopic = activeTopicId < alanInterview.topics.length ? alanInterview.topics[activeTopicId] : null;

  // 当前激活篇目的唯一键与已读状态
  const currentEpisodeKey = activeSeries === 'alan-2026' ? `alan-${activeTopic.id}` : activeEpisode.id;
  const isCurrentRead = readEpisodeIds.includes(currentEpisodeKey);
  const hasNextItem = activeSeries === 'alan-2026' ? Boolean(nextTopic) : Boolean(nextClassicEpisode);

  // 底部一键「打卡并顺畅阅读下一篇」
  const handleCheckinAndNext = () => {
    if (!isCurrentRead) {
      toggleMarkRead(currentEpisodeKey);
    }
    if (activeSeries === 'alan-2026') {
      if (nextTopic) {
        handleSelectTopic(nextTopic.id);
      }
    } else {
      if (nextClassicEpisode) {
        handleSelectEpisode(nextClassicEpisode.id);
      }
    }
  };

  return (
    <div className="podcast-contrast-theme animate-fade-in" ref={contentRef}>
      {/* 顶部做题对照式导航容器 */}
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
                title={`2026 艾伦访谈 · 已读 ${alanStats.completed}/${alanStats.total} 专题`}
              >
                <Sparkles size={12} className="text-amber-400" />
                <span>艾伦长访谈</span>
                <span className="contrast-chip-count">{alanStats.completed}/{alanStats.total}</span>
              </button>
              <button
                type="button"
                className={`contrast-series-chip ${activeSeries === 'wealth-freedom-154' ? 'active' : ''}`}
                onClick={() => handleSwitchSeries('wealth-freedom-154')}
                title={`财富自由之路 · 已读 ${classicStats.completed}/${classicStats.total} 篇`}
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
                title={activeSeries === 'alan-2026' ? '浏览与切换 7 个睡前专题' : '浏览与切换 154 篇逐字稿章节'}
              >
                <BookOpen size={13} className="text-amber-400" />
                <span className="contrast-btn-ep-title">
                  {activeSeries === 'alan-2026'
                    ? `专题 0${activeTopic.id} ${activeTopic.title}`
                    : `#${activeEpisode.id} ${activeEpisode.title}`}
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
                        : `选读章节（已过 ${classicStats.completed}/${classicStats.total}）`}
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
                      placeholder={activeSeries === 'alan-2026' ? '搜索专题名称、核心命题...' : '搜索章节编号、主题...'}
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

                  {/* 154篇模式下的栏目横向筛选条 */}
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
                      filteredTopics.map(t => {
                        const isSelected = t.id === activeTopicId;
                        const isRead = readEpisodeIds.includes(`alan-${t.id}`);
                        return (
                          <div
                            key={t.id}
                            className={`contrast-dd-item ${isSelected ? 'selected' : ''} ${isRead ? 'is-read' : ''}`}
                            onClick={() => handleSelectTopic(t.id)}
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
                      filteredEpisodes.map(ep => {
                        const isSelected = ep.id === activeEpisodeId;
                        const isRead = readEpisodeIds.includes(ep.id);
                        return (
                          <div
                            key={ep.id}
                            className={`contrast-dd-item ${isSelected ? 'selected' : ''} ${isRead ? 'is-read' : ''}`}
                            onClick={() => handleSelectEpisode(ep.id)}
                          >
                            <span className="contrast-dd-item-num">#{ep.id}</span>
                            <div className="contrast-dd-item-info">
                              <span className="contrast-dd-item-title">{ep.title}</span>
                              <div className="contrast-dd-item-meta">
                                {ep.column && <span className="contrast-dd-item-tag">{ep.column}</span>}
                                <span>{ep.readTimeMinutes || 3} 分钟</span>
                              </div>
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
              className={`contrast-ctrl-btn ${readEpisodeIds.includes(activeSeries === 'alan-2026' ? `alan-${activeTopic.id}` : activeEpisode.id) ? 'is-read' : ''}`}
              onClick={() => toggleMarkRead(activeSeries === 'alan-2026' ? `alan-${activeTopic.id}` : activeEpisode.id)}
              title="标记为今晚已读完"
            >
              <CheckCircle2 size={13} />
              <span>{readEpisodeIds.includes(activeSeries === 'alan-2026' ? `alan-${activeTopic.id}` : activeEpisode.id) ? '已过' : '打卡'}</span>
            </button>

            {/* 上一篇/下一篇 */}
            {activeSeries === 'alan-2026' ? (
              <div className="contrast-nav-pair">
                <button
                  type="button"
                  className="contrast-ctrl-btn nav-btn"
                  disabled={!prevTopic}
                  onClick={() => prevTopic && handleSelectTopic(prevTopic.id)}
                  title="上一个专题"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  className="contrast-ctrl-btn nav-btn"
                  disabled={!nextTopic}
                  onClick={() => nextTopic && handleSelectTopic(nextTopic.id)}
                  title="下一个专题"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            ) : (
              <div className="contrast-nav-pair">
                <button
                  type="button"
                  className="contrast-ctrl-btn nav-btn"
                  disabled={!prevClassicEpisode}
                  onClick={() => prevClassicEpisode && handleSelectEpisode(prevClassicEpisode.id)}
                  title="上一篇"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  className="contrast-ctrl-btn nav-btn"
                  disabled={!nextClassicEpisode}
                  onClick={() => nextClassicEpisode && handleSelectEpisode(nextClassicEpisode.id)}
                  title="下一篇"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2026 艾伦访谈专属专题介绍卡片 */}
      {activeSeries === 'alan-2026' && activeTopic && (
        <div className="contrast-topic-hero">
          <div className="contrast-topic-hero-header">
            <span className="contrast-topic-hero-badge">
              专题 0{activeTopic.id} ｜ 原访谈约 {activeTopic.time_start} – {activeTopic.time_end}
            </span>
            <span className="contrast-topic-hero-speaker">🎙️ 孙宇晨 × 邵艾伦</span>
          </div>
          <h2 className="contrast-topic-hero-title">{activeTopic.title}</h2>
          <div className="contrast-topic-hero-core">
            <span className="contrast-topic-core-label">一句话命题：</span>
            <span className="contrast-topic-core-text">{activeTopic.core}</span>
          </div>
        </div>
      )}

      {/* 认知降温初衷提示 */}
      <div className="contrast-mindset-banner">
        <Moon size={14} className="text-amber-400 flex-shrink-0" />
        <span className="contrast-mindset-text">
          深夜睡不着时，看未知的新东西会激发多巴胺导致兴奋；听过、熟悉、不带压迫感的内容是最好的“思维滑梯”——平复心率与脑电波，自然产生睡意。
        </span>
      </div>

      {/* 主展示区：左侧相关原文 + 右侧核心论点剖析与随笔笔记 */}
      {viewMode === 'contrast' ? (
        <main className={`contrast-main-container font-size-${fontSize}`}>
          {isLoadingContent ? (
            <div className="contrast-loading-box">
              <Moon size={24} className="animate-spin text-amber-500" />
              <p>正在舒缓翻开对照手札...</p>
            </div>
          ) : (
            displayedSlices.map(slice => {
              const noteObj = sliceNotes[slice.sliceKey];
              const isEditingThis = editingNoteSliceKey === slice.sliceKey;
              const isCopied = copiedKey === slice.sliceKey;

              return (
                <div key={slice.sliceKey} className="contrast-dual-pair">
                  {/* ====== 【左栏】：对照相关原文（先读原文输入） ====== */}
                  <section className="contrast-pane contrast-pane-left">
                    <div className="contrast-slice-tag-row">
                      <span className="contrast-left-header-label">
                        {activeSeries === 'alan-2026'
                          ? '对照相关原声 · 🎙️ 孙宇晨（对话邵艾伦）'
                          : '对照相关原文 · 🎙️ 孙宇晨'}
                      </span>
                    </div>

                    {/* 引子提示 */}
                    {slice.lead && (
                      <div className="contrast-quote-lead">
                        <span>💬 {slice.lead}</span>
                      </div>
                    )}

                    {/* 原文长引用段落 */}
                    <div className="contrast-original-quote-body">
                      {slice.originalQuote.split('\n\n').map((para, pIdx) => (
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
                    {slice.assertion && slice.assertion !== slice.title && (
                      <p className="contrast-sub-assertion">{slice.assertion}</p>
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

          {/* 2026 艾伦访谈专题睡前收束语 */}
          {activeSeries === 'alan-2026' && activeTopic.closing && activeTopic.closing.length > 0 && (
            <div className="contrast-closing-card">
              <div className="contrast-closing-icon">
                <Moon size={22} className="text-amber-400" />
              </div>
              <h3 className="contrast-closing-title">今晚收束 · 心智归位</h3>
              <div className="contrast-closing-body">
                {activeTopic.closing.map((c, cIdx) => (
                  <p key={cIdx} className="contrast-closing-p">{c}</p>
                ))}
              </div>
            </div>
          )}
        </main>
      ) : (
        /* 全篇长文通读模式 */
        <main className={`contrast-full-reader font-size-${fontSize}`}>
          {isLoadingContent ? (
            <div className="contrast-loading-box"><p>正在翻开逐字稿...</p></div>
          ) : (
            <div className="contrast-full-article-wrap">
              <div className="contrast-full-header">
                <span className="contrast-full-ep-id">
                  {activeSeries === 'alan-2026'
                    ? `专题 0${activeTopic.id} ｜ 原访谈约 ${activeTopic.time_start} – ${activeTopic.time_end}`
                    : `第 ${activeEpisode.id} 篇 · ${activeEpisode.column}`}
                </span>
                <h2 className="contrast-full-h1">
                  {activeSeries === 'alan-2026'
                    ? `${activeTopic.title} ｜ 孙宇晨 × 邵艾伦`
                    : activeEpisode.fullTitle}
                </h2>
                <div className="contrast-full-meta">
                  {activeSeries === 'alan-2026' ? (
                    <span>核心命题：{activeTopic.core}</span>
                  ) : (
                    <>
                      <span>{activeEpisode.wordCount} 字</span>
                      <span>·</span>
                      <span>约 {activeEpisode.readTimeMinutes} 分钟</span>
                    </>
                  )}
                </div>
              </div>

              {activeSeries === 'wealth-freedom-154' ? (
                <TranscriptAnnotations key={activeEpisode.id} episode={activeEpisode} html={formattedFullHtml} fontSize={fontSize} />
              ) : (
                <div
                  className="podcast-article-content"
                  dangerouslySetInnerHTML={{ __html: formattedFullHtml }}
                />
              )}
            </div>
          )}
        </main>
      )}

      {/* 底部翻页控制卡片 */}
      <footer className="contrast-footer-row">
        {activeSeries === 'alan-2026' ? (
          <>
            {prevTopic ? (
              <button
                type="button"
                className="contrast-footer-nav-card prev"
                onClick={() => handleSelectTopic(prevTopic.id)}
              >
                <div className="contrast-footer-nav-dir">
                  <ChevronLeft size={14} />
                  <span>上一个专题</span>
                </div>
                <div className="contrast-footer-nav-title">专题 0{prevTopic.id} · {prevTopic.title}</div>
              </button>
            ) : <div />}

            {nextTopic ? (
              <button
                type="button"
                className="contrast-footer-nav-card next"
                onClick={() => handleSelectTopic(nextTopic.id)}
              >
                <div className="contrast-footer-nav-dir">
                  <span>下一个专题</span>
                  <ChevronRight size={14} />
                </div>
                <div className="contrast-footer-nav-title">专题 0{nextTopic.id} · {nextTopic.title}</div>
              </button>
            ) : <div />}
          </>
        ) : (
          <>
            {prevClassicEpisode ? (
              <button
                type="button"
                className="contrast-footer-nav-card prev"
                onClick={() => handleSelectEpisode(prevClassicEpisode.id)}
              >
                <div className="contrast-footer-nav-dir">
                  <ChevronLeft size={14} />
                  <span>上一篇</span>
                </div>
                <div className="contrast-footer-nav-title">#{prevClassicEpisode.id} {prevClassicEpisode.title}</div>
              </button>
            ) : <div />}

            {nextClassicEpisode ? (
              <button
                type="button"
                className="contrast-footer-nav-card next"
                onClick={() => handleSelectEpisode(nextClassicEpisode.id)}
              >
                <div className="contrast-footer-nav-dir">
                  <span>下一篇</span>
                  <ChevronRight size={14} />
                </div>
                <div className="contrast-footer-nav-title">#{nextClassicEpisode.id} {nextClassicEpisode.title}</div>
              </button>
            ) : <div />}
          </>
        )}
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
