// .mdv.html 三形态序列化与解析
// 形态规格见 docs/02-Format-Spec.md §2
import {
  MDVIEW_OUTPUT_ID,
  MDVIEW_PROTOCOL_VERSION,
  MDVIEW_SOURCE_ID,
  MDVIEW_SOURCE_SCRIPT_TYPE,
} from '@mdview/core';

/** 三种 .mdv.html 形态 */
export type MdvForm = 'minimal' | 'progressive' | 'standalone';

/** 引擎引用 —— CDN URL 或内嵌脚本内容 */
export interface EngineRef {
  /** CDN URL（minimal / progressive 用） */
  url?: string;
  /** 内嵌 JS 源码（standalone 用） */
  inline?: string;
  /** SRI integrity（仅 pinned 版本可用） */
  integrity?: string;
}

/** 主题引用 —— CSS URL 或内嵌内容 */
export interface ThemeRef {
  id: string;
  /** CSS URL（minimal / progressive 用） */
  url?: string;
  /** 内嵌 CSS 源码（standalone 用） */
  inline?: string;
  /** SRI integrity */
  integrity?: string;
}

/** 导出 .mdv.html 的选项 */
export interface ToMdvHtmlOptions {
  /** 形态 —— 默认 progressive */
  form?: MdvForm;
  /** 文档标题（写入 <title>），默认从 markdown 第一个 h1 提取 */
  title?: string;
  /** 语言（写入 html lang）默认 en */
  lang?: string;
  /** 引擎引用 */
  engine: EngineRef;
  /** 主题引用 */
  theme: ThemeRef;
  /** 仅 progressive 用：服务端预渲染好的 HTML 片段 */
  prerenderedHtml?: string;
  /** 是否注入 charset / viewport 等基础 meta，默认 true */
  baseMeta?: boolean;
}

/** 从 .mdv.html 解析出来的结果 */
export interface FromMdvHtmlResult {
  /** 协议版本 */
  protocolVersion: number;
  /** 文档标题（来自 <title>） */
  title: string | undefined;
  /** 语言 */
  lang: string | undefined;
  /** 原始 markdown 源码 */
  source: string;
  /** 引擎 URL（standalone 形态返回 inline:true） */
  engine: { url?: string; inline: boolean };
  /** 主题 URL（同上） */
  theme: { url?: string; inline: boolean };
}

/** 把 markdown 源序列化成 .mdv.html 字符串 */
export function toMdvHtml(markdown: string, options: ToMdvHtmlOptions): string {
  const form = options.form ?? 'progressive';
  const lang = options.lang ?? 'en';
  const title = options.title ?? extractTitle(markdown) ?? 'Untitled';
  const baseMeta = options.baseMeta ?? true;

  const head: string[] = [];
  if (baseMeta) {
    head.push('<meta charset="UTF-8">');
    head.push('<meta name="viewport" content="width=device-width, initial-scale=1">');
  }
  head.push(`<title>${escapeHtml(title)}</title>`);
  head.push(buildThemeTag(options.theme));
  head.push(buildEngineTag(options.engine));

  // 把源码包到 <script type="text/x-mdview"> —— 注意把 </script> 拆开避免提前闭合
  const safeSource = markdown.replace(/<\/script>/gi, '<\\/script>');
  const sourceTag =
    `<script type="${MDVIEW_SOURCE_SCRIPT_TYPE}" id="${MDVIEW_SOURCE_ID}">\n` +
    safeSource +
    `\n</script>`;

  // 把 prerendered HTML 写进 output 容器：
  // - progressive：必写（首屏即可见，无需等引擎加载）
  // - standalone：必写（不引用任何 CDN 引擎，prerendered 就是显示内容本身）
  // - minimal：不写（minimal 体积最小，靠引擎实时渲染 source）
  const shouldEmbedPrerendered =
    (form === 'progressive' || form === 'standalone') && !!options.prerenderedHtml;
  const outputTag = shouldEmbedPrerendered
    ? `<main id="${MDVIEW_OUTPUT_ID}">\n${options.prerenderedHtml}\n</main>`
    : `<main id="${MDVIEW_OUTPUT_ID}"></main>`;

  return [
    '<!DOCTYPE html>',
    `<html lang="${escapeAttr(lang)}" data-mdview="${MDVIEW_PROTOCOL_VERSION}">`,
    '<head>',
    ...head.map((s) => '  ' + s),
    '</head>',
    '<body>',
    '  ' + sourceTag,
    '  ' + outputTag,
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

/** 从 .mdv.html 字符串里反向解析出 markdown 源 + 元信息 */
export function fromMdvHtml(html: string): FromMdvHtmlResult {
  const protocolVersion = matchAttr(html, /<html\b[^>]*\bdata-mdview="(\d+)"/i);
  const lang = matchAttr(html, /<html\b[^>]*\blang="([^"]+)"/i);
  const title = matchInner(html, /<title>([\s\S]*?)<\/title>/i);

  const sourceMatch = html.match(
    new RegExp(`<script[^>]*type="${MDVIEW_SOURCE_SCRIPT_TYPE}"[^>]*>([\\s\\S]*?)<\\/script>`, 'i'),
  );
  const source = sourceMatch ? sourceMatch[1]!.replace(/<\\\/script>/gi, '</script>').trim() : '';

  // 引擎 / 主题 URL 嗅探（粗粒度，容忍多种写法）
  const engineUrl = matchAttr(html, /<script[^>]*src="([^"]*\/(?:r|engine)\/[^"]+\.js)"/i);
  const engineInline = !engineUrl && /<script(?![^>]*src=)[^>]*>[\s\S]{200,}<\/script>/.test(html);

  const themeUrl =
    matchAttr(html, /<link[^>]*\bdata-mdview-theme[^>]*\bhref="([^"]+)"/i) ??
    matchAttr(html, /<link[^>]*\bhref="([^"]*\/themes\/[^"]+\.css)"/i);
  const themeInline = !themeUrl && /<style[^>]*>[\s\S]{200,}<\/style>/.test(html);

  return {
    protocolVersion: protocolVersion ? parseInt(protocolVersion, 10) : MDVIEW_PROTOCOL_VERSION,
    title: title ? decodeEntities(title) : undefined,
    lang: lang ?? undefined,
    source,
    engine: { url: engineUrl, inline: engineInline },
    theme: { url: themeUrl, inline: themeInline },
  };
}

