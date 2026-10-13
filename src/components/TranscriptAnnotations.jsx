import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { PenLine, Quote, X, Copy, Check, Trash2, Share2 } from 'lucide-react';
import { captureAnchor, resolveAnchor, rangeFromAnchor } from '../utils/annotationAnchors';

export default function TranscriptAnnotations({ episode, html, fontSize }) {
  const activeEpisode = episode;
  // 阅读时只展示随文标记，笔记合集按需打开。
  const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(false);
  const [draftAnchor, setDraftAnchor] = useState(null);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [notePositions, setNotePositions] = useState([]);
  const [draftPosition, setDraftPosition] = useState(0);
  const [storageError, setStorageError] = useState('');

  // 全部已保存批注列表
  const [annotations, setAnnotations] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ink_podcast_annotations') || '[]');
      return Array.isArray(saved) ? saved : [];
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


  const readerAreaRef = useRef(null);
  const thoughtInputRef = useRef(null);
  const notesPanelRef = useRef(null);
  const transcriptLayoutRef = useRef(null);

  // 当前篇目下的批注列表
  const currentEpisodeNotes = useMemo(() => {
    return annotations.filter(n => n.episodeId === activeEpisode.id);
  }, [annotations, activeEpisode.id]);

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
      const anchor = captureAnchor(readerAreaRef.current, range);
      if (!anchor) {
        setFloatingBtn(prev => ({ ...prev, visible: false }));
        return;
      }
      const rect = range.getClientRects()[0] || range.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        // 计算按钮位置，稍微向上偏移
        const btnX = Math.min(Math.max(rect.left + rect.width / 2, 80), window.innerWidth - 80);
        const btnY = Math.max(rect.top - 46, 10);

        setFloatingBtn({
          visible: true,
          x: btnX,
          y: btnY,
          text: selectedText,
          anchor,
        });
      }
    } catch {
      // 容错处理
    }
  };

  const closeMarginNote = () => {
    setDraftAnchor(null);
    setActiveQuote('');
    setThoughtInput('');
    setSelectedNoteId(null);
    setStorageError('');
  };

  // 引文与编辑器共用正文中的锚点，正文不因批注开合而缩窄。
  const handleApplySelectionToNote = () => {
    if (!floatingBtn.text || !floatingBtn.anchor) return;
    setActiveQuote(floatingBtn.text);
    setDraftAnchor(floatingBtn.anchor);
    setThoughtInput('');
    setSelectedNoteId(null);
    setStorageError('');
    setFloatingBtn(prev => ({ ...prev, visible: false }));
    window.getSelection()?.removeAllRanges();
  };

  useEffect(() => {
    if (draftAnchor) thoughtInputRef.current?.focus({ preventScroll: true });
  }, [draftAnchor]);

  useEffect(() => {
    if (isNotesPanelOpen && !notesPanelRef.current?.open) notesPanelRef.current?.showModal();
  }, [isNotesPanelOpen]);


  useEffect(() => {
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        closeMarginNote();
        setFloatingBtn(prev => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

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
      anchor: draftAnchor,
      thought: thoughtInput.trim(),
      createdAt: timeStr,
      timestamp: Date.now(),
    };

    const nextAnnotations = [newNote, ...annotations];
    try {
      localStorage.setItem('ink_podcast_annotations', JSON.stringify(nextAnnotations));
    } catch (e) {
      setStorageError('未能保存，请检查浏览器存储空间后重试。');
      return;
    }
    setAnnotations(nextAnnotations);

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
    closeMarginNote();
    setNoteSavedFeedback(true);
    setTimeout(() => setNoteSavedFeedback(false), 2600);
  };

  // 删除某条批注
  const handleDeleteAnnotation = id => {
    const nextList = annotations.filter(item => item.id !== id);
    try {
      localStorage.setItem('ink_podcast_annotations', JSON.stringify(nextList));
      setAnnotations(nextList);
      if (selectedNoteId === id) setSelectedNoteId(null);
    } catch {
      setStorageError('未能删除，请检查浏览器存储空间后重试。');
    }
  };

  // 复制单条笔记卡片（格式化为 Markdown）
  const handleCopyNote = note => {
    let md = '';
    if (note.quote) {
      md += `${note.quote.split('\n').map(line => `> ${line}`).join('\n')}\n\n`;
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

    let content = notesTab === 'current' ? `# 《${activeEpisode.fullTitle}》阅读批注合集\n\n` : '# 夜读笔记合集\n\n';
    notesToExport.forEach((n, idx) => {
      content += `### 批注 ${idx + 1} · #${n.episodeId} ${n.episodeTitle}（${n.createdAt}）\n\n`;
      if (n.quote) {
        content += `${n.quote.split('\n').map(line => `> ${line}`).join('\n')}\n\n`;
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


  const handleLocateNote = note => {
    const root = readerAreaRef.current;
    const range = rangeFromAnchor(root, resolveAnchor(root.textContent, note));
    if (!range) {
      setStorageError('这条笔记的原文暂未定位，笔记内容仍保留。');
      return;
    }
    closeMarginNote();
    setSelectedNoteId(note.id);
    setIsNotesPanelOpen(false);
    window.scrollBy({ top: range.getBoundingClientRect().top - 160, behavior: 'smooth' });
  };
  useLayoutEffect(() => {
    const root = readerAreaRef.current;
    const layout = transcriptLayoutRef.current;
    if (!root || !layout) return;
    let frame;
    const measure = () => {
      const origin = layout.getBoundingClientRect();
      const positions = currentEpisodeNotes.flatMap(note => {
        const range = rangeFromAnchor(root, resolveAnchor(root.textContent, note));
        if (!range) return [];
        const rects = Array.from(range.getClientRects()).filter(rect => rect.width > 0 && rect.height > 0);
        if (!rects.length) return [];
        return [{
          id: note.id,
          top: rects[0].top - origin.top,
          rects: rects.map(rect => ({ left: rect.left - origin.left, top: rect.top - origin.top, width: rect.width, height: rect.height })),
        }];
      }).sort((a, b) => a.top - b.top);
      let previous = -Infinity;
      positions.forEach(position => {
        position.markerTop = Math.max(position.top, previous + 26);
        previous = position.markerTop;
      });
      setNotePositions(positions);
      if (draftAnchor) {
        const range = rangeFromAnchor(root, draftAnchor);
        if (range) setDraftPosition((range.getClientRects()[0]?.top || origin.top) - origin.top);
      }

    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    window.addEventListener('resize', schedule);
    document.fonts?.addEventListener('loadingdone', schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      document.fonts?.removeEventListener('loadingdone', schedule);
    };
  }, [html, currentEpisodeNotes, fontSize, draftAnchor]);

  useEffect(() => {
    const hideSelectionButton = () => setFloatingBtn(prev => prev.visible ? { ...prev, visible: false } : prev);
    window.addEventListener('scroll', hideSelectionButton, { passive: true });
    window.addEventListener('resize', hideSelectionButton);
    const onSelectionChange = () => { if (window.getSelection()?.isCollapsed) hideSelectionButton(); };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      window.removeEventListener('scroll', hideSelectionButton);
      window.removeEventListener('resize', hideSelectionButton);
      document.removeEventListener('selectionchange', onSelectionChange);
    };
  }, []);

  const selectedNote = currentEpisodeNotes.find(note => note.id === selectedNoteId);
  const selectedPosition = notePositions.find(position => position.id === selectedNoteId);
  const renderNote = (note, inLibrary = false) => (
    <article className="podcast-note-card" key={note.id}>
      <div className="podcast-note-card-meta">
        {inLibrary && <span className="podcast-note-ep-tag">#{note.episodeId} {note.episodeTitle}</span>}
        <time className="podcast-note-time">{note.createdAt}</time>
      </div>
      {note.quote && <blockquote className="podcast-card-quote"><p className="podcast-card-quote-text">{note.quote}</p></blockquote>}
      {note.thought && <p className="podcast-card-thought-text">{note.thought}</p>}
      <div className="podcast-card-footer">
        {inLibrary && note.quote && note.episodeId === activeEpisode.id && <button type="button" className="podcast-card-act-btn" onClick={() => handleLocateNote(note)}>回到原文</button>}
        <button type="button" className="podcast-card-act-btn" onClick={() => handleCopyNote(note)}>
          {copiedNoteId === note.id ? <Check size={12} /> : <Copy size={12} />}<span>{copiedNoteId === note.id ? '已复制' : '复制'}</span>
        </button>
        <button type="button" className="podcast-card-act-btn delete" onClick={() => handleDeleteAnnotation(note.id)}><Trash2 size={12} /><span>删除</span></button>
      </div>
    </article>
  );

  return (
    <div className="podcast-annotated-reader">
      <div className="podcast-annotation-tools">
        <span>选中文字，可以留下划线或想法。</span>
        <button type="button" className="contrast-ctrl-btn" aria-haspopup="dialog" onClick={() => setIsNotesPanelOpen(true)}><PenLine size={13} />笔记 {currentEpisodeNotes.length ? `(${currentEpisodeNotes.length})` : ''}</button>
      </div>
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
        >
          <button type="button" className="podcast-float-btn-inner" onPointerDown={e => e.preventDefault()} onClick={handleApplySelectionToNote}>
            <Quote size={13} />
            <span>记一笔</span>
          </button>
        </div>
      )}
            <div className="podcast-transcript-layout" ref={transcriptLayoutRef}>
              <div
                ref={readerAreaRef}
                className={`podcast-transcript-body font-size-${fontSize}`}
                onMouseUp={handleTextSelection}
                onKeyUp={handleTextSelection}
                onTouchEnd={() => requestAnimationFrame(handleTextSelection)}
                onClick={event => {
                  if (!window.getSelection()?.isCollapsed) return;
                  const origin = transcriptLayoutRef.current.getBoundingClientRect();
                  const x = event.clientX - origin.left;
                  const y = event.clientY - origin.top;
                  const hit = notePositions.find(position => position.rects.some(rect => x >= rect.left && x <= rect.left + rect.width && y >= rect.top && y <= rect.top + rect.height));
                  if (hit) { closeMarginNote(); setSelectedNoteId(hit.id); }
                  else if (!draftAnchor) setSelectedNoteId(null);
                }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
              <div className="podcast-annotation-highlights" aria-hidden="true">
                {notePositions.flatMap(position => position.rects.map((rect, index) => (
                  <span key={`${position.id}-${index}`} className={`podcast-highlight-fragment ${position.id === selectedNoteId ? 'active' : ''}`} style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }} />
                )))}
              </div>
              <div className="podcast-margin-markers">
                {notePositions.map((position, index) => (
                  <button key={position.id} type="button" className={`podcast-margin-marker ${position.id === selectedNoteId ? 'active' : ''}`} style={{ top: position.markerTop }} aria-label={`查看第 ${index + 1} 条随文批注`} aria-expanded={position.id === selectedNoteId} onClick={() => { closeMarginNote(); setSelectedNoteId(position.id === selectedNoteId ? null : position.id); }}><PenLine size={13} /></button>
                ))}
              </div>
              {(draftAnchor || (selectedNote && selectedPosition)) && (
                <aside className="podcast-margin-note" role="dialog" aria-label={draftAnchor ? '写随文批注' : '随文批注'} style={{ top: draftAnchor ? draftPosition : selectedPosition.top }}>
                  <div className="podcast-composer-header">
                    <span className="podcast-composer-label"><PenLine size={13} />{draftAnchor ? '记一笔' : '随文批注'}</span>
                    <button type="button" className="podcast-ann-close-btn" aria-label="关闭随文批注" onClick={closeMarginNote}><X size={15} /></button>
                  </div>
                  {draftAnchor ? (
                    <form onSubmit={event => { event.preventDefault(); handleSaveAnnotation(); }}>
                      <blockquote className="podcast-card-quote"><p className="podcast-card-quote-text">{activeQuote}</p></blockquote>
                      <textarea ref={thoughtInputRef} aria-label="批注想法" className="podcast-thought-textarea" rows="3" placeholder="有什么想法？也可以只留下划线。" value={thoughtInput} onChange={event => setThoughtInput(event.target.value)} onKeyDown={event => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); handleSaveAnnotation(); } }} />
                      <div className="podcast-composer-footer">
                        <label className="podcast-sync-checkbox"><input type="checkbox" checked={syncToThoughts} onChange={event => setSyncToThoughts(event.target.checked)} /><span>同步到速记</span></label>
                        <button type="submit" className="podcast-btn-save-ann">保存</button>
                      </div>
                    </form>
                  ) : renderNote(selectedNote)}
                  {storageError && <p className="podcast-storage-error" role="alert">{storageError}</p>}
                </aside>
              )}
            </div>
      {isNotesPanelOpen && (
        <dialog className="podcast-notes-dialog" ref={notesPanelRef} aria-label="我的夜读笔记" onCancel={() => setIsNotesPanelOpen(false)} onClick={event => { if (event.target === event.currentTarget) setIsNotesPanelOpen(false); }}>
          <div className="podcast-annotations-header">
            <span className="podcast-ann-title">我的夜读笔记</span>
            <div className="podcast-ann-actions">
              <button type="button" className="podcast-ann-header-btn" onClick={handleExportEpisodeNotes} disabled={(notesTab === 'current' ? currentEpisodeNotes : annotations).length === 0}><Share2 size={13} /><span>{exportFeedback ? '已复制' : '导出 Markdown'}</span></button>
              <button type="button" className="podcast-ann-close-btn" aria-label="关闭笔记合集" onClick={() => setIsNotesPanelOpen(false)}><X size={16} /></button>
            </div>
          </div>
          <div className="podcast-ann-tabs">
            <button type="button" className={`podcast-ann-tab ${notesTab === 'current' ? 'active' : ''}`} onClick={() => setNotesTab('current')}>本篇 ({currentEpisodeNotes.length})</button>
            <button type="button" className={`podcast-ann-tab ${notesTab === 'all' ? 'active' : ''}`} onClick={() => setNotesTab('all')}>全部 ({annotations.length})</button>
          </div>
          {storageError && <p className="podcast-storage-error" role="alert">{storageError}</p>}
          <div className="podcast-annotations-stream">
            {(notesTab === 'current' ? currentEpisodeNotes : annotations).map(note => renderNote(note, true))}
            {(notesTab === 'current' ? currentEpisodeNotes : annotations).length === 0 && <p className="podcast-ann-empty-sub">还没有笔记。读到想留下的文字时，选中它，记一笔就好。</p>}
          </div>
        </dialog>
      )}
      {noteSavedFeedback && <div className="podcast-saved-status" role="status">已保存批注</div>}
    </div>
  );
}
