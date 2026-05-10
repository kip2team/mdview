// mdv:color / mdv:callout 扩展冒烟测试
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
    const md = ['---', 'extensions: [mdv:mermaid]', '---', '```mermaid', 'A-->B', '```'].join(
      '\n',
    );
    const { html } = render(md);
    expect(html).toContain('class="mdv-mermaid"');
  });
});
