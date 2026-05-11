# Twitter / X 发布串

每条 280 字符以内，5 条小串。第 1 条尽量"挂钩"（hook），第 2-4 条展示证据，第 5 条 CTA。

---

## 1/5（hook）

I just shipped mdview — a Markdown reader that works identically on desktop, web, browser extensions, and IDE plugins.

One engine, six surfaces, one consistent reading experience.

Demo + code: https://github.com/kip2team/mdview

[attach: GIF of opening a .md file in desktop, switching themes]

---

## 2/5（差异化）

Most "Markdown tools" are editors that ship a viewer as an afterthought.

mdview flipped it: it's a viewer first, a viewing platform second, an editor third.

That ordering changes everything about the architecture.

[attach: screenshot of the same .md rendered identically in 4 places]

---

## 3/5（自渲染 HTML）

When you export from mdview you get an HTML file.

But the body of that HTML is still Markdown:

```html
<script type="text/x-mdview">
# My document
Real markdown here.
</script>
```

Browsers see it as a styled page. Text editors edit it as .md.

---

## 4/5（元数据=演出）

YAML front matter in mdview is the author's "how this should look":

```yaml
---
theme: medium
font: charter
toc: true
extensions: [mdv:callout, mdv:math]
---
```

Send this .md to anyone — every viewer respects your settings. No "open in X to view properly" disclaimers.

---

## 5/5（CTA）

Try it:

→ Web: https://mdview.sh
→ Desktop: https://github.com/kip2team/mdview/releases (Tauri, ~6MB)
→ CLI: `npm create mdview-doc my-article`
→ MCP server for Claude Desktop also shipping today

MIT license. Engine is 30KB gzipped, easy to read in an afternoon.

---

## 备注

- 把 GIF 放在第 1 条（"挂钩"）和第 2 条
- 留 30 秒间隔再发下一条，让前一条有时间获得 engagement
- 不要 @ 任何人；让算法自然分发
- 24 小时内如果没爆，转发自己的 thread 一次，加新角度（"by the way, here's how X works under the hood"）
