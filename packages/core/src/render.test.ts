// 引擎核心冒烟测试
import { describe, expect, it } from 'vitest';
import { render } from './render.js';
import { mergeMetadata, parseMetadata } from './metadata.js';

describe('render', () => {
  it('渲染纯 markdown，无 front matter 时元数据回落到默认', () => {
    const { html, meta, headings } = render('# Hello\n\nworld');
    expect(html).toContain('<h1');
    expect(html).toContain('Hello');
    expect(meta.theme).toBe('default');
    expect(meta.lang).toBe('en');
    expect(headings).toHaveLength(1);
    expect(headings[0]?.text).toBe('Hello');
  });

  it('解析 YAML front matter 并合并到元数据', () => {
    const md = ['---', 'title: 我的文章', 'theme: medium', 'lang: zh-CN', '---', '# Hi'].join(
      '\n',
    );
    const { meta, body } = render(md);
    expect(meta.title).toBe('我的文章');
    expect(meta.theme).toBe('medium');
    expect(meta.lang).toBe('zh-CN');
    expect(body.startsWith('# Hi')).toBe(true);
  });

  it('override 覆盖 front matter（URL 参数优先级）', () => {
    const md = ['---', 'theme: medium', '---', '# Hi'].join('\n');
    const { meta } = render(md, { override: { theme: 'dark' } });
    expect(meta.theme).toBe('dark');
  });

  it('themeDefaults 比 front matter 优先级低', () => {
    const md = ['---', 'theme: medium', '---', '# Hi'].join('\n');
    const { meta } = render(md, { themeDefaults: { theme: 'github', maxWidth: '720px' } });
    expect(meta.theme).toBe('medium');
    expect(meta.maxWidth).toBe('720px');
  });

  it('为标题注入稳定 id', () => {
    const { html, headings } = render('# 介绍\n\n## 安装\n\n## 安装');
    expect(headings.map((h) => h.id)).toEqual(['介绍', '安装', '安装-1']);
    expect(html).toContain('id="介绍"');
    expect(html).toContain('id="安装"');
    expect(html).toContain('id="安装-1"');
  });
});

describe('parseMetadata', () => {
  it('把 og.image 这种点号 key 收拢到 og 对象', () => {
    const meta = parseMetadata({
      'og.image': 'foo.png',
      'og.title': 't',
    });
    expect(meta.og?.image).toBe('foo.png');
    expect(meta.og?.title).toBe('t');
    expect((meta as Record<string, unknown>)['og.image']).toBeUndefined();
  });

  it('把 toc.position / toc.depth 收拢到 toc 对象', () => {
    const meta = parseMetadata({
      'toc.position': 'right',
      'toc.depth': 3,
    });
    expect(meta.toc).toEqual({ position: 'right', depth: 3 });
  });
});

describe('mergeMetadata', () => {
  it('优先级：后传入的覆盖先传入的', () => {
    const merged = mergeMetadata({ theme: 'a' }, { theme: 'b' }, { theme: 'c' });
    expect(merged.theme).toBe('c');
  });

  it('嵌套对象（brand）按字段浅合并', () => {
    const merged = mergeMetadata(
      { brand: { primary: '#000', accent: '#111' } },
      { brand: { accent: '#222' } },
    );
    expect(merged.brand).toEqual({ primary: '#000', accent: '#222' });
  });
});
