// 桌面端 React 入口
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { applyTheme, getStoredTheme } from './lib/theme-loader';
import { initI18n } from './i18n';

// 应用层 chrome 样式（不污染 #mdview-output 主题）
import './styles/app.css';
// 扩展样式 —— color 色块、callout 提示块等通用 DOM 节点的视觉
import '@mdview/themes/extensions.css';
// 打印样式 —— ⌘P / 浏览器 Save as PDF 时自动启用，隐藏 chrome / 内容铺满 / 跨页友好
import '@mdview/themes/print.css';

// 启动时尽早把主题 link 挂上，避免首屏出现样式空白
applyTheme(getStoredTheme());
// i18n 跟随浏览器 / 系统语言；想强制时调 initI18n('zh-CN')
initI18n();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
