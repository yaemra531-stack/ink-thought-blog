import React, { useEffect, useState } from 'react';
import { List, ChevronRight } from 'lucide-react';

export default function TableOfContents({ headings, isMobileDrawer, onClose }) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    if (!headings || headings.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -70% 0px' }
    );

    headings.forEach(h => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (!headings || headings.length === 0) return null;

  const handleScrollTo = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const topOffset = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: topOffset, behavior: 'smooth' });
      setActiveId(id);
      if (onClose) onClose();
    }
  };

  return (
    <nav className={`toc-container ${isMobileDrawer ? 'toc-mobile' : ''}`} aria-label="文章目录">
      <div className="toc-header">
        <List size={15} />
        <span>本篇脉络</span>
      </div>
      <ul className="toc-list">
        {headings.map(h => (
          <li
            key={h.id}
            className={`toc-item level-${h.level} ${activeId === h.id ? 'active' : ''}`}
          >
            <a
              href={`#${h.id}`}
              onClick={e => handleScrollTo(e, h.id)}
              className="toc-link"
            >
              {activeId === h.id && <ChevronRight size={12} className="toc-chevron" />}
              <span className="toc-text">{h.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
