// 极简 i18n —— 不引入 i18next/react-intl 之类，桌面端一份 dict 够用
// 如果未来需要复杂的复数 / 日期格式，再换成 ICU MessageFormat 或 i18next
import en from './en.json' with { type: 'json' };
import zhCN from './zh-CN.json' with { type: 'json' };

type Dict = Record<string, string>;

const DICTS: Record<string, Dict> = {
  en,
  'en-US': en,
  zh: zhCN,
  'zh-CN': zhCN,
  'zh-TW': zhCN, // 暂用简体兜底；繁体翻译后续单独加
  'zh-HK': zhCN,
};

const DEFAULT_LOCALE = 'en';

/** 当前锁定的 locale —— 由 init 决定，运行时不变（避免组件树 hydrate 不一致） */
let currentLocale = DEFAULT_LOCALE;
let currentDict: Dict = DICTS[DEFAULT_LOCALE]!;

/** 启动时调用一次 —— 按浏览器语言挑词典 */
export function initI18n(localeOverride?: string): void {
  const candidate = localeOverride ?? detectLocale();
  // 精确匹配 → 否则回退到语言头（zh-CN → zh）
  const dict =
    DICTS[candidate] ?? DICTS[candidate.split('-')[0] ?? ''] ?? DICTS[DEFAULT_LOCALE]!;
  currentLocale = candidate;
  currentDict = dict;
}

function detectLocale(): string {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;
  return navigator.language || (navigator.languages && navigator.languages[0]) || DEFAULT_LOCALE;
}

/** 取一条翻译，缺失则返回 key 本身（便于发现遗漏） */
export function t(key: string, params?: Record<string, string | number>): string {
  let value = currentDict[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(`{${k}}`, String(v));
    }
  }
  return value;
}

/** 暴露当前 locale，便于按 locale 决定字体 / 行宽等细节 */
export function getLocale(): string {
  return currentLocale;
}
