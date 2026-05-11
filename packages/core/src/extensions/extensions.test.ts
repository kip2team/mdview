// mdview 内置扩展冒烟测试
// 覆盖：mdv:color / mdv:callout / mdv:math / mdv:mermaid / mdv:kbd / mdv:details / mdv:sub-sup / mdv:badge
import { describe, expect, it } from 'vitest';
import { render } from '../render.js';

describe('mdv:color extension', () => {
  it('未启用时 hex 文本保持原样（不会被错误识别）', () => {
    const { html } = render('颜色 #ff0000 在这里', {});
    expect(html).not.toContain('mdv-color');
    expect(html).toContain('#ff0000');
  });

  it('启用后给 hex 加色块预览', () => {
    const { html } = render('我喜欢 #ff6b35 这个橙色', {
      extensions: ['mdv:color'],
    });
    expect(html).toContain('class="mdv-color"');
    expect(html).toContain('--mdv-swatch:#ff6b35');
    expect(html).toContain('mdv-color-swatch');
    expect(html).toContain('#ff6b35'); // 原文本保留
  });

  it('支持 #rgb / #rrggbb / #rrggbbaa', () => {
    const { html } = render('短 #fff 长 #ff00aa 带 alpha #ff00aaff', {
      extensions: ['mdv:color'],
    });
    expect(html.match(/class="mdv-color"/g)?.length).toBe(3);
  });

  it('忽略错误长度的 hex（如 #fffff）', () => {
    const { html } = render('错的长度 #fffff 应原样', { extensions: ['mdv:color'] });
    expect(html).not.toContain('mdv-color');
  });

  it('代码块 / 行内代码内的 hex 不被处理', () => {
    const { html } = render('行内 `#ff0000` 与代码块', { extensions: ['mdv:color'] });
    // 行内 code 内不会有色块包裹（markdown-it 已把它解析成 code_inline，扩展只动 text token）
    expect(html).toContain('<code>#ff0000</code>');
    expect(html).not.toContain('mdv-color');
  });

  it('通过 front matter extensions 字段也能启用', () => {
    const md = ['---', 'extensions: [mdv:color]', '---', '#ff6b35 红橙'].join('\n');
    const { html } = render(md);
    expect(html).toContain('class="mdv-color"');
  });
});

describe('mdv:callout extension', () => {
  it('未启用时 callout 头是普通 blockquote 文本', () => {
    const { html } = render('> [!warning] 注意\n> 内容', {});
    expect(html).toContain('<blockquote>');
    expect(html).toContain('[!warning]');
    expect(html).not.toContain('mdv-callout');
  });

  it('启用后渲染为 aside 块，带类型与标题', () => {
    const { html } = render('> [!warning] 小心踩坑\n> 这是警告内容', {
      extensions: ['mdv:callout'],
    });
    expect(html).toContain('<aside class="mdv-callout mdv-callout-warning"');
    expect(html).toContain('mdv-callout-title');
    expect(html).toContain('小心踩坑');
    expect(html).toContain('这是警告内容');
    expect(html).not.toContain('[!warning]');
  });

  it('未指定标题时用类型首字母大写做标题', () => {
    const { html } = render('> [!tip]\n> 一条建议', { extensions: ['mdv:callout'] });
    expect(html).toContain('mdv-callout-tip');
    expect(html).toContain('Tip');
  });

  it('未知类型也能渲染（保持兼容性）', () => {
    const { html } = render('> [!custom-type] 自定义\n> 内容', {
      extensions: ['mdv:callout'],
    });
    expect(html).toContain('mdv-callout-custom-type');
  });

  it('普通 blockquote（无 [!type] 头）保持原样', () => {
    const { html } = render('> 这是引用\n> 第二行', { extensions: ['mdv:callout'] });
    expect(html).toContain('<blockquote>');
    expect(html).not.toContain('mdv-callout');
  });

  it('正文里有 markdown 强调能正常渲染', () => {
    const { html } = render('> [!info] 标题\n> **加粗** 和 *斜体*', {
      extensions: ['mdv:callout'],
    });
    expect(html).toContain('<strong>加粗</strong>');
    expect(html).toContain('<em>斜体</em>');
  });

  it('通过 front matter extensions 字段也能启用', () => {
    const md = ['---', 'extensions: [mdv:callout]', '---', '> [!note] T', '> body'].join('\n');
    const { html } = render(md);
    expect(html).toContain('mdv-callout-note');
  });

  it('两个扩展可以同时启用', () => {
    const md = '> [!info] 颜色提示\n> 注意 #ff0000 是红色';
    const { html } = render(md, { extensions: ['mdv:callout', 'mdv:color'] });
    expect(html).toContain('mdv-callout-info');
    expect(html).toContain('mdv-color');
  });
});

