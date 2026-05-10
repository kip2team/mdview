// 主题动态加载 —— 在桌面端运行时根据当前 themeId 切换 <link> 标签
// 三个主题 CSS 都通过 Vite 的 ?url 后缀拿到打包后的资源地址，避免一次性把全部主题样式都注入冲突
import defaultThemeUrl from '@mdview/themes/default.css?url';
import githubThemeUrl from '@mdview/themes/github.css?url';
import mediumThemeUrl from '@mdview/themes/medium.css?url';
import darkThemeUrl from '@mdview/themes/dark.css?url';
import solarizedThemeUrl from '@mdview/themes/solarized.css?url';
import sepiaThemeUrl from '@mdview/themes/sepia.css?url';
import { BUILT_IN_THEMES, type ThemeMeta } from '@mdview/themes';

/** 主题 ID → 打包后的 CSS URL —— 只覆盖内置主题；自定义 / CDN 主题以后另接 */
const BUILT_IN_THEME_URLS: Record<string, string> = {
  default: defaultThemeUrl,
  github: githubThemeUrl,
  medium: mediumThemeUrl,
  dark: darkThemeUrl,
  solarized: solarizedThemeUrl,
  sepia: sepiaThemeUrl,
};

/** 暴露给 UI 的所有可选主题 */
export const THEME_OPTIONS: ThemeMeta[] = BUILT_IN_THEMES;

/** localStorage key —— 跨会话保留用户最后选中的主题 */
const STORAGE_KEY = 'mdview:theme';

/** 默认主题 */
export const DEFAULT_THEME_ID = 'default';

/**
 * 在 document.head 上挂一个 link 标签（如不存在），并把 href 指向当前主题。
 * 切换主题只是改 href，浏览器会自然替换样式。
 */
export function applyTheme(themeId: string): void {
  const url = BUILT_IN_THEME_URLS[themeId];
  if (!url) {
    console.warn(`[mdview] unknown theme id: ${themeId}, falling back to default`);
    return applyTheme(DEFAULT_THEME_ID);
  }
  let link = document.querySelector<HTMLLinkElement>('link[data-mdview-theme]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.dataset.mdviewTheme = '';
    document.head.appendChild(link);
  }
  link.href = url;
  link.dataset.mdviewTheme = themeId;
}

/** 从 localStorage 读上次选中的主题；没有则返回默认 */
export function getStoredTheme(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID;
  }
}

/** 把当前主题写回 localStorage */
export function persistTheme(themeId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, themeId);
  } catch {
    // localStorage 不可用时静默忽略 —— 桌面端 webview 一般可用，留兜底
  }
}
