// Offsets refer to rendered text, so selections can span emphasis and paragraphs.
export function captureAnchor(root, range) {
  if (!root || !root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
  const before = range.cloneRange();
  before.selectNodeContents(root);
  before.setEnd(range.startContainer, range.startOffset);
  const start = before.toString().length;
  const text = root.textContent;
  const exact = range.toString();
  return {
    start,
    end: start + exact.length,
    exact,
    prefix: text.slice(Math.max(0, start - 32), start),
    suffix: text.slice(start + exact.length, start + exact.length + 32),
  };
}

export function resolveAnchor(text, note) {
  const anchor = note.anchor;
  if (anchor && text.slice(anchor.start, anchor.end) === anchor.exact) return anchor;
  const exact = anchor?.exact || note.quote;
  if (!exact) return null;
  let start = text.indexOf(exact);
  while (start !== -1) {
    const end = start + exact.length;
    if (!anchor || (
      (!anchor.prefix || text.slice(Math.max(0, start - anchor.prefix.length), start) === anchor.prefix) &&
      (!anchor.suffix || text.slice(end, end + anchor.suffix.length) === anchor.suffix)
    )) return { start, end };
    start = text.indexOf(exact, start + 1);
  }
  // Older notes contain browser selection line breaks; match their visible text.
  // New anchored notes must retain their context rather than attach elsewhere.
  if (anchor) return null;
  const indices = [];
  let compact = '';
  for (let index = 0; index < text.length; index++) {
    if (!/\s/.test(text[index])) {
      compact += text[index];
      indices.push(index);
    }
  }
  const quote = exact.replace(/\s/g, '');
  const found = compact.indexOf(quote);
  if (found === -1 || !quote) return null;
  return { start: indices[found], end: indices[found + quote.length - 1] + 1 };
}

export function rangeFromAnchor(root, anchor) {
  if (!root || !anchor || anchor.start < 0 || anchor.end <= anchor.start) return null;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let offset = 0;
  let started = false;
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const end = offset + node.textContent.length;
    if (!started && anchor.start < end) {
      range.setStart(node, anchor.start - offset);
      started = true;
    }
    if (started && anchor.end <= end) {
      range.setEnd(node, anchor.end - offset);
      return range;
    }
    offset = end;
  }
  return null;
}
