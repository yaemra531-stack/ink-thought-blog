import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PostCard from './components/PostCard';
import ArticleDetail from './components/ArticleDetail';
import ThoughtsStream from './components/ThoughtsStream';
import AboutSection from './components/AboutSection';
import ReferenceSection from './components/ReferenceSection';
import SearchModal from './components/SearchModal';
import NewPostModal from './components/NewPostModal';
import ReadingPreferences from './components/ReadingPreferences';
import ReadingProgress from './components/ReadingProgress';
import WritingReferenceCard from './components/WritingReferenceCard';
import { getLocalPosts, getAllTags } from './utils/postsLoader';
import { Sparkles, Filter } from 'lucide-react';
import './App.css';

export default function App() {
  const [posts, setPosts] = useState(() => getLocalPosts());
  const [selectedPost, setSelectedPost] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const paramTab = new URLSearchParams(window.location.search).get("tab");
      if (paramTab && ["posts", "thoughts", "reference", "about"].includes(paramTab)) {
        return paramTab;
      }
    } catch {}
    return "posts";
  }); // 'posts' | 'thoughts' | 'reference' | 'about'
  const [selectedTag, setSelectedTag] = useState(null);
  const [isAuthor, setIsAuthor] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        if (hostname === "localhost" || hostname === "127.0.0.1") {
          return true; // 本地开发默认解锁站长创作模式
        }
        const urlParams = new URLSearchParams(window.location.search);
        const authorParam = urlParams.get("author") || urlParams.get("admin");
        if (authorParam && ["gas", "curry", "true"].includes(authorParam.toLowerCase())) {
          localStorage.setItem("ink_author_mode", "true");
          localStorage.setItem("ink_author_key", "gas");
          return true;
        }
        return localStorage.getItem("ink_author_mode") === "true";
      }
    } catch {
      return false;
    }
    return false;
  });

  const handleToggleAuthorMode = (explicitVal) => {
    const nextState = typeof explicitVal === "boolean" ? explicitVal : !isAuthor;
    setIsAuthor(nextState);
    if (nextState) {
      localStorage.setItem("ink_author_mode", "true");
      localStorage.setItem("ink_author_key", "gas");
    } else {
      localStorage.removeItem("ink_author_mode");
    }
  };


  // Modals & Panels
  const [searchOpen, setSearchOpen] = useState(false);
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [editingPostForModal, setEditingPostForModal] = useState(null);
  const [newPostInitialData, setNewPostInitialData] = useState(null);
  const [prefsOpen, setPrefsOpen] = useState(false);

  const handleOpenNewPost = (initialData = null) => {
    setEditingPostForModal(null);
    setNewPostInitialData(initialData);
    setNewPostOpen(true);
  };

  // Reading Preferences State (persisted in localStorage)
  const [theme, setTheme] = useState(() => localStorage.getItem('ink_theme') || 'light');
  const [fontPref, setFontPref] = useState(() => localStorage.getItem('ink_font_pref') || 'serif');
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('ink_font_size') || 'medium');
  const [isZenMode, setIsZenMode] = useState(false);

  // Sync theme to root DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ink_theme', theme);
  }, [theme]);

  // Sync font preference
  useEffect(() => {
    document.documentElement.setAttribute('data-font-pref', fontPref);
    localStorage.setItem('ink_font_pref', fontPref);
  }, [fontPref]);

  // Sync font size
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
    localStorage.setItem('ink_font_size', fontSize);
  }, [fontSize]);

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const allTags = getAllTags(posts);

  // Filter posts by tag
  const displayedPosts = selectedTag
    ? posts.filter(p => p.tags.includes(selectedTag))
    : posts;

  // Calculate stats
  const totalWordCount = posts.reduce((acc, p) => acc + (p.wordCount || 1500), 0);

  const handleSelectPost = post => {
    setSelectedPost(post);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setSelectedPost(null);
  };

  const handleEditPost = post => {
    setEditingPostForModal(post);
    setNewPostOpen(true);
  };

  const handleDeletePost = slug => {
    if (confirm('确认删除这篇文章吗？')) {
      try {
        const saved = JSON.parse(localStorage.getItem('ink_user_custom_posts') || '[]');
        const updated = saved.filter(p => p.slug !== slug);
        localStorage.setItem('ink_user_custom_posts', JSON.stringify(updated));
        setPosts(getLocalPosts());
        setSelectedPost(null);
        setNewPostOpen(false);
        setEditingPostForModal(null);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSaveDraft = newPost => {
    try {
      const saved = JSON.parse(localStorage.getItem('ink_user_custom_posts') || '[]');
      const existingIdx = saved.findIndex(p => p.slug === newPost.slug);
      if (existingIdx >= 0) {
        saved[existingIdx] = newPost;
      } else {
        saved.unshift(newPost);
      }
      localStorage.setItem('ink_user_custom_posts', JSON.stringify(saved));
      const updatedPosts = getLocalPosts();
      setPosts(updatedPosts);
      if (selectedPost && selectedPost.slug === newPost.slug) {
        const found = updatedPosts.find(p => p.slug === newPost.slug);
        if (found) setSelectedPost(found);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={`app-wrapper ${isZenMode ? 'zen-active' : ''}`}>
      {/* Top Reading Progress Bar (active when reading an article) */}
      {selectedPost && <ReadingProgress />}

      {/* Header & Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={tab => {
          setActiveTab(tab);
          setSelectedPost(null);
        }}
        theme={theme}
        setTheme={setTheme}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenNewPost={() => handleOpenNewPost()}
        onTogglePrefs={() => setPrefsOpen(!prefsOpen)}
        isZenMode={isZenMode}
        isAuthor={isAuthor}
        onToggleAuthorMode={handleToggleAuthorMode}
      />

      {/* Main Content Area */}
      <main className="site-main-content">
        {selectedPost ? (
          /* Single Article Reading View */
          <ArticleDetail
            post={selectedPost}
            allPosts={posts}
            onBack={handleBackToList}
            onSelectPost={handleSelectPost}
            isZenMode={isZenMode}
            setIsZenMode={setIsZenMode}
            onTogglePrefs={() => setPrefsOpen(true)}
            onEditPost={handleEditPost}
            isAuthor={isAuthor}
          />
        ) : (
          /* Tabbed Views */
          <>
            {activeTab === 'posts' && (
              <section className="posts-container animate-fade-in">
                {/* Hero Editorial Header */}
                <div className="hero-banner">
                  <div className="hero-subtitle-badge">
                    <Sparkles size={13} />
                    <span>INDIE BLOG & DIGITAL GARDEN</span>
                  </div>
                  <h1 className="hero-title">在留白深处，见思想微澜</h1>
                  <p className="hero-desc">
                    这是一个以文字、思考与手艺为核心的沉静自留地。记录技术架构、设计美学与数字生活实践。
                  </p>
                </div>

                {/* Top Featured Writing Reference Card (Tim Urban & Paul Graham) */}
                <WritingReferenceCard />

                {/* Filter & Tag Row */}
                <div className="posts-feed-header">
                  <div className="tags-scroll-row">
                    <button
                      className={`filter-pill ${selectedTag === null ? 'active' : ''}`}
                      onClick={() => setSelectedTag(null)}
                    >
                      全部文章 ({posts.length})
                    </button>
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        className={`filter-pill ${selectedTag === tag ? 'active' : ''}`}
                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Post Cards Grid */}
                <div className="posts-grid">
                  {displayedPosts.map((post, idx) => (
                    <div
                      key={post.slug}
                      className="animate-fade-in"
                      style={{ animationDelay: `${idx * 0.06}s` }}
                    >
                      <PostCard
                        post={post}
                        onSelectPost={handleSelectPost}
                        onTagClick={tag => setSelectedTag(tag)}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'reference' && (
              <ReferenceSection
                posts={posts}
                onSelectPost={handleSelectPost}
                onOpenNewPost={handleOpenNewPost}
                isAuthor={isAuthor}
                onToggleAuthorMode={handleToggleAuthorMode}
              />
            )}

            {activeTab === 'thoughts' && (
              <ThoughtsStream
                isAuthor={isAuthor}
                onToggleAuthorMode={handleToggleAuthorMode}
              />
            )}

            {activeTab === 'about' && (
              <AboutSection onOpenNewPost={() => handleOpenNewPost()} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <Footer
        totalPosts={posts.length}
        totalWords={totalWordCount}
        isZenMode={isZenMode}
        isAuthor={isAuthor}
        onToggleAuthorMode={handleToggleAuthorMode}
      />

      {/* Global Search Modal (Cmd+K) */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        posts={posts}
        onSelectPost={handleSelectPost}
      />

      {/* New Post / Markdown Helper Drawer */}
      <NewPostModal
        isOpen={newPostOpen}
        onClose={() => {
          setNewPostOpen(false);
          setEditingPostForModal(null);
          setNewPostInitialData(null);
        }}
        onSaveDraft={handleSaveDraft}
        postToEdit={editingPostForModal}
        onDeletePost={handleDeletePost}
        initialData={newPostInitialData}
      />

      {/* Reading & Typography Preferences Modal */}
      <ReadingPreferences
        isOpen={prefsOpen}
        onClose={() => setPrefsOpen(false)}
        fontPref={fontPref}
        setFontPref={setFontPref}
        fontSize={fontSize}
        setFontSize={setFontSize}
        theme={theme}
        setTheme={setTheme}
        isZenMode={isZenMode}
        setIsZenMode={setIsZenMode}
      />
    </div>
  );
}
