// 桌面端 React 入口
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { applyTheme, getStoredTheme } from './lib/theme-loader';

// 应用层 chrome 样式（不污染 #mdview-output 主题）
import './styles/app.css';
// 扩展样式 —— color 色块、callout 提示块等通用 DOM 节点的视觉
import '@mdview/themes/extensions.css';

// 启动时尽早把主题 link 挂上，避免首屏出现样式空白
applyTheme(getStoredTheme());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
