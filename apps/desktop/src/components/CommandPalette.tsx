// ⌘K 命令面板 —— 所有动作 + 主题 + 最近文件 一处搜索
// 设计：纯键盘可操作，模糊匹配，回车执行
import { useEffect, useMemo, useRef, useState } from 'react';
import { THEME_OPTIONS } from '../lib/theme-loader';
import type { RecentFile } from '../lib/recent-files';

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  group: 'Action' | 'Theme' | 'Recent' | 'View';
  /** 执行回调 */
  run: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** 触发动作的回调 */
  onOpen: () => void;
  onExport: () => void;
  onSave: () => void;
  onSetTheme: (id: string) => void;
  onSetViewMode: (mode: 'read' | 'split' | 'source') => void;
  onPickRecent: (f: RecentFile) => void;
  /** 当前可用的最近文件 */
  recents: RecentFile[];
  /** 当前是否有打开文件 —— 决定 export/save 命令是否可用 */
  hasFile: boolean;
}

export function CommandPalette(props: Props): JSX.Element | null {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // 构造命令列表
  const commands = useMemo(() => buildCommands(props), [props]);

  // 模糊过滤（极简：包含子串、忽略大小写）
  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.hint?.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q),
    );
  }, [commands, query]);

  // 打开时清空查询、聚焦输入框
  useEffect(() => {
    if (props.open) {
      setQuery('');
      setActiveIdx(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [props.open]);

  // 键盘导航
  useEffect(() => {
    if (!props.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        props.onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = filtered[activeIdx];
        if (cmd) {
          cmd.run();
          props.onClose();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [props, filtered, activeIdx]);

  if (!props.open) return null;

  // 按 group 分组渲染
  const grouped = groupBy(filtered, (c) => c.group);

  return (
    <div
      className="mdv-cmdk-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) props.onClose();
      }}
      role="presentation"
    >
      <div className="mdv-cmdk" role="dialog" aria-label="Command palette" aria-modal="true">
        <input
          ref={inputRef}
          type="text"
          className="mdv-cmdk-input"
          placeholder="Type a command, theme, or file…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIdx(0);
          }}
          aria-label="Command search"
        />
        <ul className="mdv-cmdk-results" role="listbox">
          {filtered.length === 0 && <li className="mdv-cmdk-empty">No matches</li>}
          {Object.entries(grouped).map(([group, items]) => (
            <li key={group} className="mdv-cmdk-group" role="presentation">
              <div className="mdv-cmdk-group-label">{group}</div>
              <ul>
                {items.map((c) => {
                  const idx = filtered.indexOf(c);
                  const active = idx === activeIdx;
                  return (
                    <li
                      key={c.id}
                      role="option"
                      aria-selected={active}
                      className={active ? 'is-active' : ''}
                      onClick={() => {
                        c.run();
                        props.onClose();
                      }}
                      onMouseEnter={() => setActiveIdx(idx)}
                    >
                      <span className="mdv-cmdk-label">{c.label}</span>
                      {c.hint && <span className="mdv-cmdk-hint">{c.hint}</span>}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function buildCommands(props: Props): CommandItem[] {
  const cmds: CommandItem[] = [
    {
      id: 'open',
      label: 'Open file…',
      hint: '⌘O',
      group: 'Action',
      run: props.onOpen,
    },
  ];
  if (props.hasFile) {
    cmds.push(
      {
        id: 'save',
        label: 'Save',
        hint: '⌘S',
        group: 'Action',
        run: props.onSave,
      },
      {
        id: 'export',
        label: 'Export as .mdv.html…',
        hint: '⌘E',
        group: 'Action',
        run: props.onExport,
      },
    );
    cmds.push(
      {
        id: 'view-read',
        label: 'View: Read',
        hint: '⌘\\',
        group: 'View',
        run: () => props.onSetViewMode('read'),
      },
      {
        id: 'view-split',
        label: 'View: Split',
        hint: '⌘\\',
        group: 'View',
        run: () => props.onSetViewMode('split'),
      },
      {
        id: 'view-source',
        label: 'View: Source',
        hint: '⌘\\',
        group: 'View',
        run: () => props.onSetViewMode('source'),
      },
    );
  }
  for (const t of THEME_OPTIONS) {
    cmds.push({
      id: `theme-${t.id}`,
      label: `Theme: ${t.name}`,
      hint: t.description,
      group: 'Theme',
      run: () => props.onSetTheme(t.id),
    });
  }
  for (const f of props.recents.slice(0, 5)) {
    cmds.push({
      id: `recent-${f.path}`,
      label: f.name,
      hint: f.path,
      group: 'Recent',
      run: () => props.onPickRecent(f),
    });
  }
  return cmds;
}

function groupBy<T, K extends string>(arr: T[], key: (t: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const item of arr) {
    const k = key(item);
    if (!out[k]) out[k] = [];
    out[k].push(item);
  }
  return out;
}
