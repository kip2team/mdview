// 文件夹浏览 —— Tauri 用 readDir 列 .md；dev 浏览器模式回退到 input[type=file] webkitdirectory
// Tauri 端：选文件夹后递归列出所有 .md / .markdown / .mdv，限定 200 个文件以防卡死
import { readDir, type DirEntry } from '@tauri-apps/plugin-fs';
import { open } from '@tauri-apps/plugin-dialog';

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

const isTauri = (): boolean => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const MAX_ENTRIES = 200;
const MD_EXT = /\.(md|markdown|mdv)$/i;

export interface FolderEntry {
  name: string;
  path: string;
  /** 相对于根的路径，便于侧边栏分组 */
  relativePath: string;
}

/** 弹出系统选择文件夹，返回根路径 + .md 文件列表（递归） */
export async function browseFolder(): Promise<{
  root: string;
  files: FolderEntry[];
} | null> {
  if (!isTauri()) {
    // dev 浏览器模式不支持递归读真实文件夹，给个空兜底
    console.warn('[mdview] folder browse only works in Tauri runtime');
    return null;
  }
  const selected = await open({ directory: true, multiple: false });
  if (typeof selected !== 'string') return null;
  const files = await collectMarkdown(selected, '');
  return { root: selected, files: files.slice(0, MAX_ENTRIES) };
}

async function collectMarkdown(dir: string, relative: string): Promise<FolderEntry[]> {
  const entries: DirEntry[] = await readDir(dir);
  const out: FolderEntry[] = [];
  for (const e of entries) {
    if (e.name?.startsWith('.') || e.name?.startsWith('node_modules')) continue;
    const childPath = `${dir}/${e.name}`;
    const childRel = relative ? `${relative}/${e.name}` : e.name!;
    if (e.isDirectory) {
      const sub = await collectMarkdown(childPath, childRel);
      out.push(...sub);
    } else if (e.isFile && e.name && MD_EXT.test(e.name)) {
      out.push({ name: e.name, path: childPath, relativePath: childRel });
    }
    if (out.length >= MAX_ENTRIES) break;
  }
  return out;
}
