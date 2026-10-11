import React, { useState, useEffect, useRef } from "react";
import { cloudSync } from "../utils/cloudSync";
import { renderMarkdown } from "../utils/markdownParser";
import {
  Activity,
  MapPin,
  Clock,
  Plus,
  Send,
  Heart,
  PenLine,
  Trash2,
  Check,
  X,
  Bold,
  List,
  Quote,
  Lightbulb,
  Flame,
  ArrowRight
} from "lucide-react";
import initialFitness from "../content/fitness.json";

export default function FitnessStream({ isAuthor, onToggleAuthorMode }) {
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem("ink_user_fitness");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return initialFitness;
  });

  useEffect(() => {
    cloudSync.getFitnessNotes().then(remoteNotes => {
      if (Array.isArray(remoteNotes) && remoteNotes.length > 0) {
        setNotes(remoteNotes);
      }
    });
  }, []);

  // Modal Workspace States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [modalContent, setModalContent] = useState("");
  const [modalLocation, setModalLocation] = useState("");
  const textareaRef = useRef(null);

  const [likes, setLikes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ink_fitness_likes") || "{}");
    } catch {
      return {};
    }
  });

  const ensureAuthorMode = () => {
    if (isAuthor || localStorage.getItem("ink_author_mode") === "true") {
      return true;
    }
    const pass = prompt("请输入站长通行口令解锁运动记录（默认口令：gas）：");
    if (pass === "gas" || pass === "curry") {
      localStorage.setItem("ink_author_mode", "true");
      localStorage.setItem("ink_author_key", "gas");
      if (onToggleAuthorMode) onToggleAuthorMode(true);
      return true;
    } else if (pass !== null) {
      alert("口令不正确，仅站长可发布与编辑运动观察");
    }
    return false;
  };

  const handleOpenCreateModal = () => {
    if (!ensureAuthorMode()) return;
    setModalMode("create");
    setEditingNoteId(null);
    setModalContent("");
    setModalLocation("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = item => {
    if (!ensureAuthorMode()) return;
    setModalMode("edit");
    setEditingNoteId(item.id);
    setModalContent(item.content);
    setModalLocation(item.location || "");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNoteId(null);
    setModalContent("");
    setModalLocation("");
  };

  // Quick template insertions
  const handleInsertTemplate = type => {
    if (type === "observe-next") {
      const template = "## 观察\n- \n\n## 下一步\n- ";
      setModalContent(prev => (prev ? `${prev}\n\n${template}` : template));
    } else if (type === "body-feeling") {
      const template = "> **今日体感**：状态良好 · 呼吸顺畅\n- 心率/配速/负荷：\n- 肌肉与恢复感知：";
      setModalContent(prev => (prev ? `${prev}\n\n${template}` : template));
    } else if (type === "bold") {
      setModalContent(prev => (prev ? `${prev}**重点**` : "**重点**"));
    } else if (type === "list") {
      setModalContent(prev => (prev ? `${prev}\n- ` : "- "));
    } else if (type === "quote") {
      setModalContent(prev => (prev ? `${prev}\n> ` : "> "));
    }
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Keyboard shortcut listener: ESC to close, Cmd+Enter to submit
  useEffect(() => {
    const handleKeyDown = e => {
      if (!isModalOpen) return;
      if (e.key === "Escape") {
        handleCloseModal();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        handleSubmitModal(e);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, modalContent, modalLocation, modalMode, editingNoteId, notes]);

  const handleSubmitModal = e => {
    if (e && e.preventDefault) e.preventDefault();
    if (!modalContent.trim()) return;
    if (!ensureAuthorMode()) return;

    if (modalMode === "create") {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");

      const item = {
        id: `fit-${Date.now()}`,
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`,
        content: modalContent.trim(),
        location: modalLocation.trim() || "运动场",
      };

      const updated = [item, ...notes];
      setNotes(updated);
      localStorage.setItem("ink_user_fitness", JSON.stringify(updated));
      cloudSync.saveFitnessNote(item);
    } else if (modalMode === "edit" && editingNoteId) {
      let targetNote = null;
      const updated = notes.map(t => {
        if (t.id === editingNoteId) {
          targetNote = {
            ...t,
            content: modalContent.trim(),
            location: modalLocation.trim() || t.location,
          };
          return targetNote;
        }
        return t;
      });

      setNotes(updated);
      localStorage.setItem("ink_user_fitness", JSON.stringify(updated));
      if (targetNote) {
        cloudSync.updateFitnessNote(targetNote.id, {
          content: targetNote.content,
          location: targetNote.location,
        });
      }
    }

    handleCloseModal();
  };

  const handleDeleteNote = id => {
    if (!ensureAuthorMode()) return;
    if (confirm("确认删除这则运动记录吗？此操作无法撤销。")) {
      const updated = notes.filter(t => t.id !== id);
      setNotes(updated);
      localStorage.setItem("ink_user_fitness", JSON.stringify(updated));
      cloudSync.deleteFitnessNote(id);
    }
  };

  const handleToggleLike = id => {
    const updated = { ...likes, [id]: (likes[id] || 0) + 1 };
    setLikes(updated);
    localStorage.setItem("ink_fitness_likes", JSON.stringify(updated));
  };

  return (
    <section className="thoughts-container">
      <div className="section-intro">
        <div className="section-title-wrap">
          <span className="section-pretitle">MOVEMENT & OBSERVATIONS</span>
          <h1 className="section-title">运动 · 观察与下一步</h1>
        </div>
        <p className="section-desc">
          形式与速记相同。记录每天的身体观察、运动体感与下一步行动。在每一次发力、呼吸与节奏中，沉淀清晰的知行闭环。
        </p>

        {/* Action Button: Opens Large Workspace Modal */}
        <div style={{ marginTop: "1rem" }}>
          <button
            className="add-thought-toggle-btn"
            onClick={handleOpenCreateModal}
            title="起笔记录一则运动观察与下一步"
          >
            <Activity size={16} />
            <span>记下一则运动观察</span>
          </button>
        </div>
      </div>

      {/* Large Responsive Workspace Modal with Split-Pane Live Preview */}
      {isModalOpen && (
        <div className="thought-modal-backdrop" onClick={handleCloseModal}>
          <div
            className="thought-workspace-modal animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="thought-modal-header">
              <div className="modal-title-wrap">
                <span className="modal-badge">
                  {modalMode === "create" ? "运动工作台" : "编辑记录"}
                </span>
                <h3>
                  {modalMode === "create"
                    ? "起笔记录运动观察与下一步"
                    : "编辑与修改这则运动观察"}
                </h3>
              </div>
              <button
                className="close-modal-btn"
                onClick={handleCloseModal}
                aria-label="关闭窗口"
              >
                <X size={18} />
              </button>
            </div>

            {/* Markdown Quick Toolbar */}
            <div className="thought-workspace-toolbar">
              <div className="thought-toolbar-left">
                <button
                  type="button"
                  className="thought-tool-chip accent-chip"
                  onClick={() => handleInsertTemplate("observe-next")}
                  title="一键插入【观察与下一步】标准极简框架"
                >
                  <Lightbulb size={13} />
                  <span>+ 观察与下一步</span>
                </button>
                <button
                  type="button"
                  className="thought-tool-chip"
                  onClick={() => handleInsertTemplate("body-feeling")}
                  title="插入【今日体感】速记模板"
                >
                  <Flame size={13} />
                  <span>+ 今日体感</span>
                </button>
                <button
                  type="button"
                  className="thought-tool-chip"
                  onClick={() => handleInsertTemplate("bold")}
                  title="插入加粗语法"
                >
                  <Bold size={13} />
                  <span>加粗</span>
                </button>
                <button
                  type="button"
                  className="thought-tool-chip"
                  onClick={() => handleInsertTemplate("list")}
                  title="插入列表项"
                >
                  <List size={13} />
                  <span>列表</span>
                </button>
                <button
                  type="button"
                  className="thought-tool-chip"
                  onClick={() => handleInsertTemplate("quote")}
                  title="插入引用块"
                >
                  <Quote size={13} />
                  <span>引用</span>
                </button>
              </div>

              <div className="thought-toolbar-right">
                <span className="thought-shortcut-hint">
                  快捷键：<code>⌘ + Enter</code> 保存 · <code>ESC</code> 退出
                </span>
              </div>
            </div>

            {/* Split Screen Dual-Pane Body */}
            <div className="thought-workspace-body">
              {/* Left Pane: Markdown Source Editor */}
              <div className="thought-pane thought-editor-pane">
                <div className="pane-header">
                  <span className="pane-title">Markdown 写作区</span>
                  <span className="pane-desc">支持观察与下一步、列表、加粗与引用</span>
                </div>
                <textarea
                  ref={textareaRef}
                  className="thought-workspace-textarea"
                  placeholder="写下今天的运动感受、身体观察与下一步打算...

推荐点击上方 [+ 观察与下一步] 快捷插入极简框架：
## 观察
- 

## 下一步
- "
                  value={modalContent}
                  onChange={e => setModalContent(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Right Pane: Real-Time Rendered Preview */}
              <div className="thought-pane thought-preview-pane">
                <div className="pane-header">
                  <span className="pane-title">实时卡片效果</span>
                  <span className="pane-desc">所见即所得 · 真实渲染呈现</span>
                </div>
                <div className="thought-preview-card-wrap">
                  <div className="thought-card preview-simulated-card">
                    <div className="thought-header">
                      <span className="thought-meta">
                        <Clock size={12} />
                        <span>刚刚 (实时)</span>
                      </span>
                      <span className="thought-location">
                        <Activity size={11} />
                        <span>{modalLocation.trim() || "运动场"}</span>
                      </span>
                    </div>

                    <div
                      className="thought-content thought-markdown-body"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(
                          modalContent.trim() ||
                            "*（在左侧键入 Markdown 内容，此处将秒级同步实时呈现真实卡片排版...）*"
                        ),
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="thought-workspace-footer">
              <div className="footer-location-wrap">
                <Activity size={15} className="location-icon" />
                <input
                  type="text"
                  placeholder="记录项目或地点（例如：晨跑 5km · 跑道、核心训练、拉伸与滚轴）"
                  value={modalLocation}
                  onChange={e => setModalLocation(e.target.value)}
                  className="workspace-location-input"
                />
              </div>

              <div className="footer-btn-group">
                <button
                  type="button"
                  className="btn-cancel-workspace"
                  onClick={handleCloseModal}
                >
                  <X size={14} />
                  <span>取消</span>
                </button>
                <button
                  type="button"
                  className="btn-submit-workspace"
                  onClick={handleSubmitModal}
                >
                  {modalMode === "create" ? (
                    <>
                      <Send size={14} />
                      <span>立即发布记录</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>保存修改</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fitness Feed List */}
      <div className="thoughts-timeline">
        {notes.length === 0 ? (
          <div
            className="empty-thoughts-box"
            style={{
              padding: "3.5rem 1.5rem",
              textAlign: "center",
              background: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px dashed var(--border-medium)",
            }}
          >
            <Activity
              size={28}
              style={{
                color: "var(--accent-primary)",
                marginBottom: "0.75rem",
                opacity: 0.8,
              }}
            />
            <h3 style={{ fontSize: "1.2rem", marginBottom: "0.45rem" }}>
              暂无运动观察记录
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.95rem",
                maxWidth: "38ch",
                margin: "0 auto 1.5rem",
                lineHeight: 1.6,
              }}
            >
              身体的每一次发力与呼吸都值得被看见。点击上方“记下一则运动观察”，捕捉你的第一条“观察与下一步”。
            </p>
            <button className="submit-thought-btn" onClick={handleOpenCreateModal}>
              <Plus size={14} /> <span>立即起笔记录</span>
            </button>
          </div>
        ) : (
          notes.map((item, index) => (
            <article
              key={item.id}
              className="thought-card animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="thought-header">
                <span className="thought-meta">
                  <Clock size={12} />
                  <span>
                    {item.date} {item.time}
                  </span>
                </span>
                {item.location && (
                  <span className="thought-location">
                    <Activity size={11} />
                    <span>{item.location}</span>
                  </span>
                )}
              </div>

              {/* Display Mode */}
              <div
                className="thought-content thought-markdown-body"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(item.content || ""),
                }}
              />

              <div className="thought-footer">
                <button
                  className={`like-chip-btn ${(likes[item.id] || 0) > 0 ? "liked" : ""}`}
                  onClick={() => handleToggleLike(item.id)}
                  aria-label="点赞记录"
                >
                  <Heart
                    size={13}
                    fill={(likes[item.id] || 0) > 0 ? "currentColor" : "none"}
                  />
                  <span>
                    {(likes[item.id] || 0) > 0 ? likes[item.id] : "心动"}
                  </span>
                </button>

                <div className="thought-manage-actions">
                  <button
                    className="thought-action-btn edit-btn"
                    onClick={() => handleOpenEditModal(item)}
                    title="在工作台全景编辑修改此条记录"
                  >
                    <PenLine size={13} />
                    <span>编辑</span>
                  </button>
                  <button
                    className="thought-action-btn delete-btn"
                    onClick={() => handleDeleteNote(item.id)}
                    title="删除此条记录"
                  >
                    <Trash2 size={13} />
                    <span>删除</span>
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
