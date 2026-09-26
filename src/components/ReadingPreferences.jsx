import React from 'react';
import { X, Type, Eye, Maximize2, Minimize2, Check } from 'lucide-react';

export default function ReadingPreferences({
  isOpen,
  onClose,
  fontPref,
  setFontPref,
  fontSize,
  setFontSize,
  theme,
  setTheme,
  isZenMode,
  setIsZenMode,
}) {
  if (!isOpen) return null;

  return (
    <div className="prefs-drawer-backdrop" onClick={onClose}>
      <div
        className="prefs-drawer animate-scale-up"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="阅读与排版偏好设置"
      >
        <div className="prefs-header">
          <div className="prefs-title">
            <Type size={16} />
            <span>阅读与排版偏好</span>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="关闭">
            <X size={16} />
          </button>
        </div>

        <div className="prefs-body">
          {/* Typography choice */}
          <div className="pref-section">
            <label className="pref-label">阅读字体风格</label>
            <div className="pref-btn-group">
              <button
                className={`pref-option-btn ${fontPref === 'serif' ? 'active' : ''}`}
                onClick={() => setFontPref('serif')}
              >
                <span className="sample-font serif">宋体 / Serif</span>
                {fontPref === 'serif' && <Check size={14} />}
              </button>
              <button
                className={`pref-option-btn ${fontPref === 'sans' ? 'active' : ''}`}
                onClick={() => setFontPref('sans')}
              >
                <span className="sample-font sans">黑体 / Sans</span>
                {fontPref === 'sans' && <Check size={14} />}
              </button>
            </div>
          </div>

          {/* Font Size choice */}
          <div className="pref-section">
            <label className="pref-label">字号与行高</label>
            <div className="pref-btn-group-3">
              <button
                className={`pref-size-btn ${fontSize === 'small' ? 'active' : ''}`}
                onClick={() => setFontSize('small')}
              >
                <span>A-</span>
                <small>紧凑 (16px)</small>
              </button>
              <button
                className={`pref-size-btn ${fontSize === 'medium' ? 'active' : ''}`}
                onClick={() => setFontSize('medium')}
              >
                <span>A</span>
                <small>标准 (18px)</small>
              </button>
              <button
                className={`pref-size-btn ${fontSize === 'large' ? 'active' : ''}`}
                onClick={() => setFontSize('large')}
              >
                <span>A+</span>
                <small>舒适 (20px)</small>
              </button>
            </div>
          </div>

          {/* Theme choice */}
          <div className="pref-section">
            <label className="pref-label">纸张与界面色调</label>
            <div className="pref-btn-group-3">
              <button
                className={`pref-theme-card theme-light ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
              >
                <div className="theme-color-preview light" />
                <span>纸白</span>
              </button>
              <button
                className={`pref-theme-card theme-sepia ${theme === 'sepia' ? 'active' : ''}`}
                onClick={() => setTheme('sepia')}
              >
                <div className="theme-color-preview sepia" />
                <span>暖羊皮</span>
              </button>
              <button
                className={`pref-theme-card theme-dark ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme('dark')}
              >
                <div className="theme-color-preview dark" />
                <span>暗曜石</span>
              </button>
            </div>
          </div>

          {/* Zen Mode toggle */}
          <div className="pref-section">
            <label className="pref-label">沉浸专注模式</label>
            <button
              className={`zen-toggle-btn ${isZenMode ? 'active' : ''}`}
              onClick={() => setIsZenMode(!isZenMode)}
            >
              {isZenMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              <span>{isZenMode ? '退出专注模式 (显示全部界面)' : '开启专注阅读 (隐藏导航栏与干扰)'}</span>
            </button>
          </div>
        </div>

        <div className="prefs-footer">
          <small>偏好设置将自动保存在当前浏览器中</small>
        </div>
      </div>
    </div>
  );
}
