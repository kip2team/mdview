// mdview 元数据 schema 实现 —— 见 docs/02-Format-Spec.md §3.4
// 设计要点：把 front matter 升格为"演出说明"（Metadata as Stage Direction）

/** 作者信息 */
export interface AuthorInfo {
  name: string;
  url?: string;
  avatar?: string;
}

/** 品牌色 */
export interface BrandColors {
  primary?: string;
  accent?: string;
  logo?: string;
}

/** 目录配置 */
export interface TocConfig {
  position?: 'left' | 'right';
  /** 目录显示的最深标题层级，1-6 */
  depth?: number;
}

/** 分享 / OG 字段 */
export interface OgConfig {
  image?: string | 'auto';
  title?: string;
  description?: string;
}

/** mdview 元数据完整结构 */
export interface MdviewMetadata {
  // 核心字段
  mdview?: number;
  title?: string;
  description?: string;
  lang?: string;
  author?: string | AuthorInfo;
  created?: string;
  updated?: string;

  // 演出 / 样式字段
  theme?: string;
  /**
   * 强制色彩模式。
   * - 'light' / 'dark'：作者意志，无视读者系统
   * - 'auto'（默认）：跟随读者 prefers-color-scheme
   * 实现：viewer 在 <html> 上加 data-color-scheme 属性，主题 CSS 用属性选择器接管 @media 查询
   */
  colorScheme?: 'light' | 'dark' | 'auto';
  font?: string;
  fontSize?: string;
  lineHeight?: number;
  maxWidth?: string;
  codeTheme?: string;
  brand?: BrandColors;
  cover?: string;

  // 行为 / 增强字段
  toc?: boolean | TocConfig;
  extensions?: string[];
  numberedHeadings?: boolean;
  printable?: boolean;
  readingTime?: boolean;

  // 分享 / OG 字段（YAML 中是 og.image，JS 中映射成 og.image 或 og: { image }）
  og?: OgConfig;
  canonical?: string;

  // 任意自定义命名空间字段保留
  [key: string]: unknown;
}

/** 全局默认值 —— 优先级最低 */
export const DEFAULT_METADATA: Required<
  Pick<MdviewMetadata, 'mdview' | 'lang' | 'theme' | 'toc' | 'extensions'>
> = {
  mdview: 1,
  lang: 'en',
  theme: 'default',
  toc: false,
  extensions: [],
};

/**
 * 校验并规范化 front matter 解析出来的对象。
 * 不识别的字段保留（自定义命名空间）。
 */
export function parseMetadata(raw: Record<string, unknown>): MdviewMetadata {
  const meta: MdviewMetadata = { ...raw };

  // 处理 og.image 这种点号 key
  if (typeof raw['og.image'] !== 'undefined') {
    meta.og = { ...(meta.og ?? {}), image: raw['og.image'] as string };
    delete (meta as Record<string, unknown>)['og.image'];
  }
  if (typeof raw['og.title'] !== 'undefined') {
    meta.og = { ...(meta.og ?? {}), title: raw['og.title'] as string };
    delete (meta as Record<string, unknown>)['og.title'];
  }
  if (typeof raw['og.description'] !== 'undefined') {
    meta.og = { ...(meta.og ?? {}), description: raw['og.description'] as string };
    delete (meta as Record<string, unknown>)['og.description'];
  }
  if (typeof raw['toc.position'] !== 'undefined' || typeof raw['toc.depth'] !== 'undefined') {
    const tocBase = typeof meta.toc === 'object' ? meta.toc : {};
    meta.toc = {
      ...tocBase,
      ...(raw['toc.position'] ? { position: raw['toc.position'] as 'left' | 'right' } : {}),
      ...(raw['toc.depth'] ? { depth: Number(raw['toc.depth']) } : {}),
    };
    delete (meta as Record<string, unknown>)['toc.position'];
    delete (meta as Record<string, unknown>)['toc.depth'];
  }

  return meta;
}

/**
 * 元数据合并 —— 优先级见 02 文档 §3.5：
 * URL 参数 > front matter > 主题默认 > 全局默认
 *
 * 实现上：调用方按从高到低传入，本函数从低到高 merge。
 */
export function mergeMetadata(
  ...layers: Array<Partial<MdviewMetadata> | undefined>
): MdviewMetadata {
  const merged: MdviewMetadata = { ...DEFAULT_METADATA };
  for (const layer of layers) {
    if (!layer) continue;
    for (const [key, value] of Object.entries(layer)) {
      if (value === undefined || value === null) continue;
      // 嵌套对象浅合并 —— brand / og / toc 等
      if (
        typeof value === 'object' &&
        !Array.isArray(value) &&
        typeof merged[key] === 'object' &&
        merged[key] !== null &&
        !Array.isArray(merged[key])
      ) {
        merged[key] = { ...(merged[key] as object), ...(value as object) };
      } else {
        merged[key] = value;
      }
    }
  }
  return merged;
}
