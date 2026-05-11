// `mdview serve <file>` —— 起一个最简的 HTTP server 渲染 markdown
// 浏览器访问 → SSE 推送变更 → 自动刷新
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { watch } from 'chokidar';
import { render } from '@mdview/core';
import { themeDefaults } from '@mdview/themes';

interface ServeOptions {
  file: string;
  port: number;
  theme: string;
  watch: boolean;
}

export async function startServer(opts: ServeOptions): Promise<void> {
  // SSE 客户端集合 —— 文件变更时给所有连接 push 一条
  const clients = new Set<import('node:http').ServerResponse>();

  const server = createServer(async (req, res) => {
    if (!req.url) {
      res.writeHead(400);
      res.end();
      return;
    }

    // SSE endpoint：浏览器 EventSource 长连接接收 reload 消息
    if (req.url === '/__mdview_sse') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.write('retry: 5000\n\n');
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }

    // 主页面：渲染 markdown + 注入 SSE 客户端 + 主题 CSS link
    if (req.url === '/' || req.url.startsWith('/?')) {
      try {
        const md = await readFile(opts.file, 'utf8');
        const result = render(md, { themeDefaults: themeDefaults(opts.theme) });
        const title = result.meta.title ?? opts.file;
        const themeId = result.meta.theme ?? opts.theme;
        const html = wrapHtml(result.html, themeId, title, opts.watch);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Error: ${err instanceof Error ? err.message : String(err)}`);
      }
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(opts.port, () => {
    console.log(`✓ mdview serve → http://localhost:${opts.port}`);
    console.log(`  rendering: ${opts.file}`);
    if (opts.watch) console.log(`  watching for changes`);
    console.log(`  press ⌃C to stop`);
  });

  // 文件变更 → SSE 广播 reload
  if (opts.watch) {
    const watcher = watch(opts.file, { ignoreInitial: true });
    watcher.on('change', () => {
      console.log('  ↻ file changed, reloading clients');
      for (const c of clients) {
        c.write(`event: reload\ndata: ${Date.now()}\n\n`);
      }
    });
  }
}

function wrapHtml(body: string, themeId: string, title: string, watch: boolean): string {
  const sseScript = watch
    ? `<script>
const es = new EventSource('/__mdview_sse');
es.addEventListener('reload', () => location.reload());
</script>`
    : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="https://cdn.mdview.sh/themes/${escapeAttr(themeId)}.css">
<link rel="stylesheet" href="https://cdn.mdview.sh/ext/extensions.css">
</head>
<body>
<main id="mdview-output">
${body}
</main>
${sseScript}
</body>
</html>`;
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
