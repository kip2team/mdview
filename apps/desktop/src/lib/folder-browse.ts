// 文件夹浏览 —— 走自家 invoke('list_markdown_dir', {root}), Rust 端递归列 .md/.markdown/.mdv
// 不用 @tauri-apps/plugin-fs::readDir, 那个受前端 scope 限制读不到任意目录;
// Rust 端 std::fs 由 OS ACL/TCC 控制, macOS 首次访问受保护目录时会弹原生授权框。
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

const isTauri = (): boolean => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

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
    // dev 浏览器模式没有真实目录访问能力，直接返回空
    console.warn('[mdview] folder browse only works in Tauri runtime');
    return null;
  }
  const selected = await open({ directory: true, multiple: false });
  if (typeof selected !== 'string') return null;
  const files = await invoke<FolderEntry[]>('list_markdown_dir', { root: selected });
  return { root: selected, files };
}
