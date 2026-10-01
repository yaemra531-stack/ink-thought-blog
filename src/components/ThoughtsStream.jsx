import React, { useState, useEffect, useRef } from "react";
import { cloudSync } from "../utils/cloudSync";
import { renderMarkdown } from "../utils/markdownParser";
import {
  Sparkles,
  MapPin,
  Clock,
  Plus,
  Send,
  Heart,
  PenLine,
  Trash2,
  Check,
  X,
  Lock,
  Eye,
  Bold,
  List,
  Quote,
  Lightbulb,
  Maximize2,
  Minimize2
} from "lucide-react";
import initialThoughts from "../content/thoughts.json";

export default function ThoughtsStream({ isAuthor, onToggleAuthorMode }) {
  const [thoughts, setThoughts] = useState(() => {
    try {
      const saved = localStorage.getItem("ink_user_thoughts");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return initialThoughts;
  });

  useEffect(() => {
    cloudSync.getThoughts().then(remoteThoughts => {
      if (Array.isArray(remoteThoughts) && remoteThoughts.length > 0) {
        setThoughts(remoteThoughts);
      }
    });
  }, []);

  // Modal Workspace States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [editingThoughtId, setEditingThoughtId] = useState(null);
  const [modalContent, setModalContent] = useState("");
  const [modalLocation, setModalLocation] = useState("");
  const textareaRef = useRef(null);

  const [likes, setLikes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ink_thought_likes") || "{}");
    } catch {
      return {};
    }
  });

  const ensureAuthorMode = () => {
    if (isAuthor || localStorage.getItem("ink_author_mode") === "true") {
      return true;
    }
    const pass = prompt("请输入站长通行口令解锁速记创作（默认口令：gas）：");
    if (pass === "gas" || pass === "curry") {
      localStorage.setItem("ink_author_mode", "true");
      localStorage.setItem("ink_author_key", "gas");
      if (onToggleAuthorMode) onToggleAuthorMode(true);
      return true;
    } else if (pass !== null) {
      alert("口令不正确，仅站长可发布与编辑速记");
    }
    return false;
  };

  const handleOpenCreateModal = () => {
    if (!ensureAuthorMode()) return;
    setModalMode("create");
    setEditingThoughtId(null);
    setModalContent("");
    setModalLocation("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = item => {
    if (!ensureAuthorMode()) return;
    setModalMode("edit");
    setEditingThoughtId(item.id);
    setModalContent(item.content);
    setModalLocation(item.location || "");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingThoughtId(null);
    setModalContent("");
    setModalLocation("");
  };

  // Quick template insertions
  const handleInsertTemplate = type => {
    if (type === "cognition-action") {
      const template = "## 认知\n\n\n## 做法\n- ";
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
  }, [isModalOpen, modalContent, modalLocation, modalMode, editingThoughtId, thoughts]);

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
        id: `t-${Date.now()}`,
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`,
        content: modalContent.trim(),
        location: modalLocation.trim() || "书房",
      };

      const updated = [item, ...thoughts];
      setThoughts(updated);
      localStorage.setItem("ink_user_thoughts", JSON.stringify(updated));
      cloudSync.saveThought(item);
    } else if (modalMode === "edit" && editingThoughtId) {
      let targetThought = null;
      const updated = thoughts.map(t => {
        if (t.id === editingThoughtId) {
          targetThought = {
            ...t,
            content: modalContent.trim(),
            location: modalLocation.trim() || t.location,
          };
          return targetThought;
        }
        return t;
      });

      setThoughts(updated);
      localStorage.setItem("ink_user_thoughts", JSON.stringify(updated));
      if (targetThought) {
        cloudSync.updateThought(targetThought.id, {
          content: targetThought.content,
          location: targetThought.location,
        });
      }
    }

    handleCloseModal();
  };

  const handleDeleteThought = id => {
    if (!ensureAuthorMode()) return;
    if (confirm("确认删除这则速记吗？此操作无法撤销。")) {
      const updated = thoughts.filter(t => t.id !== id);
      setThoughts(updated);
      localStorage.setItem("ink_user_thoughts", JSON.stringify(updated));
      cloudSync.deleteThought(id);
    }
  };

  const handleToggleLike = id => {
    const updated = { ...likes, [id]: (likes[id] || 0) + 1 };
    setLikes(updated);
    localStorage.setItem("ink_thought_likes", JSON.stringify(updated));
    cloudSync.incrementLike(id);
  };

  return (
    <section className="thoughts-container">
      <div className="section-intro">
        <div className="section-title-wrap">
          <span className="section-pretitle">B-SIDES & VIGNETTES</span>
          <h1 className="section-title">灵感速记与碎片</h1>
        </div>
        <p className="section-desc">
          无需长篇大论。闪念的电光火石、偶遇的字句、认知与做法的顿悟，皆是生活的微型诗。全景双栏实时预览，随时记录、编辑与云端实时保存。
        </p>

        {/* Action Button: Opens Large Workspace Modal */}
        <div style={{ marginTop: "1rem" }}>
          <button
            className="add-thought-toggle-btn"
            onClick={handleOpenCreateModal}
            title="起笔记录一则新速记"
          >
            <Plus size={16} />
            <span>记下一则灵感</span>
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
                  {modalMode === "create" ? "速记工作台" : "编辑速记"}
                </span>
                <h3>
                  {modalMode === "create"
                    ? "起笔记录一则灵感"
                    : "编辑与修改这则速记"}
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
                  onClick={() => handleInsertTemplate("cognition-action")}
                  title="一键插入【认知与做法】标准极简结构"
                >
                  <Lightbulb size={13} />
                  <span>+ 认知与做法</span>
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
                  title="插入金句引用"
                >
                  <Quote size={13} />
                  <span>金句</span>
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
                  <span className="pane-desc">支持标题、列表、加粗、引用与换行</span>
                </div>
                <textarea
                  ref={textareaRef}
                  className="thought-workspace-textarea"
                  placeholder="记下此时此刻的思考、认知与做法、好句子...

推荐点击上方 [+ 认知与做法] 快捷填入极简闭环。"
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
                        <MapPin size={11} />
                        <span>{modalLocation.trim() || "书房"}</span>
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
                <MapPin size={15} className="location-icon" />
                <input
                  type="text"
                  placeholder="记录地点或心境（例如：午后阳台、雅思备考 · 阅读）"
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
                      <span>立即发布速记</span>
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

      {/* Thoughts Feed List */}
      <div className="thoughts-timeline">
        {thoughts.length === 0 ? (
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
            <Sparkles
              size={28}
              style={{
                color: "var(--accent-primary)",
                marginBottom: "0.75rem",
                opacity: 0.8,
              }}
            />
            <h3 style={{ fontSize: "1.2rem", marginBottom: "0.45rem" }}>
              暂无速记碎片
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
              生活里的顿悟与灵感转瞬即逝。点击上方“记下一则灵感”，捕捉你的第一条思考记录。
            </p>
            <button className="submit-thought-btn" onClick={handleOpenCreateModal}>
              <Plus size={14} /> <span>立即起笔记录</span>
            </button>
          </div>
        ) : (
          thoughts.map((item, index) => (
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
                    <MapPin size={11} />
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
                  aria-label="点赞速记"
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
                    title="在工作台全景编辑修改此条速记"
                  >
                    <PenLine size={13} />
                    <span>编辑</span>
                  </button>
                  <button
                    className="thought-action-btn delete-btn"
                    onClick={() => handleDeleteThought(item.id)}
                    title="删除此条速记"
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
