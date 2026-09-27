import React, { useState } from 'react';
import {
  Feather,
  Search,
  PenTool,
  Moon,
  Sun,
  Coffee,
  Sliders,
  Menu,
  X,
  BookOpen,
  BookMarked,
  Archive,
  User,
  Sparkles,
  Flame
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  onOpenSearch,
  onOpenNewPost,
  onTogglePrefs,
  isZenMode,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Cycle through light -> dark -> sepia -> light
  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('sepia');
    else setTheme('light');
  };

  const themeIcon = () => {
    if (theme === 'dark') return <Sun size={17} />;
    if (theme === 'sepia') return <Coffee size={17} />;
    return <Moon size={17} />;
  };

  const themeTitle = () => {
    if (theme === 'dark') return '切换到羊皮纸模式';
    if (theme === 'sepia') return '切换到日间纸质模式';
    return '切换到暗夜模式';
  };

  const navItems = [
    { id: 'posts', label: '文集', icon: <BookOpen size={16} /> },
    { id: 'reference', label: '参考', icon: <BookMarked size={16} /> },
    { id: 'thoughts', label: '速记', icon: <Sparkles size={16} /> },
    { id: 'archive', label: '归档', icon: <Archive size={16} /> },
    { id: 'challenge', label: '21天挑战', icon: <Flame size={16} /> },
    { id: 'about', label: '关于', icon: <User size={16} /> },
  ];

  if (isZenMode) {
    return null; // In Zen Mode, navbar is hidden for distraction-free reading
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        {/* Brand / Logo */}
        <div
          className="brand-logo"
          onClick={() => {
            setActiveTab('posts');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          role="button"
          tabIndex={0}
          aria-label="返回首页"
        >
          <div className="brand-icon-wrapper">
            <Feather size={19} className="brand-feather" />
          </div>
          <div className="brand-text">
            <span className="brand-name">博客随笔</span>
            <span className="brand-sub">思考自留地</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="desktop-nav" aria-label="主要导航">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-btn ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-btn-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Action Controls */}
        <div className="header-actions">
          {/* Quick Search */}
          <button
            className="action-icon-btn search-trigger"
            onClick={onOpenSearch}
            title="全局搜索 (快捷键 ⌘K 或 Ctrl+K)"
            aria-label="搜索博客"
          >
            <Search size={17} />
            <span className="search-shortcut">⌘K</span>
          </button>

          {/* New Markdown Post Helper */}
          <button
            className="action-icon-btn write-btn"
            onClick={onOpenNewPost}
            title="撰写与导出新 Markdown 文章"
            aria-label="写新文章"
          >
            <PenTool size={16} />
            <span className="btn-label-desktop">写文章</span>
          </button>

          {/* Reading Preferences (Font / Size) */}
          <button
            className="action-icon-btn"
            onClick={onTogglePrefs}
            title="阅读排版偏好设置"
            aria-label="排版设置"
          >
            <Sliders size={16} />
          </button>

          {/* Theme switcher */}
          <button
            className="action-icon-btn theme-toggle-btn"
            onClick={toggleTheme}
            title={themeTitle()}
            aria-label="切换主题模式"
          >
            {themeIcon()}
          </button>

          {/* Mobile menu hamburger */}
          <button
            className="action-icon-btn mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="打开移动端菜单"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer animate-fade-in">
          <div className="mobile-drawer-links">
            {navItems.map(item => (
              <button
                key={item.id}
                className={`mobile-nav-link ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
            <div className="mobile-drawer-divider" />
            <button
              className="mobile-nav-link"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenNewPost();
              }}
            >
              <PenTool size={16} />
              <span>✍️ 撰写与导出 Markdown</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
