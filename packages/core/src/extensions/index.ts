// mdview 扩展注册表
// 内置扩展通过 ID 启用，第三方可以用 registerExtension 注册自己的 markdown-it 插件
import type MarkdownIt from 'markdown-it';
import { colorExtension } from './color.js';
import { calloutExtension } from './callout.js';
import { mathExtension } from './math.js';
import { mermaidExtension } from './mermaid.js';

/** 扩展工厂签名 —— 接收 markdown-it 实例，原地修改它 */
export type ExtensionFactory = (md: MarkdownIt) => void;

/** 内置扩展，永远存在 */
export const BUILT_IN_EXTENSIONS: Readonly<Record<string, ExtensionFactory>> = Object.freeze({
  'mdv:color': colorExtension,
  'mdv:callout': calloutExtension,
  'mdv:math': mathExtension,
  'mdv:mermaid': mermaidExtension,
});

/** 第三方注册表 —— 用全局 Map 是为了支持 ESM 多次 import 场景 */
const externalRegistry = new Map<string, ExtensionFactory>();

/**
 * 注册一个第三方扩展。
 *
 * 命名规范：
 * - 推荐用 `<author>:<name>` 形式，避免与内置 `mdv:*` 冲突
 * - ID 不能以 `mdv:` 开头（保留给官方）
 * - 同一 ID 重复注册会抛错（防止覆盖既有扩展）
 *
 * @example
 * import { registerExtension } from '@mdview/core';
 *
 * registerExtension('myorg:badge', (md) => {
 *   md.inline.ruler.after('escape', 'myorg-badge', (state, silent) => {
 *     // ... markdown-it 插件实现
 *     return false;
 *   });
 * });
 */
export function registerExtension(id: string, factory: ExtensionFactory): void {
  if (id.startsWith('mdv:')) {
    throw new Error(
      `Extension id "${id}" uses reserved prefix "mdv:". Use a different namespace.`,
    );
  }
  if (BUILT_IN_EXTENSIONS[id] || externalRegistry.has(id)) {
    throw new Error(`Extension "${id}" is already registered.`);
  }
  externalRegistry.set(id, factory);
}

/** 反注册（主要给测试用） */
export function unregisterExtension(id: string): boolean {
  return externalRegistry.delete(id);
}

/** 列出所有已注册扩展 ID（内置 + 第三方） */
export function listExtensions(): string[] {
  return [...Object.keys(BUILT_IN_EXTENSIONS), ...externalRegistry.keys()];
}

/**
 * 应用扩展到 markdown-it 实例。
 * 优先在内置注册表查找，再查第三方；找不到的 ID 静默忽略
 * （兼容承诺：旧文档启用了某个扩展但当前环境没装，不会爆炸）。
 */
export function applyExtensions(md: MarkdownIt, ids: readonly string[]): void {
  for (const id of ids) {
    const ext = BUILT_IN_EXTENSIONS[id] ?? externalRegistry.get(id);
    if (ext) ext(md);
  }
}

export { colorExtension } from './color.js';
export { calloutExtension } from './callout.js';
export { mathExtension } from './math.js';
export { mermaidExtension } from './mermaid.js';
