// 顶部工具栏 —— 容纳主题切换器、文件操作按钮、导出按钮
// 设计目标：默认半透明、不抢主内容；hover 时显形（保留沉浸式阅读体验）
import { type ReactNode } from 'react';

export function Toolbar({ children }: { children: ReactNode }): JSX.Element {
  return <div className="mdv-toolbar">{children}</div>;
}