/**
 * 形态间转换 —— 保持核心载荷（markdown 源）不变，只换外壳。
 * 注意：standalone -> progressive/minimal 时，需要由调用方提供新的 engine.url / theme.url，
 * 因为 standalone 的内嵌脚本里没有 URL 信息。
 */
export function convertForm(
  html: string,
  toForm: MdvForm,
  shellOverride: Partial<ToMdvHtmlOptions> = {},
): string {
  const parsed = fromMdvHtml(html);
  const opts: ToMdvHtmlOptions = {
    form: toForm,
    title: shellOverride.title ?? parsed.title,
    lang: shellOverride.lang ?? parsed.lang,
    engine:
      shellOverride.engine ??
      (parsed.engine.url ? { url: parsed.engine.url } : { url: defaultEngineUrl() }),
    theme:
      shellOverride.theme ??
      (parsed.theme.url
        ? { id: 'unknown', url: parsed.theme.url }
        : { id: 'default', url: defaultThemeUrl('default') }),
    prerenderedHtml: shellOverride.prerenderedHtml,
    baseMeta: shellOverride.baseMeta,
  };
  return toMdvHtml(parsed.source, opts);
}

// ── 内部工具 ───────────────────────────────────────────────

/** 默认 CDN 引擎地址 —— 由调用方覆盖时用 */
function defaultEngineUrl(): string {
  return 'https://cdn.mdview.sh/r/v1.js';
}
function defaultThemeUrl(id: string): string {
  return `https://cdn.mdview.sh/themes/${id}.css`;
}

/** 主题 link 标签 —— inline 时输出 <style>，url 时输出 <link> */
function buildThemeTag(theme: ThemeRef): string {
  if (theme.inline) {
    return `<style data-mdview-theme="${escapeAttr(theme.id)}">\n${theme.inline}\n</style>`;
  }
  if (theme.url) {
    const integrity = theme.integrity
      ? ` integrity="${escapeAttr(theme.integrity)}" crossorigin="anonymous"`
      : '';
    return `<link rel="stylesheet" href="${escapeAttr(theme.url)}" data-mdview-theme="${escapeAttr(
      theme.id,
    )}"${integrity}>`;
  }
  return '';
}

/** 引擎 script 标签 */
function buildEngineTag(engine: EngineRef): string {
  if (engine.inline) {
    return `<script data-mdview-engine>\n${engine.inline}\n</script>`;
  }
  if (engine.url) {
    const integrity = engine.integrity
      ? ` integrity="${escapeAttr(engine.integrity)}" crossorigin="anonymous"`
      : '';
    return `<script src="${escapeAttr(engine.url)}"${integrity} defer data-mdview-engine></script>`;
  }
  return '';
}

/** 从 markdown 提取第一个 h1 作为标题 */
function extractTitle(markdown: string): string | undefined {
  const m = markdown.match(/^#\s+(.+?)\s*$/m);
  return m?.[1]?.trim();
}

function matchAttr(html: string, re: RegExp): string | undefined {
  return html.match(re)?.[1];
}
function matchInner(html: string, re: RegExp): string | undefined {
  return html.match(re)?.[1];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}
