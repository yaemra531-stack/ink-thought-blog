import React, { useState, useEffect } from "react";
import WritingReferenceCard from "./WritingReferenceCard";
import PostCard from "./PostCard";
import { cloudSync } from "../utils/cloudSync";
import { BookMarked, Sparkles, FolderDown, Award, Plus, Send, Clock, MapPin, Feather, Heart } from "lucide-react";

export default function ReferenceSection({ posts, onSelectPost, onOpenNewPost, isAuthor, onToggleAuthorMode }) {
  const [selectedAuthor, setSelectedAuthor] = useState("all"); // "all" | "Paul Graham" | "Tim Urban" | "瓦斯"
  const [showQuickNote, setShowQuickNote] = useState(false);
  const [quickContent, setQuickContent] = useState("");
  const [quickLocation, setQuickLocation] = useState("写作研读 · 第一性原理");
  const [recentRefThoughts, setRecentRefThoughts] = useState([]);

  // Load thoughts related to reference / writing study
  const loadRefThoughts = () => {
    try {
      const saved = localStorage.getItem("ink_user_thoughts");
      const list = saved ? JSON.parse(saved) : [];
      const refList = list.filter(t => 
        (t.location && (t.location.includes("研读") || t.location.includes("参考") || t.location.includes("心法") || t.location.includes("第一性原理"))) ||
        (t.content && (t.content.includes("第一性原理") || t.content.includes("选拔标准") || t.content.includes("写作")))
      );
      setRecentRefThoughts(refList.slice(0, 5));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadRefThoughts();
  }, []);

  const ensureAuthorMode = () => {
    if (isAuthor || (typeof window !== "undefined" && localStorage.getItem("ink_author_mode") === "true")) {
      return true;
    }
    const pass = prompt("请输入站长通行口令解锁研读记录（默认口令：gas）：");
    if (pass === "gas" || pass === "curry") {
      localStorage.setItem("ink_author_mode", "true");
      localStorage.setItem("ink_author_key", "gas");
      if (onToggleAuthorMode) onToggleAuthorMode(true);
      return true;
    } else if (pass !== null) {
      alert("口令不正确，仅站长可提交记录");
    }
    return false;
  };

  const handleOpenWriter = () => {
    if (ensureAuthorMode()) {
      if (onOpenNewPost) {
        onOpenNewPost({
          tags: "经典研读, 写作参考",
          title: "写作与受众第一性原理研读",
          author: "瓦斯",
        });
      }
    }
  };

  const handleToggleQuickNote = () => {
    if (!showQuickNote) {
      if (ensureAuthorMode()) setShowQuickNote(true);
    } else {
      setShowQuickNote(false);
    }
  };

  const handleSaveQuickNote = async e => {
    e.preventDefault();
    if (!quickContent.trim()) return;
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
      content: quickContent.trim(),
      location: quickLocation.trim() || "写作研读 · 顿悟",
    };

    try {
      const saved = JSON.parse(localStorage.getItem("ink_user_thoughts") || "[]");
      const updated = [item, ...saved];
      localStorage.setItem("ink_user_thoughts", JSON.stringify(updated));
      await cloudSync.saveThought(item);
      loadRefThoughts();
      setQuickContent("");
      setShowQuickNote(false);
    } catch (err) {
      console.error("Failed saving quick reference thought", err);
    }
  };

  // Filter only reference posts (slug starting with "ref-" or tag "经典研读" / "写作参考" / "第一性原理")
  const referencePosts = posts.filter(
    p => p.slug.startsWith("ref-") || (p.tags && (p.tags.includes("经典研读") || p.tags.includes("写作参考") || p.tags.includes("第一性原理")))
  );

  const filteredPosts = referencePosts.filter(p => {
    if (selectedAuthor === "all") return true;
    return (p.author || "").toLowerCase().includes(selectedAuthor.toLowerCase());
  });

  const vasiCount = referencePosts.filter(p => (p.author || "").includes("瓦斯")).length;

  return (
    <section className="reference-page animate-fade-in">
      {/* Intro Header */}
      <div className="section-intro">
        <div className="section-title-wrap">
          <span className="section-pretitle">CANON & MASTERY</span>
          <h1 className="section-title">参考与经典研读</h1>
        </div>
        <p className="section-desc">
          好文章是一面明镜。向 <strong>Tim Urban</strong> 学习将抽象命题具象化与拟人化的场景构筑力；向 <strong>Paul Graham</strong> 学习删繁就简、像说话一样写作的思辨穿透力；践行 <strong>瓦斯</strong> 第一性原理——真实感、代入感与活人感。
        </p>

        {/* Action Buttons to Record and Author Reference Materials */}
        <div style={{ display: "flex", gap: "0.85rem", marginTop: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
          <button
            className="submit-thought-btn"
            onClick={handleOpenWriter}
            title="撰写一篇新的研读长文并导出 Markdown"
            style={{ padding: "0.55rem 1.1rem", fontSize: "0.9rem" }}
          >
            <Plus size={15} />
            <span>记录研读长文 (Markdown)</span>
          </button>

          <button
            className="add-thought-toggle-btn"
            onClick={handleToggleQuickNote}
            title="快速记录一条研读摘录或灵感心法"
            style={{ padding: "0.55rem 1rem", fontSize: "0.9rem" }}
          >
            <Sparkles size={14} />
            <span>{showQuickNote ? "收起研读速记" : "记一则研读摘录 / 心得"}</span>
          </button>
        </div>

        {/* Quick Reference Note Box */}
        {showQuickNote && (
          <form className="new-thought-form animate-fade-in" onSubmit={handleSaveQuickNote} style={{ marginTop: "1.25rem" }}>
            <textarea
              placeholder="摘录经典篇目的精彩句子、记录对第一性原理与写作策略的最新顿悟..."
              value={quickContent}
              onChange={e => setQuickContent(e.target.value)}
              rows={4}
              required
              autoFocus
            />
            <div className="form-actions">
              <input
                type="text"
                placeholder="来源或归类（例如：经典研读 · 第一性原理、Tim Urban 摘录）"
                value={quickLocation}
                onChange={e => setQuickLocation(e.target.value)}
                className="location-input"
              />
              <button type="submit" className="submit-thought-btn">
                <Send size={14} />
                <span>存入研读与速记</span>
              </button>
            </div>
          </form>
        )}

        {/* Filter Tabs */}
        <div className="ref-filter-row" style={{ marginTop: "1.75rem" }}>
          <button
            className={`filter-pill ${selectedAuthor === "all" ? "active" : ""}`}
            onClick={() => setSelectedAuthor("all")}
          >
            全部研读篇目 ({referencePosts.length})
          </button>
          <button
            className={`filter-pill ${selectedAuthor === "Paul Graham" ? "active" : ""}`}
            onClick={() => setSelectedAuthor("Paul Graham")}
          >
            Paul Graham 随笔 (2 篇)
          </button>
          <button
            className={`filter-pill ${selectedAuthor === "Tim Urban" ? "active" : ""}`}
            onClick={() => setSelectedAuthor("Tim Urban")}
          >
            Tim Urban 深度长文 (3 篇)
          </button>
          {vasiCount > 0 && (
            <button
              className={`filter-pill ${selectedAuthor === "瓦斯" ? "active" : ""}`}
              onClick={() => setSelectedAuthor("瓦斯")}
            >
              瓦斯 · 第一性原理 ({vasiCount} 篇)
            </button>
          )}
        </div>
      </div>

      {/* Embedded Top Reference Methodology Card */}
      <WritingReferenceCard />

      {/* Recent Reference Insights (Quick Notes) */}
      {recentRefThoughts.length > 0 && (
        <div style={{ marginTop: "2.5rem", marginBottom: "2rem" }}>
          <div className="ref-section-heading" style={{ marginBottom: "1rem" }}>
            <Feather size={17} className="award-icon" />
            <h3 style={{ fontSize: "1.1rem" }}>最新研读心法与速记摘录</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {recentRefThoughts.map(t => (
              <div
                key={t.id}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-md)",
                  padding: "1rem 1.25rem",
                  boxShadow: "var(--shadow-sm)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <p style={{ fontSize: "0.92rem", lineHeight: 1.6, whiteSpace: "pre-line", margin: "0 0 0.75rem 0", color: "var(--text-primary)" }}>
                  {t.content}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                    <Clock size={11} /> {t.date}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", background: "var(--bg-secondary)", padding: "0.15rem 0.5rem", borderRadius: "10px" }}>
                    <MapPin size={10} /> {t.location}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Translated Masterworks Grid */}
      <div className="ref-posts-section">
        <div className="ref-section-heading">
          <Award size={18} className="award-icon" />
          <h2>代表作中文精译与心法文库</h2>
        </div>

        <div className="posts-grid">
          {filteredPosts.map((post, idx) => (
            <div
              key={post.slug}
              className="animate-fade-in"
              style={{ animationDelay: `${idx * 0.08}s` }}
            >
              <PostCard
                post={post}
                onSelectPost={onSelectPost}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Downloaded Offline Kit Reminder */}
      <div className="local-md-banner" style={{ marginTop: "3.5rem" }}>
        <FolderDown size={24} className="banner-icon" />
        <div className="banner-text">
          <h4>离线研读包已归档至本地</h4>
          <p>
            上述代表作的完整中英文对照原稿与写作方法论，已自动保存在你的电脑目录：
            <br />
            <code>~/Downloads/博客研读代表作/</code>
          </p>
        </div>
      </div>
    </section>
  );
}
