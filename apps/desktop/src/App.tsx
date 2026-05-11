// mdview 桌面端主界面
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { render } from '@mdview/core';
import { themeDefaults } from '@mdview/themes';
import {
  openFileDialog,
  readMarkdownFile,
  listenForOpenedPath,
  listenForMenuEvents,
  saveFileDialog,
  writeTextToFile,
  isTauriRuntime,
  watchFileMtime,
} from './ipc';
import { sanitize } from './lib/sanitize';
import { highlightHtml } from './lib/highlight';
import { hydrateExtensions, type CancelToken } from './lib/hydrate';
import { applyTheme, getStoredTheme, persistTheme } from './lib/theme-loader';
import { loadRecents, pushRecent, type RecentFile } from './lib/recent-files';
import { Toolbar } from './components/Toolbar';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { ExportDialog } from './components/ExportDialog';
import { TocSidebar } from './components/TocSidebar';
import { DropOverlay } from './components/DropOverlay';
import { Welcome } from './components/Welcome';
import { Editor } from './components/Editor';
import { CommandPalette } from './components/CommandPalette';
import { ReadingStats } from './components/ReadingStats';
import { FolderSidebar } from './components/FolderSidebar';
import { browseFolder, type FolderEntry } from './lib/folder-browse';
import { Onboarding } from './components/Onboarding';
import { checkForUpdate, type AvailableUpdate } from './lib/updater';

/** 三态视图模式：纯阅读 / 分屏（左源右渲染）/ 纯源码 */
type ViewMode = 'read' | 'split' | 'source';
const VIEW_MODES: ViewMode[] = ['read', 'split', 'source'];
const VIEW_MODE_KEY = 'mdview:viewmode';
const WIDE_MODE_KEY = 'mdview:wide';
const VIEW_MODE_LABEL: Record<ViewMode, { icon: string; label: string }> = {
  read: { icon: '👁', label: 'Read' },
  split: { icon: '⊟', label: 'Split' },
  source: { icon: '✎', label: 'Source' },
};

function ViewModeToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (m: ViewMode) => void;
}): JSX.Element {
  return (
    <div className="mdv-viewmode-toggle" role="tablist" aria-label="View mode">
      {VIEW_MODES.map((m) => {
        const { icon, label } = VIEW_MODE_LABEL[m];
        return (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={value === m}
            className={value === m ? 'is-active' : ''}
            title={`${label} mode (⌘\\ to cycle)`}
            onClick={() => onChange(m)}
          >
            <span aria-hidden>{icon}</span>
            <span className="mdv-toolbar-btn-label">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function App(): JSX.Element {
  // 文档状态：filePath 标识当前文件；markdown 为 null 时表示"没文件"，进欢迎页
  const [filePath, setFilePath] = useState<string | undefined>(undefined);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [themeId, setThemeId] = useState<string>(getStoredTheme);
  const [exportOpen, setExportOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [folder, setFolder] = useState<{ root: string; files: FolderEntry[] } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [recents, setRecents] = useState<RecentFile[]>(() => loadRecents());
  // 短暂错误提示 —— 文件读取失败等场景给用户一条可见反馈,4s 自动消失
  const [errorToast, setErrorToast] = useState<string | null>(null);
  useEffect(() => {
    if (!errorToast) return;
    const t = setTimeout(() => setErrorToast(null), 4000);
    return () => clearTimeout(t);
  }, [errorToast]);

  // 应用内自动更新 —— 启动后异步 check,有新版就显示一个常驻 banner;
  // 没配签名/endpoints 或离线时静默 no-op,不打扰用户
  const [availableUpdate, setAvailableUpdate] = useState<AvailableUpdate | null>(null);
  const [installing, setInstalling] = useState(false);
  useEffect(() => {
    let cancelled = false;
    // 延迟 5s 后再 check,避开启动时和必要资源争 IO
    const timer = setTimeout(() => {
      void checkForUpdate().then((u) => {
        if (!cancelled && u) setAvailableUpdate(u);
      });
    }, 5000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const v = localStorage.getItem(VIEW_MODE_KEY);
      return (VIEW_MODES.includes(v as ViewMode) ? v : 'read') as ViewMode;
    } catch {
      return 'read';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_MODE_KEY, viewMode);
    } catch {
      // ignore
    }
  }, [viewMode]);

  // 宽屏模式: 解除主题给 #mdview-output 的 max-width 上限, 让正文与窗口宽度对齐
  // 关闭时走 CSS clamp 自适应宽度(720~920), 不再是 760 死宽
  const [wideMode, setWideMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(WIDE_MODE_KEY) === '1';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(WIDE_MODE_KEY, wideMode ? '1' : '0');
    } catch {
      // ignore
    }
  }, [wideMode]);
  useEffect(() => {
    document.body.classList.toggle('mdv-wide', wideMode);
  }, [wideMode]);

  // 滚动同步用的元素引用（split 模式）
  const outputElRef = useRef<HTMLElement | null>(null);
  const editorWrapperElRef = useRef<HTMLElement | null>(null);

  // split 模式滚动同步：哪一侧滚就把比例写到另一侧
  // 加 syncing 锁，避免互相触发死循环
  useEffect(() => {
    if (viewMode !== 'split') return;
    const out = outputElRef.current;
    const editorWrap = editorWrapperElRef.current;
    if (!out || !editorWrap) return;

    // CodeMirror 实际滚动的是 .cm-scroller
    const editorScroller = editorWrap.querySelector<HTMLElement>('.cm-scroller');
    if (!editorScroller) return;

    let syncing = false;
    function ratio(el: HTMLElement): number {
      const max = el.scrollHeight - el.clientHeight;
      return max <= 0 ? 0 : el.scrollTop / max;
    }
    function applyRatio(el: HTMLElement, r: number): void {
      const max = el.scrollHeight - el.clientHeight;
      el.scrollTop = max * r;
    }
    const onEditorScroll = () => {
      if (syncing) return;
      syncing = true;
      applyRatio(out, ratio(editorScroller!));
      requestAnimationFrame(() => (syncing = false));
    };
    const onOutputScroll = () => {
      if (syncing) return;
      syncing = true;
      applyRatio(editorScroller!, ratio(out));
      requestAnimationFrame(() => (syncing = false));
    };

    editorScroller.addEventListener('scroll', onEditorScroll, { passive: true });
    out.addEventListener('scroll', onOutputScroll, { passive: true });
    return () => {
      editorScroller.removeEventListener('scroll', onEditorScroll);
      out.removeEventListener('scroll', onOutputScroll);
    };
  }, [viewMode, markdown]);

  // 主题副作用
  useEffect(() => {
    applyTheme(themeId);
    persistTheme(themeId);
  }, [themeId]);

  // 把文档的 colorScheme 元数据反映到 <html data-color-scheme> 上
  // 主题 CSS 通过 [data-color-scheme="dark"] 等属性选择器接管色调
  // colorScheme === 'auto' 或缺省时去掉属性，让浏览器 prefers-color-scheme 媒体查询生效
  // 这一段必须放在 result 之后，所以稍后用 useEffect

  // 渲染区与编辑器的引用，用于滚动同步（仅 split 模式）
  // hydrate 不在 ref 回调里跑 —— 用单独的 useEffect 监听 safeHtml 变化，便于 cancel
  const outputRef = useCallback((el: HTMLElement | null) => {
    outputElRef.current = el;
  }, []);
  const editorWrapperRef = useCallback((el: HTMLElement | null) => {
    editorWrapperElRef.current = el;
  }, []);

  // 渲染产物 —— 仅当有 markdown 时才跑
  const result = useMemo(
    () => (markdown != null ? render(markdown, { themeDefaults: themeDefaults(themeId) }) : null),
    [markdown, themeId],
  );

  // 注入到 DOM 的最终 HTML —— 先未高亮、后异步替换为高亮版本
  const [safeHtml, setSafeHtml] = useState<string>('');
  useEffect(() => {
    if (!result) {
      setSafeHtml('');
      return;
    }
    setSafeHtml(sanitize(result.html));
    let cancelled = false;
    highlightHtml(result.html)
      .then((h) => {
        if (cancelled) return;
        if (h === result.html) return;
        setSafeHtml(sanitize(h));
      })
      .catch((err) => {
        console.warn('[mdview] highlight failed:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [result]);

  // safeHtml 变更后：等浏览器把新 DOM 挂上，再跑扩展 hydrate（math / mermaid）
  // 用 cancel token 防止上一次在飞的 hydrate 把内容写到已经被替换掉的旧节点里
  useEffect(() => {
    if (!safeHtml) return;
    const token: CancelToken = { cancelled: false };
    // requestAnimationFrame 确保 dangerouslySetInnerHTML 把新内容刷到 DOM 后再开始
    const raf = requestAnimationFrame(() => {
      const el = outputElRef.current;
      if (el) void hydrateExtensions(el, token);
    });
    return () => {
      token.cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [safeHtml]);

  // 文档标题更新
  useEffect(() => {
    document.title = result?.meta.title ?? filePath ?? 'mdview';
  }, [result?.meta.title, filePath]);

  // colorScheme 强制色彩模式 —— 把作者意图反映到 <html data-color-scheme>
  useEffect(() => {
    const scheme = result?.meta.colorScheme;
    if (scheme === 'light' || scheme === 'dark') {
      document.documentElement.dataset.colorScheme = scheme;
    } else {
      delete document.documentElement.dataset.colorScheme;
    }
  }, [result?.meta.colorScheme]);

  // 加载文件 —— 各入口（菜单、拖拽、Rust 推送、最近文件）共用这个
  const loadFile = useCallback(async (path: string) => {
    try {
      const content = await readMarkdownFile(path);
      setFilePath(path);
      setMarkdown(content);
      setRecents(pushRecent(path));
    } catch (err) {
      console.error('Failed to load file:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorToast(`Couldn't open ${path.split('/').pop() ?? path}: ${msg}`);
    }
  }, []);

  const handleOpen = useCallback(async () => {
    const selected = await openFileDialog();
    if (!selected) return;
    await loadFile(selected);
  }, [loadFile]);

  /** 打开文件夹模式（只在 Tauri runtime 下可用） */
  const handleOpenFolder = useCallback(async () => {
    const result = await browseFolder();
    if (!result) return;
    setFolder(result);
    if (result.files[0]) await loadFile(result.files[0].path);
  }, [loadFile]);

  /** 保存当前 markdown：有 filePath 直接覆盖；否则弹另存为 */
  const handleSave = useCallback(async (): Promise<void> => {
    if (markdown == null) return;
    let target = filePath;
    // dev 浏览器模式没有真实路径或者 filePath 还是 file.name 这种伪路径时，弹另存为
    if (!target || !isTauriRuntime()) {
      const picked = await saveFileDialog({
        defaultPath: filePath ?? 'untitled.md',
        filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
      });
      if (!picked) return;
      target = picked;
    }
    try {
      await writeTextToFile(target, markdown);
      setFilePath(target);
      setRecents(pushRecent(target));
    } catch (err) {
      console.error('Save failed:', err);
    }
  }, [markdown, filePath]);

  // 来自 Rust 端的 open-path 事件（双击 .md 启动）
  useEffect(() => {
    const off = listenForOpenedPath((path) => {
      void loadFile(path);
    });
    return () => off?.();
  }, [loadFile]);

  // 外部编辑器修改了当前打开的文件 → 自动 reload
  // 仅 Tauri runtime 下生效；用户在 split 模式编辑时通过比较 markdown 内容避免覆盖
  useEffect(() => {
    if (!filePath || !isTauriRuntime()) return;
    const off = watchFileMtime(filePath, async () => {
      try {
        const fresh = await readMarkdownFile(filePath);
        // 只有外部内容确实和当前不同时才更新（避免我们自己保存触发的环回）
        if (fresh !== markdown) {
          setMarkdown(fresh);
        }
      } catch {
        // ignore
      }
    });
    return () => off?.();
  }, [filePath, markdown]);

  // 来自 Rust 原生菜单的事件 —— 把菜单点击桥接到对应 handler
  useEffect(() => {
    const off = listenForMenuEvents((id) => {
      switch (id) {
        case 'open':
          void handleOpen();
          break;
        case 'open-folder':
          void handleOpenFolder();
          break;
        case 'save':
          void handleSave();
          break;
        case 'export':
          if (markdown != null) setExportOpen(true);
          break;
        case 'palette':
          setPaletteOpen(true);
          break;
        case 'zen':
          setZenMode((v) => !v);
          break;
        case 'cycle-view':
          if (markdown != null) {
            setViewMode((m) => {
              const idx = VIEW_MODES.indexOf(m);
              return VIEW_MODES[(idx + 1) % VIEW_MODES.length]!;
            });
          }
          break;
        case 'docs':
          window.open('https://mdview.sh/docs', '_blank');
          break;
        case 'check-updates':
          // 手动触发: 比启动 5s 自动检查更直观,适合排错。
          // 控制台会有 "[mdview] updater:" 系列日志,UI 也给一条 toast。
          setErrorToast('Checking for updates…');
          void checkForUpdate().then((u) => {
            if (u) {
              setAvailableUpdate(u);
              setErrorToast(null);
            } else {
              setErrorToast("You're on the latest version.");
            }
          });
          break;
      }
    });
    return () => off?.();
  }, [handleOpen, handleOpenFolder, handleSave, markdown]);

  // 键盘快捷键：⌘O 打开 / ⌘E 导出 / ⌘\ 在三种视图间循环
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === 'o') {
        e.preventDefault();
        handleOpen();
      } else if (key === 'e') {
        e.preventDefault();
        if (markdown != null) setExportOpen(true);
      } else if (key === 's') {
        e.preventDefault();
        void handleSave();
      } else if (key === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      } else if (key === '.') {
        // ⌘. → 全屏 zen 模式
        e.preventDefault();
        setZenMode((v) => !v);
      } else if (key === '\\') {
        e.preventDefault();
        if (markdown == null) return;
        setViewMode((m) => {
          const idx = VIEW_MODES.indexOf(m);
          return VIEW_MODES[(idx + 1) % VIEW_MODES.length]!;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleOpen, handleSave, markdown]);

  // Esc 退出 zen 模式
  useEffect(() => {
    if (!zenMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setZenMode(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zenMode]);

  // body class 反映 zen 状态，CSS 据此隐藏 chrome
  useEffect(() => {
    document.body.classList.toggle('mdv-zen', zenMode);
  }, [zenMode]);

  // 拖拽：实时反馈 + 落点接住文件
  useEffect(() => {
    let dragCounter = 0;
    const onDragEnter = (e: DragEvent) => {
      // 只有真的拖了文件才显示 overlay（不响应窗口内拖文字等）
      if (!e.dataTransfer?.types.includes('Files')) return;
      dragCounter++;
      setDragging(true);
    };
    const onDragLeave = () => {
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        setDragging(false);
      }
    };
    const onDragOver = (e: DragEvent) => {
      // preventDefault 才能触发 drop 事件
      if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
    };
    const onDrop = async (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setDragging(false);
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      const text = await file.text();
      // dev 浏览器模式拿不到真实路径，用 file.name 作为占位
      setFilePath(file.name);
      setMarkdown(text);
      setRecents(pushRecent(file.name));
    };
    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, []);

  return (
    <>
      {/* 工具栏只在有文件时显示，欢迎页有自己的入口按钮 */}
      {markdown != null && (
        <Toolbar>
          <button
            type="button"
            className="mdv-toolbar-btn"
            title="Open Markdown file (⌘O)"
            onClick={handleOpen}
          >
            <span aria-hidden>📄</span>
            <span className="mdv-toolbar-btn-label">Open</span>
          </button>
          <button
            type="button"
            className="mdv-toolbar-btn"
            title="Open folder"
            onClick={handleOpenFolder}
          >
            <span aria-hidden>📁</span>
            <span className="mdv-toolbar-btn-label">Folder</span>
          </button>
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
          <button
            type="button"
            className={`mdv-toolbar-btn${wideMode ? ' is-active' : ''}`}
            title={
              wideMode
                ? 'Wide layout on — click for narrow column'
                : 'Wide layout off — click to fill window'
            }
            aria-pressed={wideMode}
            onClick={() => setWideMode((v) => !v)}
          >
            <span aria-hidden>⇔</span>
            <span className="mdv-toolbar-btn-label">Wide</span>
          </button>
          <button
            type="button"
            className="mdv-toolbar-btn"
            title="Export as .mdv.html (⌘E)"
            onClick={() => setExportOpen(true)}
          >
            <span aria-hidden>⬇️</span>
            <span className="mdv-toolbar-btn-label">Export</span>
          </button>
          <ThemeSwitcher value={themeId} onChange={setThemeId} />
        </Toolbar>
      )}

      {folder && markdown != null && (
        <FolderSidebar
          root={folder.root}
          files={folder.files}
          activePath={filePath}
          onPick={(f) => void loadFile(f.path)}
          onClose={() => setFolder(null)}
        />
      )}

      {markdown == null ? (
        <Welcome
          onOpen={handleOpen}
          recents={recents}
          onPickRecent={(f) => void loadFile(f.path)}
        />
      ) : (
        <div className={`mdv-stage mdv-mode-${viewMode}`}>
          {(viewMode === 'split' || viewMode === 'source') && (
            <div className="mdv-editor-wrap" ref={editorWrapperRef}>
              <Editor value={markdown} onChange={setMarkdown} />
            </div>
          )}
          {(viewMode === 'split' || viewMode === 'read') && (
            <div className="mdv-output-wrap">
              {result?.meta.readingTime && <ReadingStats markdown={markdown} show={true} />}
              <main
                id="mdview-output"
                ref={outputRef}
                dangerouslySetInnerHTML={{ __html: safeHtml }}
              />
            </div>
          )}
        </div>
      )}

      {result && <TocSidebar headings={result.headings} toc={result.meta.toc} />}

      <DropOverlay visible={dragging} />

      <Onboarding active={markdown != null} />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onOpen={handleOpen}
        onExport={() => setExportOpen(true)}
        onSave={handleSave}
        onSetTheme={setThemeId}
        onSetViewMode={setViewMode}
        onPickRecent={(f) => void loadFile(f.path)}
        recents={recents}
        hasFile={markdown != null}
      />

      {exportOpen && markdown != null && (
        <ExportDialog
          markdown={markdown}
          defaultThemeId={themeId}
          filePath={filePath}
          onClose={() => setExportOpen(false)}
        />
      )}

      {errorToast && (
        <div className="mdv-toast" role="status" aria-live="polite">
          {errorToast}
        </div>
      )}

      {availableUpdate && (
        <div className="mdv-update-banner" role="status">
          <span className="mdv-update-text">
            New version <strong>{availableUpdate.version}</strong> available
          </span>
          <button
            type="button"
            className="mdv-update-btn"
            disabled={installing}
            onClick={async () => {
              setInstalling(true);
              try {
                await availableUpdate.install();
                // relaunch 会接管,下面这行实际不会执行
              } catch (err) {
                setInstalling(false);
                const msg = err instanceof Error ? err.message : String(err);
                setErrorToast(`Update failed: ${msg}`);
              }
            }}
          >
            {installing ? 'Installing…' : 'Install & restart'}
          </button>
          <button
            type="button"
            className="mdv-update-dismiss"
            aria-label="Dismiss update notice"
            onClick={() => setAvailableUpdate(null)}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
