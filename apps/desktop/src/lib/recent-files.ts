// 最近文件持久化 —— localStorage 存最多 8 个最近打开的 .md 路径
// 路径作为唯一键；重复打开时把它顶到列表前
const STORAGE_KEY = 'mdview:recent';
const MAX_RECENTS = 8;

export interface RecentFile {
  /** 绝对路径（Tauri 模式下）或文件名（dev 浏览器模式 fallback） */
  path: string;
  /** 显示名 —— 取 path 末尾段 */
  name: string;
  /** 上次打开时间，毫秒时间戳 */
  lastOpened: number;
}

export function loadRecents(): RecentFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is RecentFile =>
          !!x &&
          typeof (x as RecentFile).path === 'string' &&
          typeof (x as RecentFile).name === 'string' &&
          typeof (x as RecentFile).lastOpened === 'number',
      )
      .slice(0, MAX_RECENTS);
  } catch {
    return [];
  }
}

export function pushRecent(path: string): RecentFile[] {
  const name = path.split(/[\\/]/).pop() || path;
  const now = Date.now();
  const existing = loadRecents().filter((f) => f.path !== path);
  const next: RecentFile[] = [{ path, name, lastOpened: now }, ...existing].slice(0, MAX_RECENTS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage 不可用时静默
  }
  return next;
}

export function clearRecents(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
