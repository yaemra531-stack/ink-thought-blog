import React, { useState } from 'react';
import { X, Download, Copy, Check, Eye, Code, Sparkles, FolderDown, Save } from 'lucide-react';
import { renderMarkdown } from '../utils/markdownParser';

export default function NewPostModal({ isOpen, onClose, onSaveDraft }) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [tags, setTags] = useState('思考随笔, 设计美学');
  const [excerpt, setExcerpt] = useState('');
  const [author, setAuthor] = useState('我');
  const [content, setContent] = useState(`## 灵感的起步

写下你对世界的最新观察。生活里的细枝末节，往往藏着意想不到的诗意。

### 为什么记录？

> “文字是时间的标本，思想的留影。”

- 思考一
- 思考二

\`\`\`javascript
// 简单即是美
console.log("Hello, Digital Garden!");
\`\`\`
`);
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'preview'
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  // Generate full markdown with frontmatter
  const buildFullMarkdown = () => {
    const today = new Date().toISOString().split('T')[0];
    const tagsArray = tags
      .split(/[,，]/)
      .map(t => t.trim())
      .filter(Boolean);
    const tagsFormatted = `[${tagsArray.map(t => `"${t}"`).join(', ')}]`;

    return `---
title: "${title || '未命名的新文章'}"
date: "${today}"
tags: ${tagsFormatted}
excerpt: "${excerpt || (content.slice(0, 100).replace(/[#*`_\[\]]/g, '') + '...')}"
featured: false
author: "${author || '我'}"
---

${content}
`;
  };

  const handleDownload = () => {
    const fullMd = buildFullMarkdown();
    const cleanSlug = slug.trim()
      ? slug.trim().toLowerCase().replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
      : (title.trim() ? title.trim().toLowerCase().replace(/[^\w\u4e00-\u9fa5-]+/g, '-') : `post-${Date.now()}`);
    
    const filename = `${cleanSlug}.md`;
    const blob = new Blob([fullMd], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const handleCopy = () => {
    const fullMd = buildFullMarkdown();
    navigator.clipboard.writeText(fullMd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToBrowser = () => {
    const fullMd = buildFullMarkdown();
    const cleanSlug = slug.trim() || `post-${Date.now()}`;
    onSaveDraft({
      slug: cleanSlug,
      title: title || '未命名的新文章',
      rawContent: fullMd,
    });
    onClose();
  };

  return (
    <div className="search-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="new-post-modal animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="new-post-header">
          <div className="modal-title-wrap">
            <span className="modal-badge">本地 Markdown</span>
            <h3>撰写新文章与导出</h3>
          </div>
          <button className="close-modal-btn" onClick={onClose} aria-label="关闭窗口">
            <X size={18} />
          </button>
        </div>

        <div className="new-post-body">
          {/* Metadata Fields */}
          <div className="post-meta-fields">
            <div className="field-group flex-2">
              <label>文章标题 (Title)</label>
              <input
                type="text"
                placeholder="例如：在静默中重构心智模型"
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  if (!slug) {
                    setSlug(e.target.value.toLowerCase().replace(/[^\w\u4e00-\u9fa5-]+/g, '-'));
                  }
                }}
              />
            </div>
            <div className="field-group flex-1">
              <label>文件标识 (Slug / 文件名)</label>
              <input
                type="text"
                placeholder="rebuilding-mental-models"
                value={slug}
                onChange={e => setSlug(e.target.value)}
              />
            </div>
          </div>

          <div className="post-meta-fields">
            <div className="field-group flex-2">
              <label>标签分类 (逗号分隔)</label>
              <input
                type="text"
                placeholder="思考随笔, 前端架构, 设计美学"
                value={tags}
                onChange={e => setTags(e.target.value)}
              />
            </div>
            <div className="field-group flex-1">
              <label>作者笔名</label>
              <input
                type="text"
                placeholder="清墨"
                value={author}
                onChange={e => setAuthor(e.target.value)}
              />
            </div>
          </div>

          <div className="field-group">
            <label>文章摘要 (Excerpt - 可选)</label>
            <input
              type="text"
              placeholder="一两句话概括文章核心，将展示在列表卡片上..."
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
            />
          </div>

          {/* Editor / Preview Tabs */}
          <div className="editor-subnav">
            <div className="editor-tabs">
              <button
                className={`tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
                onClick={() => setActiveTab('edit')}
              >
                <Code size={14} />
                <span>Markdown 源码</span>
              </button>
              <button
                className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                onClick={() => setActiveTab('preview')}
              >
                <Eye size={14} />
                <span>排版预览</span>
              </button>
            </div>
            <span className="editor-hint">支持标准 GFM、代码高亮、引用块与目录提取</span>
          </div>

          {activeTab === 'edit' ? (
            <textarea
              className="markdown-editor-area"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="开始用 Markdown 写作你的文章内容..."
              rows={14}
            />
          ) : (
            <div className="markdown-preview-area">
              <div
                className="article-content"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
              />
            </div>
          )}

          {/* Local storage note */}
          <div className="local-workflow-tip">
            <FolderDown size={18} className="tip-icon" />
            <div className="tip-content">
              <strong>本地文件存放指引：</strong>
              <span>
                点击下方<strong>“下载 .md 文件”</strong>后，将该文件移动至项目的{' '}
                <code>src/content/posts/</code> 目录下。Vite 会立即自动加载，提交至 Git 即可永久归档！
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="new-post-footer">
          <div className="footer-left">
            <button
              className="secondary-action-btn"
              onClick={handleCopy}
              title="复制包含 Frontmatter 的完整 Markdown"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? '已复制到剪贴板！' : '复制 Markdown 源码'}</span>
            </button>
          </div>

          <div className="footer-right">
            <button
              className="browser-preview-btn"
              onClick={handleSaveToBrowser}
              title="在浏览器中直接预览此文"
            >
              <Save size={15} />
              <span>保存并在本站预览</span>
            </button>

            <button
              className="primary-action-btn"
              onClick={handleDownload}
            >
              <Download size={15} />
              <span>{downloaded ? '已下载 .md 文件！' : '下载 .md 文件'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
