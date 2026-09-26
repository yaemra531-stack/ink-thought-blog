import { Marked } from 'marked';
import hljs from 'highlight.js';

/**
 * Parses frontmatter from a markdown file string.
 * Supports:
 * ---
 * title: "..."
 * date: 2026-09-26
 * tags: [设计, 思考, 前端]
 * excerpt: "..."
 * cover: "..."
 * featured: true
 * ---
 */
export function parseFrontmatter(rawContent) {
  if (!rawContent) return { frontmatter: {}, content: '' };

  const trimmed = rawContent.trim();
  const fmRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
  const match = trimmed.match(fmRegex);

  if (!match) {
    return { frontmatter: {}, content: trimmed };
  }

  const rawMeta = match[1];
  const content = match[2].trim();
  const frontmatter = {};

  const lines = rawMeta.split('\n');
  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) return;

    const colonIndex = trimmedLine.indexOf(':');
    if (colonIndex === -1) return;

    const key = trimmedLine.slice(0, colonIndex).trim();
    let val = trimmedLine.slice(colonIndex + 1).trim();

    // Check string quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    // Check array [tag1, tag2]
    else if (val.startsWith('[') && val.endsWith(']')) {
      val = val
        .slice(1, -1)
        .split(',')
        .map(item => item.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    }
    // Check boolean
    else if (val.toLowerCase() === 'true') {
      val = true;
    } else if (val.toLowerCase() === 'false') {
      val = false;
    }
    // Check number
    else if (!isNaN(Number(val)) && val !== '') {
      val = Number(val);
    }

    frontmatter[key] = val;
  });

  return { frontmatter, content };
}

/**
 * Configure Marked with syntax highlighting and custom heading IDs for Table of Contents
 */
const markedInstance = new Marked({
  gfm: true,
  breaks: true,
});

markedInstance.use({
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      // Generate clean ID from heading text
      const id = text
        .toLowerCase()
        .replace(/<[^>]*>/g, '')
        .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
        .replace(/^-+|-+$/g, '') || `section-${Math.random().toString(36).substring(2, 7)}`;
      return `<h${depth} id="${id}" class="article-heading heading-${depth}">
        <a href="#${id}" class="heading-anchor" aria-label="锚点链接">#</a>
        <span>${text}</span>
      </h${depth}>`;
    },
    code(token) {
      const text = typeof token === 'string' ? token : token.text;
      const lang = (typeof token === 'object' && token.lang) ? token.lang.trim().toLowerCase() : '';
      const validLang = (lang && hljs.getLanguage(lang)) ? lang : 'plaintext';
      let highlighted = '';

      try {
        highlighted = hljs.highlight(text, { language: validLang }).value;
      } catch (e) {
        highlighted = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }

      // Escape quotes for copy button data attribute
      const escapedRaw = encodeURIComponent(text);

      return `
        <div class="code-block-wrapper">
          <div class="code-header">
            <span class="code-language">${validLang}</span>
            <button class="copy-code-btn" data-code="${escapedRaw}" aria-label="复制代码">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
              <span>复制</span>
            </button>
          </div>
          <pre class="hljs"><code class="hljs language-${validLang}">${highlighted}</code></pre>
        </div>
      `;
    },
    blockquote({ tokens }) {
      const body = this.parser.parse(tokens);
      return `<blockquote class="editorial-quote"><div class="quote-ornament">“</div><div class="quote-content">${body}</div></blockquote>`;
    }
  }
});

export function renderMarkdown(markdownText) {
  if (!markdownText) return '';
  return markedInstance.parse(markdownText);
}

/**
 * Extracts table of contents headings (h2, h3) from markdown
 */
export function extractHeadings(markdownText) {
  if (!markdownText) return [];
  const lines = markdownText.split('\n');
  const headings = [];

  lines.forEach(line => {
    const match = line.match(/^(#{2,3})\s+(.*)$/);
    if (match) {
      const level = match[1].length;
      const title = match[2].trim().replace(/\*|_|`|\[.*?\]\(.*?\)/g, '');
      const id = title
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      headings.push({ level, title, id });
    }
  });

  return headings;
}
