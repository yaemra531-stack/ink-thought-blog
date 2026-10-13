import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Moon,
  Search,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  Type,
  Quote,
  PenLine,
  Trash2,
  Copy,
  Check,
  X,
  ExternalLink,
  MessageSquareQuote,
  Columns,
  AlignLeft,
  ListFilter
} from 'lucide-react';
import podcastsIndex from '../content/podcastsIndex.json';
import { renderMarkdown } from '../utils/markdownParser';

// 懒加载所有分篇 Markdown 文本
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
  // 当前篇目 ID
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

  // 篇目抽屉/弹窗是否打开
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  // 正文原始文本与加载状态
  const [currentEpisodeContent, setCurrentEpisodeContent] = useState('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);

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

  // 用户在对照卡片上的自定义随笔笔记（按 `${episodeId}-${sliceIdx}` 存储）
  const [sliceNotes, setSliceNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ink_podcast_slice_notes') || '{}');
    } catch {
      return {};
    }
  });

  // 正在编辑的切片笔记输入框：{ [sliceKey]: string }
  const [editingNoteSliceKey, setEditingNoteSliceKey] = useState(null);
  const [noteDraftText, setNoteDraftText] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  const contentRef = useRef(null);

  // 栏目列表
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

  // 当前篇目元信息
  const activeEpisode = useMemo(() => {
    return podcastsIndex.find(p => p.id === activeEpisodeId) || podcastsIndex[0];
  }, [activeEpisodeId]);

  // 过滤后的篇目列表
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

  // 加载逐字稿文本
  useEffect(() => {
    if (!activeEpisode) return;

    let isMounted = true;
    setIsLoadingContent(true);
    setActiveSliceIdx(0); // 重置切片选中

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
            setCurrentEpisodeContent('### 加载失败\n未能读取该篇逐字稿文件。');
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
    localStorage.setItem('ink_podcast_last_read', activeEpisode.id);

    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return () => {
      isMounted = false;
    };
  }, [activeEpisodeId, activeEpisode]);

  // ========== 核心解析：将逐字稿拆解为高质量的左右对照切片 (Contrast Slices) ==========
  const parsedSlices = useMemo(() => {
    if (!currentEpisodeContent) return [];

    const raw = currentEpisodeContent;
    const slices = [];

    // 尝试按对谈结构切分（> 💬 **提问 / 对话** 与 🎙️ **孙宇晨**）
    const dialogTurnRegex = /(?:^|\n)>\s*💬\s*\*\*提问\s*\/\s*对话\*\*(?:[^\n]*)\n+([\s\S]*?)(?=(?:^|\n)>\s*💬|\n*$)/g;
    let match;
    let index = 1;

    while ((match = dialogTurnRegex.exec(raw)) !== null) {
      const block = match[1].trim();
      if (!block) continue;

      // 提取提问问题
      const questionMatch = block.match(/^>\s*(.*?)(?=\n*🎙️|\n*$)/);
      const question = questionMatch ? questionMatch[1].replace(/^>\s*/, '').trim() : '核心认知问题';

      // 提取主讲人回答
      const answerMatch = block.match(/🎙️\s*\*\*孙宇晨\*\*(?:\s*·\s*(\d+:\d+))?\n+([\s\S]*)/);
      const time = answerMatch && answerMatch[1] ? answerMatch[1] : '0:00';
      const answerRaw = answerMatch ? answerMatch[2].trim() : block;

      // 从回答中提取首要骨架段落（第一大段为核心观点）
      const paras = answerRaw.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
      const leadSentence = paras[0] || '';
      const boneExcerpt = leadSentence.slice(0, 140);

      slices.push({
        id: index,
        tag: `Q${index} · 核心论点剖析`,
        title: question,
        assertion: boneExcerpt.length > 70 ? `${boneExcerpt.slice(0, 70)}...` : boneExcerpt,
        bone: `先抓骨架 · ${leadSentence.slice(0, 28) || '核心逻辑判断'}`,
        breakdownList: paras.slice(1, 3).map((p, i) => {
          const cleanP = p.replace(/\*\*/g, '').slice(0, 90);
          return i === 0 ? `先看底层逻辑 · ${cleanP}` : `再看现实误区与破局 · ${cleanP}`;
        }),
        originalQuote: answerRaw.slice(0, 600),
        timeBadge: `🎙️ 孙宇晨 · ${time} 原声切片`,
        sliceKey: `${activeEpisode.id}-${index}`,
      });

      index++;
    }

    // 如果该篇是单人独白漫谈（没有提问标签），按长段落智能聚合成切片
    if (slices.length === 0) {
      const paras = raw
        .split(/\n\n+/)
        .map(p => p.trim())
        .filter(p => p && !p.startsWith('#') && !p.startsWith('>'));

      let sliceIdx = 1;
      for (let i = 0; i < paras.length && sliceIdx <= 6; i += 2) {
        const p1 = paras[i] || '';
        const p2 = paras[i + 1] || '';
        if (p1.length < 40) continue;

        slices.push({
          id: sliceIdx,
          tag: `切片 0${sliceIdx} · 核心认知提炼`,
          title: p1.slice(0, 36) + '...',
          assertion: p1.slice(0, 95) + '...',
          bone: `先抓骨架 · ${p1.slice(0, 24)}`,
          breakdownList: p2 ? [`核心展开 · ${p2.slice(0, 110)}...`] : [`要点拆解 · 认清本质，平复心率与脑电波。`],
          originalQuote: `${p1}\n\n${p2}`.slice(0, 600),
          timeBadge: `🎙️ 孙宇晨 · 漫谈音频片段`,
          sliceKey: `${activeEpisode.id}-${sliceIdx}`,
        });
        sliceIdx++;
      }
    }

    return slices;
  }, [currentEpisodeContent, activeEpisode.id]);

  // 显示的切片列表
  const displayedSlices = useMemo(() => {
    if (activeSliceIdx === 0) return parsedSlices;
    return parsedSlices.filter(s => s.id === activeSliceIdx);
  }, [parsedSlices, activeSliceIdx]);

  // 全篇逐字稿格式化渲染
  const formattedFullHtml = useMemo(() => {
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
  }, [currentEpisodeContent]);

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
    let md = `### 【${activeEpisode.fullTitle}】${slice.tag}\n\n`;
    md += `**【核心观点】**\n${slice.title}\n${slice.assertion}\n\n`;
    md += `> ${slice.originalQuote}\n\n`;
    if (noteObj?.text) {
      md += `**【我的想法与随笔】**\n${noteObj.text}\n\n`;
    }
    md += `—— 来自睡前认知对照阅读`;

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

  // 上一篇/下一篇
  const currentIndex = podcastsIndex.findIndex(p => p.id === activeEpisodeId);
  const prevEpisode = currentIndex > 0 ? podcastsIndex[currentIndex - 1] : null;
  const nextEpisode = currentIndex < podcastsIndex.length - 1 ? podcastsIndex[currentIndex + 1] : null;

  return (
    <div className="podcast-contrast-theme animate-fade-in" ref={contentRef}>
      {/* 顶部做题对照式导航容器 */}
      <header className="contrast-topbar-container">
        {/* 标题与描述 */}
        <div className="contrast-topbar-header">
          <div className="contrast-topbar-title-wrap">
            <h1 className="contrast-topbar-h1">做题对照 · 逐字精读</h1>
            <p className="contrast-topbar-sub">
              根据本篇题干与音频原声。左侧先看思维骨架与认知反思，右侧对照原汁原味的逐字稿；判断依据与随笔按需展开。
            </p>
          </div>

          {/* 右侧控制胶囊 */}
          <div className="contrast-topbar-controls">
            {/* 切换篇目按钮 */}
            <button
              type="button"
              className="contrast-ctrl-btn episode-selector-btn"
              onClick={() => setIsCatalogOpen(true)}
              title="浏览与选择 154 篇逐字稿"
            >
              <BookOpen size={14} className="text-emerald-400" />
              <span>#{activeEpisode.id} {activeEpisode.title}</span>
              <span className="contrast-down-arrow">▾</span>
            </button>

            {/* 对照精读 / 全篇通读 切换 */}
            <div className="contrast-mode-switch">
              <button
                type="button"
                className={`contrast-mode-btn ${viewMode === 'contrast' ? 'active' : ''}`}
                onClick={() => setViewMode('contrast')}
                title="左右平行对照精读模式"
              >
                <Columns size={13} />
                <span>对照</span>
              </button>
              <button
                type="button"
                className={`contrast-mode-btn ${viewMode === 'full' ? 'active' : ''}`}
                onClick={() => setViewMode('full')}
                title="纯净全篇逐字稿长文通读"
              >
                <AlignLeft size={13} />
                <span>通读</span>
              </button>
            </div>

            {/* 字号调节 */}
            <button
              type="button"
              className="contrast-ctrl-btn font-btn"
              onClick={handleToggleFontSize}
              title={`当前字号: ${FONT_SIZE_LABELS[fontSize]}，点击切换`}
            >
              <Type size={13} />
              <span>{FONT_SIZE_LABELS[fontSize]}</span>
            </button>

            {/* 标为已读 */}
            <button
              type="button"
              className={`contrast-ctrl-btn ${readEpisodeIds.includes(activeEpisode.id) ? 'is-read' : ''}`}
              onClick={() => toggleMarkRead(activeEpisode.id)}
              title="标记为今晚已读完"
            >
              <CheckCircle2 size={14} />
              <span>{readEpisodeIds.includes(activeEpisode.id) ? '已过' : '打卡'}</span>
            </button>

            {/* 上一篇/下一篇 */}
            <button
              type="button"
              className="contrast-ctrl-btn nav-btn"
              disabled={!prevEpisode}
              onClick={() => prevEpisode && setActiveEpisodeId(prevEpisode.id)}
              title="上一篇"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              className="contrast-ctrl-btn nav-btn"
              disabled={!nextEpisode}
              onClick={() => nextEpisode && setActiveEpisodeId(nextEpisode.id)}
              title="下一篇"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* 切片胶囊切换器：Q1, Q2, Q3... 系列 */}
        {viewMode === 'contrast' && parsedSlices.length > 0 && (
          <div className="contrast-pills-row">
            <button
              type="button"
              className={`contrast-pill-item ${activeSliceIdx === 0 ? 'active' : ''}`}
              onClick={() => setActiveSliceIdx(0)}
            >
              全部流 ({parsedSlices.length})
            </button>
            {parsedSlices.map(slice => (
              <button
                key={slice.id}
                type="button"
                className={`contrast-pill-item ${activeSliceIdx === slice.id ? 'active' : ''}`}
                onClick={() => setActiveSliceIdx(slice.id)}
                title={slice.title}
              >
                Q{slice.id}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* 认知降温初衷提示（可收起/极简呈现） */}
      <div className="contrast-mindset-banner">
        <Moon size={14} className="text-emerald-400 flex-shrink-0" />
        <span className="contrast-mindset-text">
          听过、熟悉、不带压迫感，但本身又有思维密度的内容，恰好是最好的“思维滑梯”——平复心率与脑电波，在熟悉语境中产生睡意。
        </span>
      </div>

      {/* 主展示区：左右平行双栏对照模式 */}
      {viewMode === 'contrast' ? (
        <main className={`contrast-main-container font-size-${fontSize}`}>
          {isLoadingContent ? (
            <div className="contrast-loading-box">
              <Moon size={24} className="animate-spin text-emerald-400" />
              <p>正在舒缓展开对照手札...</p>
            </div>
          ) : displayedSlices.length === 0 ? (
            <div className="contrast-empty-box">
              <p>本篇暂无切片拆解，可点击右上角切换为「通读」模式浏览完整稿件。</p>
            </div>
          ) : (
            displayedSlices.map(slice => {
              const noteObj = sliceNotes[slice.sliceKey];
              const isEditingThis = editingNoteSliceKey === slice.sliceKey;
              const isCopied = copiedKey === slice.sliceKey;

              return (
                <div key={slice.sliceKey} className="contrast-dual-pair">
                  {/* ====== 左栏：思维骨架与认知反思 ====== */}
                  <section className="contrast-pane contrast-pane-left">
                    {/* 切片标识 */}
                    <div className="contrast-slice-tag-row">
                      <span className="contrast-slice-q-tag">{slice.tag}</span>
                    </div>

                    {/* 大号核心命题 */}
                    <h2 className="contrast-main-assertion">{slice.title}</h2>
                    <p className="contrast-sub-assertion">{slice.assertion}</p>

                    {/* 先抓骨架胶囊 */}
                    <div className="contrast-bone-capsule">
                      <span>{slice.bone}</span>
                    </div>

                    {/* 逐块拆解与阅读顺序 */}
                    <div className="contrast-breakdown-box">
                      <div className="contrast-breakdown-title">
                        <span>▶ 逐块拆解与认知逻辑</span>
                      </div>
                      <div className="contrast-breakdown-items">
                        {slice.breakdownList.map((item, idx) => (
                          <p key={idx} className="contrast-breakdown-p">
                            {item}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* 读题时可能卡住的词与搭配 / 深度思考与我的随笔卡片 */}
                    <div className="contrast-reflection-card">
                      <div className="contrast-ref-header">
                        <span className="contrast-ref-title">深度思考与随笔记录</span>
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
                            title="复制本组对照卡片"
                          >
                            {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
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
                            placeholder="写下你对这句论点的联想、生活迁移或批判性反思..."
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
                              <span>保存思考</span>
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
                            把精力集中在根本战略上，不要用战术忙碌欺骗自己；在熟悉语境中平复焦虑，安稳入眠。
                          </p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* ====== 右栏：对照相关原文 ====== */}
                  <section className="contrast-pane contrast-pane-right">
                    <div className="contrast-slice-tag-row">
                      <span className="contrast-right-header-label">对照相关原文</span>
                    </div>

                    {/* 原文长引用段落 */}
                    <div className="contrast-original-quote-body">
                      <p className="contrast-quote-p">
                        {slice.originalQuote}
                      </p>
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
                          title="切换到通读模式看上下文"
                        >
                          到原文看这一段 →
                        </button>
                      </div>
                      <p className="contrast-source-hint">
                        出自《{activeEpisode.fullTitle}》原声访谈逐字稿记录。
                      </p>
                    </div>
                  </section>
                </div>
              );
            })
          )}
        </main>
      ) : (
        /* 全篇长文通读模式 */
        <main className={`contrast-full-reader font-size-${fontSize}`}>
          <div className="contrast-full-article-wrap">
            <div className="contrast-full-header">
              <span className="contrast-full-ep-id">第 {activeEpisode.id} 篇 · {activeEpisode.column}</span>
              <h2 className="contrast-full-h1">{activeEpisode.fullTitle}</h2>
              <div className="contrast-full-meta">
                <span>{activeEpisode.wordCount} 字</span>
                <span>·</span>
                <span>约 {activeEpisode.readTimeMinutes} 分钟</span>
              </div>
            </div>

            <div
              className="contrast-full-body"
              dangerouslySetInnerHTML={{ __html: formattedFullHtml }}
            />
          </div>
        </main>
      )}

      {/* 底部翻页控制卡片 */}
      <footer className="contrast-footer-row">
        {prevEpisode ? (
          <button
            type="button"
            className="contrast-footer-card prev"
            onClick={() => setActiveEpisodeId(prevEpisode.id)}
          >
            <span className="footer-dir">← 上一篇 (#{prevEpisode.id})</span>
            <span className="footer-title">{prevEpisode.title}</span>
          </button>
        ) : <div />}

        {nextEpisode && (
          <button
            type="button"
            className="contrast-footer-card next"
            onClick={() => setActiveEpisodeId(nextEpisode.id)}
          >
            <span className="footer-dir">下一篇 (#{nextEpisode.id}) →</span>
            <span className="footer-title">{nextEpisode.title}</span>
          </button>
        )}
      </footer>

      {/* 154 篇全量目录选择抽屉/弹窗 */}
      {isCatalogOpen && (
        <div className="contrast-catalog-overlay" onClick={() => setIsCatalogOpen(false)}>
          <div className="contrast-catalog-modal" onClick={e => e.stopPropagation()}>
            <div className="contrast-catalog-header">
              <div className="contrast-cat-title">
                <BookOpen size={16} className="text-emerald-400" />
                <span>逐字稿目录 (收录 154 篇)</span>
              </div>
              <button
                type="button"
                className="contrast-cat-close"
                onClick={() => setIsCatalogOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* 搜索与分类 */}
            <div className="contrast-cat-filters">
              <div className="contrast-cat-search-box">
                <Search size={14} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索篇目编号、主题或关键词..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="contrast-cat-input"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="contrast-cat-clear">✕</button>
                )}
              </div>

              <div className="contrast-cat-pills">
                {columnsList.slice(0, 10).map(col => (
                  <button
                    key={col}
                    type="button"
                    className={`contrast-cat-pill ${selectedColumn === col ? 'active' : ''}`}
                    onClick={() => setSelectedColumn(col)}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>

            {/* 篇目滚动列表 */}
            <div className="contrast-cat-list">
              {filteredEpisodes.map(item => {
                const isActive = item.id === activeEpisodeId;
                const isRead = readEpisodeIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`contrast-cat-item ${isActive ? 'active' : ''} ${isRead ? 'is-read' : ''}`}
                    onClick={() => {
                      setActiveEpisodeId(item.id);
                      setIsCatalogOpen(false);
                    }}
                  >
                    <div className="contrast-cat-item-top">
                      <span className="contrast-cat-id">#{item.id}</span>
                      <span className="contrast-cat-col">{item.column}</span>
                      {isRead && <span className="contrast-cat-read">✓ 已读</span>}
                    </div>
                    <div className="contrast-cat-item-title">{item.title}</div>
                    <div className="contrast-cat-item-meta">
                      <span>{item.wordCount} 字 · 约 {item.readTimeMinutes} 分钟</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
