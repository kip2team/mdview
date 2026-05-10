# @mdview/cli

mdview 命令行工具。

## 安装

```bash
npm i -g @mdview/cli
# 或本地试用
npx @mdview/cli render foo.md
```

## 命令

### `mdview render <file>`

把 markdown 渲染为 HTML 片段（不含外壳），输出到 stdout 或 `--out` 指定的文件。

```bash
mdview render README.md > readme.html
mdview render README.md --theme medium -o out.html
```

### `mdview export <file>`

导出为 `.mdv.html` 自渲染文件。

```bash
mdview export README.md --form progressive       # 默认
mdview export README.md --form minimal --theme github
mdview export README.md --form standalone        # 完全离线，不依赖 CDN
mdview export README.md --form all               # 三个形态各导一份
```

### `mdview convert <file>`

在三种 .mdv.html 形态之间互转，源码保持不变。

```bash
mdview convert foo.mdv.html --to standalone -o foo.standalone.mdv.html
```

### `mdview serve <file>`

起一个本地 HTTP 服务，浏览器访问 `http://localhost:3030`，文件改动自动刷新页面（SSE 长连接）。

```bash
mdview serve README.md
mdview serve README.md --theme medium --port 8080
mdview serve README.md --no-watch
```

适合写文章 / 边写边看的场景，比反复 `export` 然后开浏览器方便。

## 别名

CLI 入口同时注册了 `mdview` 和 `mdv`，二选一。
