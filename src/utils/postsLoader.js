import { parseFrontmatter } from './markdownParser';
import { calculateReadingStats } from './readingTime';

// Load all markdown files from the local posts directory at build/runtime
const postFiles = import.meta.glob('/src/content/posts/*.md', {
  query: '?raw',
  eager: true,
});

export function getLocalPosts() {
  const posts = [];

  for (const path in postFiles) {
    const rawContent = postFiles[path].default || postFiles[path];
    const { frontmatter, content } = parseFrontmatter(rawContent);

    // Extract slug from filename: /src/content/posts/01-the-art-of-whitespace.md -> 01-the-art-of-whitespace
    const slug = path.split('/').pop().replace(/\.md$/, '');
    const stats = calculateReadingStats(content);

    posts.push({
      slug,
      path,
      title: frontmatter.title || slug.replace(/^\d+-/, '').replace(/-/g, ' '),
      date: frontmatter.date || '2026-01-01',
      tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : (frontmatter.tags ? [frontmatter.tags] : ['随笔']),
      excerpt: frontmatter.excerpt || content.slice(0, 150).replace(/[#*`_\[\]]/g, '') + '...',
      cover: frontmatter.cover || null,
      featured: Boolean(frontmatter.featured),
      author: frontmatter.author || '墨客',
      readingTime: stats.minutes,
      wordCount: stats.words,
      rawContent,
      content,
    });
  }

  // Also check if user has created any local draft posts in localStorage
  try {
    const localDraftsRaw = localStorage.getItem('ink_user_custom_posts');
    if (localDraftsRaw) {
      const customPosts = JSON.parse(localDraftsRaw);
      customPosts.forEach(cp => {
        const { frontmatter, content } = parseFrontmatter(cp.rawContent);
        const stats = calculateReadingStats(content);
        posts.unshift({
          slug: cp.slug || `draft-${Date.now()}`,
          isCustomDraft: true,
          title: frontmatter.title || cp.title || '无标题文章',
          date: frontmatter.date || new Date().toISOString().split('T')[0],
          tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : ['草稿'],
          excerpt: frontmatter.excerpt || content.slice(0, 150).replace(/[#*`_\[\]]/g, '') + '...',
          cover: frontmatter.cover || null,
          featured: false,
          author: frontmatter.author || '我',
          readingTime: stats.minutes,
          wordCount: stats.words,
          rawContent: cp.rawContent,
          content,
        });
      });
    }
  } catch (e) {
    console.error('Failed reading custom draft posts', e);
  }

  // Sort by date descending
  return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getAllTags(posts) {
  const tagsSet = new Set();
  posts.forEach(post => {
    post.tags.forEach(t => tagsSet.add(t));
  });
  return Array.from(tagsSet);
}
