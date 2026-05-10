// 主题切换器 —— 工具栏右上角下拉菜单，选中后立即换 link 标签
import { useEffect, useRef, useState } from 'react';
import { THEME_OPTIONS } from '../lib/theme-loader';

interface ThemeSwitcherProps {
  /** 当前主题 ID */
  value: string;
  /** 主题切换回调 */
  onChange: (themeId: string) => void;
}

export function ThemeSwitcher({ value, onChange }: ThemeSwitcherProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = THEME_OPTIONS.find((t) => t.id === value) ?? THEME_OPTIONS[0]!;

  // 点击外部 / Esc 关闭下拉
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="mdv-theme-switcher" ref={ref}>
      <button
        type="button"
        className="mdv-toolbar-btn"
        title="Switch theme"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Switch theme. Current: ${current.name}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden>🎨</span>
        <span className="mdv-toolbar-btn-label">{current.name}</span>
      </button>
      {open && (
        <ul className="mdv-theme-menu" role="listbox" aria-label="Theme options">
          {THEME_OPTIONS.map((t) => (
            <li key={t.id} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={t.id === value}
                className={t.id === value ? 'is-active' : ''}
                onClick={() => {
                  onChange(t.id);
                  setOpen(false);
                }}
              >
                <strong>{t.name}</strong>
                {t.description && <span>{t.description}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
