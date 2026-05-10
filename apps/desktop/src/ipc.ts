// 与 Rust 端的桥接 —— 用 Tauri 官方插件
// 在浏览器里跑（vite dev 时）这些函数会回退到 input[type=file]，方便不装 Rust 也能调试 UI
import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile, stat } from '@tauri-apps/plugin-fs';
import { listen } from '@tauri-apps/api/event';

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

const isTauri = (): boolean =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/** 弹出系统文件选择框，返回选中的 markdown 文件绝对路径 */
export async function openFileDialog(): Promise<string | undefined> {
  if (isTauri()) {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'mdv', 'mdv.html'] }],
    });
    return typeof selected === 'string' ? selected : undefined;
  }
  // dev fallback：用一个隐藏 input 模拟
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.markdown,.mdv,.html';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(undefined);
      // dev 模式下把 File 直接读出来塞进去 —— 暂用 file.name 作为伪路径
      (window as unknown as { __mdview_devFile?: File }).__mdview_devFile = file;
      resolve(file.name);
    };
    input.click();
  });
}

/** 读取 markdown 文本 */
export async function readMarkdownFile(path: string): Promise<string> {
  if (isTauri()) {
    return readTextFile(path);
  }
  // dev fallback：从 openFileDialog 暂存的 File 拿内容
  const cached = (window as unknown as { __mdview_devFile?: File }).__mdview_devFile;
  if (cached && cached.name === path) {
    return cached.text();
  }
  throw new Error(`dev mode: cannot read ${path}`);
}

/**
 * 监听由 Rust 端推送的 "mdview://open-path" 事件 —— 用于"双击 .md 启动应用"场景。
 * Rust 端的实现见 src-tauri/src/lib.rs。
 */
export function listenForOpenedPath(handler: (path: string) => void): (() => void) | undefined {
  if (!isTauri()) return undefined;
  let unlistenFn: (() => void) | undefined;
  listen<string>('mdview://open-path', (event) => handler(event.payload)).then((un) => {
    unlistenFn = un;
  });
  return () => unlistenFn?.();
}

/** 菜单项 id —— 与 Rust 端 MenuItemBuilder 的 with_id 对齐 */
export type MenuId =
  | 'open'
  | 'open-folder'
  | 'save'
  | 'export'
  | 'palette'
  | 'zen'
  | 'cycle-view'
  | 'docs';

/** 监听 native 菜单点击 —— 各菜单 id 见 src-tauri/src/lib.rs */
export function listenForMenuEvents(handler: (id: MenuId) => void): (() => void) | undefined {
  if (!isTauri()) return undefined;
  let unlistenFn: (() => void) | undefined;
  listen<string>('mdview://menu', (event) => handler(event.payload as MenuId)).then((un) => {
    unlistenFn = un;
  });
  return () => unlistenFn?.();
}

/** 轮询 mtime 检测外部修改 —— 简单可靠，每 2 秒一次 */
export function watchFileMtime(
  path: string,
  onChange: () => void,
): (() => void) | undefined {
  if (!isTauri()) return undefined;
  let lastMtime: number | undefined;
  let stopped = false;
  const tick = async () => {
    if (stopped) return;
    try {
      const info = await stat(path);
      const m = info.mtime ? new Date(info.mtime).getTime() : 0;
      if (lastMtime !== undefined && m > lastMtime) {
        onChange();
      }
      lastMtime = m;
    } catch {
      // 文件被删 / 临时不可读 —— 忽略，下次轮询再试
    }
  };
  void tick(); // 立即跑一次记录初始 mtime
  const interval = setInterval(() => void tick(), 2000);
  return () => {
    stopped = true;
    clearInterval(interval);
  };
}

/**
 * 弹出"另存为"对话框，返回用户选中的目标路径。
 * 在 dev 浏览器模式下回退到 prompt + 触发下载（路径其实没用上，仅作占位）。
 */
export async function saveFileDialog(opts: {
  defaultPath?: string;
  /** 给对话框的扩展名过滤器 */
  filters?: { name: string; extensions: string[] }[];
}): Promise<string | undefined> {
  if (isTauri()) {
    const result = await save({
      defaultPath: opts.defaultPath,
      filters: opts.filters,
    });
    return typeof result === 'string' ? result : undefined;
  }
  // dev fallback：让用户输个文件名，调用方拿到伪路径后通过 download 触发下载
  const name = window.prompt('Save as (dev mode, will trigger browser download)', opts.defaultPath ?? 'export.mdv.html');
  return name ?? undefined;
}

/** 是否在 Tauri 运行时（与系统文件交互可用） */
export function isTauriRuntime(): boolean {
  return isTauri();
}

/**
 * 写文本文件到指定绝对路径。dev 模式下用浏览器 download 模拟。
 */
export async function writeTextToFile(path: string, content: string): Promise<void> {
  if (isTauri()) {
    await writeTextFile(path, content);
    return;
  }
  // dev fallback：触发浏览器下载，path 末尾段做文件名
  const filename = path.split(/[\\/]/).pop() || 'export.mdv.html';
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
