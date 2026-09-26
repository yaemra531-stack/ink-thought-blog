/**
 * Calculates estimated reading time and word count for mixed Chinese and English text
 */
export function calculateReadingStats(content) {
  if (!content) return { words: 0, minutes: 1 };

  // Remove code blocks and html tags for more accurate word count
  const cleanText = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Count Chinese characters
  const chineseMatch = cleanText.match(/[\u4e00-\u9fa5]/g) || [];
  const chineseCharCount = chineseMatch.length;

  // Count English / alphanumeric words
  const nonChinese = cleanText.replace(/[\u4e00-\u9fa5]/g, ' ');
  const englishWords = nonChinese
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0 && /[a-zA-Z0-9]/.test(w)).length;

  const totalWordEquiv = chineseCharCount + englishWords;

  // Standard reading speed: ~350 Chinese chars/min, ~200 English words/min
  const minutes = Math.max(1, Math.ceil(chineseCharCount / 350 + englishWords / 200));

  return {
    words: totalWordEquiv,
    minutes,
  };
}
