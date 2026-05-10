// 主题包索引 —— 所有内置主题在此注册
import defaultMeta from './themes/default.json' with { type: 'json' };
import githubMeta from './themes/github.json' with { type: 'json' };
import mediumMeta from './themes/medium.json' with { type: 'json' };
import darkMeta from './themes/dark.json' with { type: 'json' };
import solarizedMeta from './themes/solarized.json' with { type: 'json' };
import sepiaMeta from './themes/sepia.json' with { type: 'json' };

/** 主题元数据接口（与 theme.json 对应） */
export interface ThemeMeta {
  id: string;
  name: string;
  version: string;
  author: string;
  description?: string;
  /** 主题默认元数据，会在渲染时作为 themeDefaults 传给 core */
  defaults?: {
    font?: string;
    fontSize?: string;
    lineHeight?: number;
    maxWidth?: string;
    codeTheme?: string;
  };
}

/** 内置主题清单 */
export const BUILT_IN_THEMES: ThemeMeta[] = [
  defaultMeta as ThemeMeta,
  githubMeta as ThemeMeta,
  mediumMeta as ThemeMeta,
  darkMeta as ThemeMeta,
  solarizedMeta as ThemeMeta,
  sepiaMeta as ThemeMeta,
];

/** 通过 id 查找主题 */
export function findTheme(id: string): ThemeMeta | undefined {
  return BUILT_IN_THEMES.find((t) => t.id === id);
}

/** 取主题默认元数据 —— 给 core.render 的 themeDefaults 用 */
export function themeDefaults(id: string): Record<string, unknown> {
  return findTheme(id)?.defaults ?? {};
}
