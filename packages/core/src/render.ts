// mdview 引擎渲染入口
// 输入：原始 markdown 字符串（可含 YAML front matter）
// 输出：HTML 片段 + 解析后的元数据 + 标题树
import MarkdownIt, { type Options as MarkdownItOptions } from 'markdown-it';
import { parseFrontMatter } from './front-matter.js';
import { parseMetadata, mergeMetadata, type MdviewMetadata } from './metadata.js';
import { applyExtensions } from './extensions/index.js';

/** 渲染选项 */
export interface RenderOptions {
  /** 覆盖层元数据（来自 URL 参数等更高优先级源），优先级 > front matter */
  override?: Partial<MdviewMetadata>;
  /** 主题默认值层（由主题包提供） */
  themeDefaults?: Partial<MdviewMetadata>;
  /** 是否对 HTML 输出启用 sanitize（暂不实现，留接口） */
  sanitize?: boolean;
  /** markdown-it 选项 —— 默认开启 GFM 风格 */
  markdownIt?: MarkdownItOptions;
  /**
   * 显式指定本次渲染要启用的扩展 ID（最高优先级）；
   * 若未传，则取合并后元数据 meta.extensions。
   */
  extensions?: readonly string[];
}

/** 渲染结果 */
export interface RenderResult {
  /** 渲染后的 HTML 片段，不含 <html>/<body> 等外壳 */
  html: string;
  /** 合并后的最终元数据 */
  meta: MdviewMetadata;
  /** 原始 markdown 正文（去掉 front matter） */
  body: string;
  /** 文档标题树（h1-h6），用于生成 TOC */
  headings: Heading[];
}

/** 标题项 */
export interface Heading {
  /** 1-6 */
  level: number;
  /** 已 slugify 的锚点 id */
  id: string;
  /** 纯文本标题内容 */
  text: string;
}

/**
 * 渲染单个 markdown 文档。
 *
 * @example
 * const { html, meta } = render('# Hello', { themeDefaults: { theme: 'medium' } });
 */
export function render(markdown: string, options: RenderOptions = {}): RenderResult {
  // 1. 解析 front matter（用浏览器友好的 yaml 解析，避开 gray-matter 的 Buffer 依赖）
  const parsed = parseFrontMatter(markdown);
  const fmMeta = parseMetadata(parsed.data);

  // 2. 按 02 文档 §3.5 优先级合并：override > front matter > themeDefaults > defaults
  const meta = mergeMetadata(options.themeDefaults, fmMeta, options.override);

  // 3. 初始化 markdown-it
  const md = new MarkdownIt({
    html: true, // 允许行内 HTML（后续需要 sanitize）
    linkify: true, // 自动识别裸 URL
    typographer: true, // 智能引号 / dash
    breaks: false,
    ...options.markdownIt,
  });

  // 4. 应用扩展 —— 优先级：options.extensions > meta.extensions > []
  const extensionIds = options.extensions ?? meta.extensions ?? [];
  applyExtensions(md, extensionIds);

  // 5. 收集标题，注入 id 锚点
  const headings: Heading[] = [];
  injectHeadingAnchors(md, headings);

  // 6. 渲染
  const html = md.render(parsed.content);

  return {
    html,
    meta,
    body: parsed.content,
    headings,
  };
}

/**
 * 修改 markdown-it 的 heading 渲染器，给每个标题加上稳定的 id，并把标题信息收集到 headings 数组。
 */
function injectHeadingAnchors(md: MarkdownIt, headings: Heading[]): void {
  const slugCounts = new Map<string, number>();

  md.renderer.rules.heading_open = (tokens, idx, _options, _env, self) => {
    const token = tokens[idx];
    if (!token) return self.renderToken(tokens, idx, _options);
    const inlineToken = tokens[idx + 1];
    const text = inlineToken && inlineToken.type === 'inline' ? inlineToken.content : '';
    const baseSlug = slugify(text);
    const count = slugCounts.get(baseSlug) ?? 0;
    const id = count === 0 ? baseSlug : `${baseSlug}-${count}`;
    slugCounts.set(baseSlug, count + 1);

    token.attrSet('id', id);
    headings.push({
      level: parseInt(token.tag.slice(1), 10),
      id,
      text,
    });

    return self.renderToken(tokens, idx, _options);
  };
}

/**
 * 简易 slugify —— 中英文均可，去掉 markdown 行内语法的 *、`、[]() 等
 */
export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/`+/g, '')
      .replace(/\*+/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .trim()
      // 保留 unicode 字母与数字（含中文），其他用连字符替换
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '') || 'section'
  );
}