describe('mdv:math extension', () => {
  it('未启用时 $...$ 当作普通文本', () => {
    const { html } = render('行内 $x^2$ 公式', {});
    expect(html).not.toContain('mdv-math');
    expect(html).toContain('$x^2$');
  });

  it('启用后行内 $x^2$ 渲染为占位 span', () => {
    const { html } = render('行内 $x^2 + 1$ 公式', { extensions: ['mdv:math'] });
    expect(html).toContain('class="mdv-math mdv-math-inline"');
    expect(html).toContain('data-mdv-math="x^2 + 1"');
  });

  it('块级 $$...$$ 同行闭合', () => {
    const { html } = render('$$E = mc^2$$', { extensions: ['mdv:math'] });
    expect(html).toContain('class="mdv-math mdv-math-block"');
    expect(html).toContain('data-mdv-math="E = mc^2"');
  });

  it('块级 $$...$$ 跨行', () => {
    const md = ['$$', 'a + b', '= c', '$$'].join('\n');
    const { html } = render(md, { extensions: ['mdv:math'] });
    expect(html).toContain('mdv-math-block');
    expect(html).toContain('data-mdv-math="a + b\n= c"');
  });

  it('"$5 and $10" 不被误判为公式（边界为空白）', () => {
    const { html } = render('价格是 $5 不是 $10', { extensions: ['mdv:math'] });
    expect(html).not.toContain('mdv-math');
  });

  it('行内代码内的 $x$ 不会被处理', () => {
    const { html } = render('行内 `$x$` 文本', { extensions: ['mdv:math'] });
    expect(html).toContain('<code>$x$</code>');
    expect(html).not.toContain('mdv-math');
  });

  it('通过 front matter 启用 math', () => {
    const md = ['---', 'extensions: [mdv:math]', '---', 'See $\\alpha$.'].join('\n');
    const { html } = render(md);
    expect(html).toContain('mdv-math-inline');
  });
});

describe('mdv:mermaid extension', () => {
  it('未启用时 ```mermaid``` 是普通代码块', () => {
    const md = ['```mermaid', 'graph TD; A-->B', '```'].join('\n');
    const { html } = render(md, {});
    expect(html).toContain('<pre>');
    expect(html).toContain('language-mermaid');
    expect(html).not.toContain('mdv-mermaid');
  });

  it('启用后渲染为占位 div + 原始源', () => {
    const md = ['```mermaid', 'graph TD;', '  A-->B', '```'].join('\n');
    const { html } = render(md, { extensions: ['mdv:mermaid'] });
    expect(html).toContain('class="mdv-mermaid"');
    expect(html).toContain('data-mdv-mermaid="graph TD;\n  A--&gt;B\n"');
    expect(html).toContain('mdv-mermaid-fallback');
  });

  it('其他语言的代码块不受影响', () => {
    const md = ['```js', 'console.log("hi")', '```'].join('\n');
    const { html } = render(md, { extensions: ['mdv:mermaid'] });
    expect(html).toContain('language-js');
    expect(html).not.toContain('mdv-mermaid');
  });

  it('通过 front matter 启用 mermaid', () => {
    const md = ['---', 'extensions: [mdv:mermaid]', '---', '```mermaid', 'A-->B', '```'].join('\n');
    const { html } = render(md);
    expect(html).toContain('class="mdv-mermaid"');
  });
});

describe('mdv:kbd extension', () => {
  it('未启用时 [[Cmd+K]] 当作普通文本', () => {
    const { html } = render('按 [[Cmd+K]] 打开', {});
    expect(html).not.toContain('<kbd');
    expect(html).toContain('[[Cmd+K]]');
  });

  it('启用后 [[Cmd+K]] 渲染为 kbd 序列 + plus 分隔符', () => {
    const { html } = render('按 [[Cmd+K]] 打开', { extensions: ['mdv:kbd'] });
    expect(html).toContain('<kbd class="mdv-kbd">Cmd</kbd>');
    expect(html).toContain('<kbd class="mdv-kbd">K</kbd>');
    expect(html).toContain('mdv-kbd-plus');
  });

  it('空格分隔的连按用 then 分隔符', () => {
    const { html } = render('按 [[g g]]', { extensions: ['mdv:kbd'] });
    expect(html).toContain('<kbd class="mdv-kbd">g</kbd>');
    expect(html).toContain('mdv-kbd-then');
  });

  it('支持 Unicode 修饰键符号（⌘⌥⇧⌃）', () => {
    const { html } = render('按 [[⌘+⇧+P]]', { extensions: ['mdv:kbd'] });
    expect(html).toContain('<kbd class="mdv-kbd">⌘</kbd>');
    expect(html).toContain('<kbd class="mdv-kbd">⇧</kbd>');
    expect(html).toContain('<kbd class="mdv-kbd">P</kbd>');
  });
});

describe('mdv:details extension', () => {
  it('未启用时 ::: details 块当作普通文本', () => {
    const md = ['::: details Click me', 'Hidden', ':::'].join('\n');
    const { html } = render(md, {});
    expect(html).not.toContain('<details');
  });

  it('启用后渲染为 <details><summary>', () => {
    const md = ['::: details Click me', '', 'Hidden content', ':::'].join('\n');
    const { html } = render(md, { extensions: ['mdv:details'] });
    expect(html).toContain('<details class="mdv-details">');
    expect(html).toContain('<summary class="mdv-details-summary">Click me</summary>');
    expect(html).toContain('Hidden content');
  });

  it('未提供 summary 时用 "Details" 兜底', () => {
    const md = ['::: details', '', 'body', ':::'].join('\n');
    const { html } = render(md, { extensions: ['mdv:details'] });
    expect(html).toContain('<summary class="mdv-details-summary">Details</summary>');
  });

  it('内部支持嵌套 markdown', () => {
    const md = ['::: details Title', '', '**bold**', ':::'].join('\n');
    const { html } = render(md, { extensions: ['mdv:details'] });
    expect(html).toContain('<strong>bold</strong>');
  });
});

