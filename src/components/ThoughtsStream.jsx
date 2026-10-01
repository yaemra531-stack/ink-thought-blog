import React, { useState, useEffect } from "react";
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
  Lightbulb
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

  const [newThought, setNewThought] = useState("");
  const [location, setLocation] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [isEditPreviewMode, setIsEditPreviewMode] = useState(false);

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

  const handleToggleInput = () => {
    if (!showInput) {
      if (ensureAuthorMode()) {
        setShowInput(true);
      }
    } else {
      setShowInput(false);
    }
  };

  const handleInsertTemplate = type => {
    if (type === "cognition-action") {
      const template = "## 认知\n\n\n## 做法\n- ";
      setNewThought(prev => (prev ? `${prev}\n\n${template}` : template));
    } else if (type === "bold") {
      setNewThought(prev => `${prev}**重点**`);
    } else if (type === "list") {
      setNewThought(prev => (prev ? `${prev}\n- ` : "- "));
    } else if (type === "quote") {
      setNewThought(prev => (prev ? `${prev}\n> ` : "> "));
    }
    setIsPreviewMode(false);
  };

  const handleInsertEditTemplate = type => {
    if (type === "cognition-action") {
      const template = "## 认知\n\n\n## 做法\n- ";
      setEditContent(prev => (prev ? `${prev}\n\n${template}` : template));
    } else if (type === "bold") {
      setEditContent(prev => `${prev}**重点**`);
    } else if (type === "list") {
      setEditContent(prev => (prev ? `${prev}\n- ` : "- "));
    } else if (type === "quote") {
      setEditContent(prev => (prev ? `${prev}\n> ` : "> "));
    }
    setIsEditPreviewMode(false);
  };

  const handleAddThought = e => {
    e.preventDefault();
    if (!newThought.trim()) return;

    if (!ensureAuthorMode()) return;

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
      content: newThought.trim(),
      location: location.trim() || "书房",
    };

    const updated = [item, ...thoughts];
    setThoughts(updated);
    localStorage.setItem("ink_user_thoughts", JSON.stringify(updated));
    cloudSync.saveThought(item);

    setNewThought("");
    setLocation("");
    setIsPreviewMode(false);
    setShowInput(false);
  };

  const handleStartEdit = item => {
    if (!ensureAuthorMode()) return;
    setEditingId(item.id);
    setEditContent(item.content);
    setEditLocation(item.location || "");
    setIsEditPreviewMode(false);
  };

  const handleSaveEdit = e => {
    e.preventDefault();
    if (!editContent.trim()) return;

    let targetThought = null;
    const updated = thoughts.map(t => {
      if (t.id === editingId) {
        targetThought = {
          ...t,
          content: editContent.trim(),
          location: editLocation.trim() || t.location,
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
    setEditingId(null);
    setIsEditPreviewMode(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
    setEditLocation("");
    setIsEditPreviewMode(false);
  };

  const handleDeleteThought = id => {
    if (!ensureAuthorMode()) return;
    if (confirm("确认删除这则速记吗？此操作无法撤销。")) {
      const updated = thoughts.filter(t => t.id !== id);
      setThoughts(updated);
      localStorage.setItem("ink_user_thoughts", JSON.stringify(updated));
      cloudSync.deleteThought(id);
      if (editingId === id) setEditingId(null);
    }
  };

  const handleToggleLike = id => {
    const updated = { ...likes, [id]: (likes[id] || 0) + 1 };
    setLikes(updated);
    localStorage.setItem("ink_thought_likes", JSON.stringify(updated));
    cloudSync.incrementLike(id);
  };

  const isActuallyAuthor =
    isAuthor ||
    (typeof window !== "undefined" &&
      localStorage.getItem("ink_author_mode") === "true");

  return (
    <section className="thoughts-container">
      <div className="section-intro">
        <div className="section-title-wrap">
          <span className="section-pretitle">B-SIDES & VIGNETTES</span>
          <h1 className="section-title">灵感速记与碎片</h1>
        </div>
        <p className="section-desc">
          无需长篇大论。闪念的电光火石、偶遇的字句、认知与做法的顿悟，皆是生活的微型诗。支持 Markdown 排版，随时可记录、编辑与云端实时保存。
        </p>

        {/* Action Button: Always Visible & Direct */}
        <div style={{ marginTop: "1rem" }}>
          <button
            className="add-thought-toggle-btn"
            onClick={handleToggleInput}
            title={showInput ? "收起编辑器" : "起笔记录一则新速记"}
          >
            <Plus size={16} />
            <span>{showInput ? "收起速记框" : "记下一则灵感"}</span>
          </button>
        </div>
      </div>

      {showInput && (
        <form className="new-thought-form animate-fade-in" onSubmit={handleAddThought}>
          {/* Markdown Quick Toolbar */}
          <div className="thought-editor-toolbar">
            <div className="thought-toolbar-left">
              <button
                type="button"
                className="thought-tool-chip accent-chip"
                onClick={() => handleInsertTemplate("cognition-action")}
                title="一键插入【认知与做法】极简结构"
              >
                <Lightbulb size={13} />
                <span>+ 认知与做法</span>
              </button>
              <button
                type="button"
                className="thought-tool-chip"
                onClick={() => handleInsertTemplate("bold")}
                title="插入加粗"
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
              <button
                type="button"
                className={`thought-mode-tab ${!isPreviewMode ? "active" : ""}`}
                onClick={() => setIsPreviewMode(false)}
              >
                <PenLine size={12} />
                <span>编辑</span>
              </button>
              <button
                type="button"
                className={`thought-mode-tab ${isPreviewMode ? "active" : ""}`}
                onClick={() => setIsPreviewMode(true)}
              >
                <Eye size={12} />
                <span>预览</span>
              </button>
            </div>
          </div>

          {isPreviewMode ? (
            <div
              className="thought-preview-box thought-markdown-body"
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(
                  newThought.trim() || "*（输入内容后在此实时预览 Markdown 排版效果）*"
                ),
              }}
            />
          ) : (
            <textarea
              placeholder="记下此时此刻的思考、认知与做法、好句子（支持 Markdown 排版）..."
              value={newThought}
              onChange={e => setNewThought(e.target.value)}
              rows={5}
              required
              autoFocus
            />
          )}

          <div className="form-actions">
            <input
              type="text"
              placeholder="地点或心境（例如：午后阳台、写作研读 · 第一性原理）"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="location-input"
            />
            <button type="submit" className="submit-thought-btn">
              <Send size={14} />
              <span>立即发布速记</span>
            </button>
          </div>
        </form>
      )}

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
            <button className="submit-thought-btn" onClick={handleToggleInput}>
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

              {editingId === item.id ? (
                /* Inline Edit Mode */
                <form
                  className="inline-edit-thought-form animate-fade-in"
                  onSubmit={handleSaveEdit}
                >
                  <div className="thought-editor-toolbar inline-toolbar">
                    <div className="thought-toolbar-left">
                      <button
                        type="button"
                        className="thought-tool-chip accent-chip"
                        onClick={() => handleInsertEditTemplate("cognition-action")}
                        title="一键插入【认知与做法】"
                      >
                        <Lightbulb size={12} />
                        <span>+ 认知与做法</span>
                      </button>
                      <button
                        type="button"
                        className="thought-tool-chip"
                        onClick={() => handleInsertEditTemplate("bold")}
                      >
                        <Bold size={12} />
                        <span>加粗</span>
                      </button>
                      <button
                        type="button"
                        className="thought-tool-chip"
                        onClick={() => handleInsertEditTemplate("list")}
                      >
                        <List size={12} />
                        <span>列表</span>
                      </button>
                      <button
                        type="button"
                        className="thought-tool-chip"
                        onClick={() => handleInsertEditTemplate("quote")}
                      >
                        <Quote size={12} />
                        <span>金句</span>
                      </button>
                    </div>
                    <div className="thought-toolbar-right">
                      <button
                        type="button"
                        className={`thought-mode-tab ${!isEditPreviewMode ? "active" : ""}`}
                        onClick={() => setIsEditPreviewMode(false)}
                      >
                        <PenLine size={11} />
                        <span>编辑</span>
                      </button>
                      <button
                        type="button"
                        className={`thought-mode-tab ${isEditPreviewMode ? "active" : ""}`}
                        onClick={() => setIsEditPreviewMode(true)}
                      >
                        <Eye size={11} />
                        <span>预览</span>
                      </button>
                    </div>
                  </div>

                  {isEditPreviewMode ? (
                    <div
                      className="thought-preview-box thought-markdown-body"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(
                          editContent.trim() || "*（暂无内容）*"
                        ),
                      }}
                    />
                  ) : (
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      rows={5}
                      className="challenge-textarea"
                      required
                      autoFocus
                    />
                  )}

                  <div className="inline-edit-actions">
                    <input
                      type="text"
                      placeholder="地点或心境"
                      value={editLocation}
                      onChange={e => setEditLocation(e.target.value)}
                      className="location-input small-loc-input"
                    />
                    <div className="btn-group-right">
                      <button
                        type="button"
                        className="btn-cancel-edit"
                        onClick={handleCancelEdit}
                      >
                        <X size={13} />
                        <span>取消</span>
                      </button>
                      <button type="submit" className="btn-save-edit">
                        <Check size={13} />
                        <span>保存修改</span>
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                /* Display Mode */
                <>
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
                        onClick={() => handleStartEdit(item)}
                        title="编辑修改此条速记"
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
                </>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
