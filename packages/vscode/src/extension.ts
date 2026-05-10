// VS Code 扩展入口 —— 注册预览命令
import * as vscode from 'vscode';
import { render } from '@mdview/core';
import { themeDefaults } from '@mdview/themes';
import * as fs from 'node:fs';
import * as path from 'node:path';

// 已打开的预览面板：key=document uri.toString()
const openPanels = new Map<string, vscode.WebviewPanel>();

export function activate(context: vscode.ExtensionContext): void {
  const openPreview = (toSide: boolean) => async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'markdown') {
      vscode.window.showInformationMessage('Open a Markdown file first.');
      return;
    }
    showPreview(context, editor.document, toSide);
  };

  context.subscriptions.push(
    vscode.commands.registerCommand('mdview.openPreview', openPreview(false)),
    vscode.commands.registerCommand('mdview.openPreviewToSide', openPreview(true)),
  );

  // 文件改动时刷新对应预览
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      const key = e.document.uri.toString();
      const panel = openPanels.get(key);
      if (panel) refresh(panel, e.document);
    }),
  );
}

export function deactivate(): void {
  // VS Code 会自动清理 webview，不需要做事
}

function showPreview(
  context: vscode.ExtensionContext,
  document: vscode.TextDocument,
  toSide: boolean,
): void {
  const key = document.uri.toString();
  const existing = openPanels.get(key);
  if (existing) {
    existing.reveal(toSide ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active);
    refresh(existing, document);
    return;
  }
  const panel = vscode.window.createWebviewPanel(
    'mdview.preview',
    `Preview: ${path.basename(document.uri.fsPath)}`,
    toSide ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active,
    {
      enableScripts: false,
      retainContextWhenHidden: true,
    },
  );
  openPanels.set(key, panel);
  panel.onDidDispose(() => openPanels.delete(key));
  refresh(panel, document);
}

function refresh(panel: vscode.WebviewPanel, document: vscode.TextDocument): void {
  const config = vscode.workspace.getConfiguration('mdview');
  const themeId = config.get<string>('theme', 'default');
  const extensions = config.get<string[]>('extensions', []);

  const result = render(document.getText(), {
    themeDefaults: themeDefaults(themeId),
    extensions,
  });
  panel.title = result.meta.title
    ? `Preview: ${result.meta.title}`
    : `Preview: ${path.basename(document.uri.fsPath)}`;

  // 把主题 CSS 与扩展 CSS 内联进 webview HTML
  // 注意：webview 不允许直接 link 到本地路径，需要先 asWebviewUri 或者直接读文件内联
  const themeCss = readBundledCss(`themes/${themeId}.css`);
  const extCss = readBundledCss('extensions.css');

  panel.webview.html = wrapHtml(result.html, themeCss + '\n' + extCss);
}

/** 把生成的 HTML 包到完整 HTML 文档中 */
function wrapHtml(bodyHtml: string, css: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src https: data:;">
<title>mdview preview</title>
<style>${css}
html, body { background: var(--vscode-editor-background, #ffffff); margin: 0; padding: 0; }
</style>
</head>
<body>
<main id="mdview-output">
${bodyHtml}
</main>
</body>
</html>`;
}

/**
 * 读 bundle 内的 CSS（build.js 把它们复制到 dist/styles/）
 * 在 dev 模式直接从 packages/themes/src 读，便于 watch 时实时生效
 */
function readBundledCss(rel: string): string {
  // build 后路径
  const distPath = path.join(__dirname, 'styles', path.basename(rel));
  if (fs.existsSync(distPath)) {
    return fs.readFileSync(distPath, 'utf8');
  }
  // 回退：直接读 themes 包源（dev 场景）
  const themesRoot = path.resolve(__dirname, '../../themes/src');
  const fallback = path.join(themesRoot, rel);
  if (fs.existsSync(fallback)) return fs.readFileSync(fallback, 'utf8');
  return '';
}