describe('mdv:sub-sup extension', () => {
  it('未启用时 ^x^ / ~x~ 保持原样', () => {
    const { html } = render('E = mc^2^ 和 H~2~O', {});
    expect(html).not.toContain('<sup>');
    expect(html).not.toContain('<sub>');
  });

  it('启用后 ^2^ → <sup>2</sup>', () => {
    const { html } = render('E = mc^2^', { extensions: ['mdv:sub-sup'] });
    expect(html).toContain('<sup>2</sup>');
  });

  it('启用后 ~2~ → <sub>2</sub>', () => {
    const { html } = render('H~2~O', { extensions: ['mdv:sub-sup'] });
    expect(html).toContain('<sub>2</sub>');
  });

  it('双 ~~ 删除线不被误识别为下标（GFM 处理）', () => {
    const { html } = render('删除线 ~~old~~', { extensions: ['mdv:sub-sup'] });
    expect(html).toContain('<s>old</s>');
    expect(html).not.toContain('<sub>');
  });

  it('跨行不算 delimiter', () => {
    const { html } = render('开始^然后\n结束^', { extensions: ['mdv:sub-sup'] });
    expect(html).not.toContain('<sup>');
  });
});

describe('mdv:badge extension', () => {
  it('未启用时 ![[badge:passing|green]] 保持原样', () => {
    const { html } = render('状态 ![[badge:passing|green]]', {});
    expect(html).not.toContain('mdv-badge');
    expect(html).toContain('![[badge:passing|green]]');
  });

  it('启用后渲染带 named color 的徽章', () => {
    const { html } = render('![[badge:passing|green]]', { extensions: ['mdv:badge'] });
    expect(html).toContain('class="mdv-badge"');
    expect(html).toContain('--mdv-badge-bg:#1a7f37');
    expect(html).toContain('passing');
  });

  it('支持自定义 hex 色', () => {
    const { html } = render('![[badge:custom|#ff6b35]]', { extensions: ['mdv:badge'] });
    expect(html).toContain('--mdv-badge-bg:#ff6b35');
  });

  it('未指定色用默认 gray', () => {
    const { html } = render('![[badge:plain]]', { extensions: ['mdv:badge'] });
    expect(html).toContain('--mdv-badge-bg:#6e7781');
  });

  it('多个徽章在同一行都被识别', () => {
    const { html } = render('![[badge:a|red]] ![[badge:b|blue]]', {
      extensions: ['mdv:badge'],
    });
    expect((html.match(/class="mdv-badge"/g) ?? []).length).toBe(2);
  });
});

describe('mdv:progress extension', () => {
  it('未启用时 [==70%==] 当作普通文本', () => {
    const { html } = render('进度 [==70%==]', {});
    expect(html).not.toContain('mdv-progress');
    expect(html).toContain('[==70%==]');
  });

  it('启用后渲染为带 ARIA 的进度条', () => {
    const { html } = render('进度 [==70%==]', { extensions: ['mdv:progress'] });
    expect(html).toContain('class="mdv-progress"');
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="70"');
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="100"');
    expect(html).toContain('width:70%');
    expect(html).toContain('70%');
  });

  it('支持 named color', () => {
    const { html } = render('[==90%==|green]', { extensions: ['mdv:progress'] });
    expect(html).toContain('--mdv-progress-fill:#1a7f37');
  });

  it('支持自定义 hex', () => {
    const { html } = render('[==45%==|#ff6b35]', { extensions: ['mdv:progress'] });
    expect(html).toContain('--mdv-progress-fill:#ff6b35');
  });

  it('未指定颜色用默认 blue', () => {
    const { html } = render('[==50%==]', { extensions: ['mdv:progress'] });
    expect(html).toContain('--mdv-progress-fill:#0969da');
  });

  it('clamp 边界值（0 / 100 / 超界）', () => {
    const r1 = render('[==0%==]', { extensions: ['mdv:progress'] }).html;
    const r2 = render('[==100%==]', { extensions: ['mdv:progress'] }).html;
    const r3 = render('[==150%==]', { extensions: ['mdv:progress'] }).html;
    expect(r1).toContain('aria-valuenow="0"');
    expect(r2).toContain('aria-valuenow="100"');
    expect(r3).toContain('aria-valuenow="100"'); // 150 → clamp 100
  });

  it('多个进度条在同一行都被识别', () => {
    const { html } = render('CPU [==45%==|red] / RAM [==75%==|blue]', {
      extensions: ['mdv:progress'],
    });
    expect((html.match(/class="mdv-progress"/g) ?? []).length).toBe(2);
  });
});
