// Web 端主题切换器（React Island）—— 改 URL ?theme= 后整页刷新让 SSR 重新出
// 不持久化到 localStorage —— Web 上"链接是真相"，主题随短链/参数走
import { useEffect, useRef, useState } from 'react';

const THEMES = [
  { id: 'default', name: 'Default' },
  { id: 'github', name: 'GitHub' },
  { id: 'medium', name: 'Medium' },
];

interface Props {
  /** 当前主题 ID（来自 SSR，由后端塞 prop） */
  current: string;
}

export function WebThemeSwitcher({ current }: Props): JSX.Element {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  function handlePick(themeId: string): void {
    const url = new URL(window.location.href);
    url.searchParams.set('theme', themeId);
    window.location.href = url.toString();
  }

  const currentName = THEMES.find((t) => t.id === current)?.name ?? current;

  return (
    <div className="mdv-web-theme" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-label="Switch theme">
        <span aria-hidden>🎨</span>
        <span>{currentName}</span>
      </button>
      {open && (
        <ul role="listbox">
          {THEMES.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                role="option"
                aria-selected={t.id === current}
                className={t.id === current ? 'is-active' : ''}
                onClick={() => handlePick(t.id)}
              >
                {t.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
