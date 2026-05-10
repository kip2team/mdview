// 目录侧栏 —— 当 metadata.toc=true 或对象时显示
// 数据源：core.render() 返回的 headings 数组（已带稳定 id）
// 当前位置高亮：IntersectionObserver 监听各标题的可见状态
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Heading, MdviewMetadata } from '@mdview/core';

interface TocSidebarProps {
  headings: Heading[];
  /** front matter 里的 toc 值（true / { position, depth } / false） */
  toc: MdviewMetadata['toc'];
}

export function TocSidebar({ headings, toc }: TocSidebarProps): JSX.Element | null {
  const config = useMemo(() => normalizeToc(toc), [toc]);
  const visibleHeadings = useMemo(
    () => (config ? headings.filter((h) => h.level <= config.depth) : []),
    [headings, config],
  );
  const [activeId, setActiveId] = useState<string | undefined>();
  const containerRef = useRef<HTMLElement>(null);

  // 用 IntersectionObserver 跟踪屏幕中可见的标题，取最靠近视口顶端的那个高亮
  useEffect(() => {
    if (!config || visibleHeadings.length === 0) return;
    const observed = visibleHeadings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => !!el);
    if (observed.length === 0) return;

    const visibility = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visibility.set(e.target.id, e.intersectionRatio);
          else visibility.delete(e.target.id);
        }
        // 取首个标题（按文档顺序）作为活跃标题，避免长文档里"最大可见率"频繁跳动
        const firstVisible = visibleHeadings.find((h) => visibility.has(h.id));
        if (firstVisible) setActiveId(firstVisible.id);
      },
      { rootMargin: '0px 0px -70% 0px', threshold: [0, 0.5, 1] },
    );
    for (const el of observed) observer.observe(el);
    return () => observer.disconnect();
  }, [config, visibleHeadings]);

  if (!config || visibleHeadings.length === 0) return null;

  return (
    <aside
      ref={containerRef}
      className={`mdv-toc mdv-toc-${config.position}`}
      aria-label="Table of contents"
    >
      <div className="mdv-toc-title">On this page</div>
      <nav>
        <ul>
          {visibleHeadings.map((h) => (
            <li key={h.id} className={`mdv-toc-l${h.level}`}>
              <a
                href={`#${h.id}`}
                className={h.id === activeId ? 'is-active' : ''}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(h.id)?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                  // 滚到锚点后更新 hash，方便 URL 复制分享
                  history.replaceState(null, '', `#${h.id}`);
                }}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

interface NormalizedToc {
  position: 'left' | 'right';
  depth: number;
}

/** 把 front matter 里的 toc 字段（bool / 对象 / undefined）规范成统一对象 */
function normalizeToc(raw: MdviewMetadata['toc']): NormalizedToc | null {
  if (!raw) return null;
  if (raw === true) return { position: 'right', depth: 3 };
  if (typeof raw === 'object') {
    return {
      position: raw.position === 'left' ? 'left' : 'right',
      depth: typeof raw.depth === 'number' ? Math.max(1, Math.min(6, raw.depth)) : 3,
    };
  }
  return null;
}
