// 主题 CSS 资源 —— 以两种形式（URL 和 raw 字符串）暴露给桌面端
// URL：用于 link 标签动态切换（theme-loader.ts 用）
// raw：用于 .mdv.html standalone 形态导出时内嵌
import defaultUrl from '@mdview/themes/default.css?url';
import githubUrl from '@mdview/themes/github.css?url';
import mediumUrl from '@mdview/themes/medium.css?url';
import extensionsUrl from '@mdview/themes/extensions.css?url';

import defaultRaw from '@mdview/themes/default.css?raw';
import githubRaw from '@mdview/themes/github.css?raw';
import mediumRaw from '@mdview/themes/medium.css?raw';
import extensionsRaw from '@mdview/themes/extensions.css?raw';

export const THEME_CSS_URLS: Record<string, string> = {
  default: defaultUrl,
  github: githubUrl,
  medium: mediumUrl,
};

export const THEME_CSS_RAW: Record<string, string> = {
  default: defaultRaw,
  github: githubRaw,
  medium: mediumRaw,
};

export const EXTENSIONS_CSS_URL = extensionsUrl;
export const EXTENSIONS_CSS_RAW = extensionsRaw;

/** CDN 地址 —— 用于 minimal / progressive 形态（CDN 上线后生效） */
export function cdnThemeUrl(themeId: string): string {
  return `https://cdn.mdview.sh/themes/${themeId}.css`;
}

export function cdnEngineUrl(version = 'v1'): string {
  return `https://cdn.mdview.sh/r/${version}.js`;
}
