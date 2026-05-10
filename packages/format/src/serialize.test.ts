// .mdv.html 序列化与解析的冒烟测试
import { describe, expect, it } from 'vitest';
import { toMdvHtml, fromMdvHtml, convertForm } from './serialize.js';

const SAMPLE_MD = '# Hello mdview\n\nbody **here**.';

describe('toMdvHtml / fromMdvHtml', () => {
  it('progressive 形态：包含预渲染 HTML 与 CDN 引擎引用', () => {
    const html = toMdvHtml(SAMPLE_MD, {
      form: 'progressive',
      engine: { url: 'https://cdn.mdview.sh/r/v1.js' },
      theme: { id: 'default', url: 'https://cdn.mdview.sh/themes/default.css' },
      prerenderedHtml: '<h1>Hello mdview</h1><p>body <strong>here</strong>.</p>',
    });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('data-mdview="1"');
    expect(html).toContain('cdn.mdview.sh/r/v1.js');
    expect(html).toContain('id="mdview-source"');
    expect(html).toContain('id="mdview-output"');
    expect(html).toContain('<h1>Hello mdview</h1>');
  });

  it('minimal 形态：output 容器为空', () => {
    const html = toMdvHtml(SAMPLE_MD, {
      form: 'minimal',
      engine: { url: 'https://cdn.mdview.sh/r/v1.js' },
      theme: { id: 'default', url: 'https://cdn.mdview.sh/themes/default.css' },
    });
    expect(html).toMatch(/<main id="mdview-output"><\/main>/);
  });

  it('standalone 形态：内嵌引擎与主题', () => {
    const html = toMdvHtml(SAMPLE_MD, {
      form: 'standalone',
      engine: { inline: 'console.log("engine inline")' },
      theme: { id: 'default', inline: '#mdview-output{color:red}' },
    });
    expect(html).toContain('engine inline');
    expect(html).toContain('color:red');
    expect(html).not.toContain('cdn.mdview.sh');
  });

  it('源码中包含 </script> 时不会破坏外层 script 标签', () => {
    const md = '看这段：<script>foo</script>';
    const html = toMdvHtml(md, {
      engine: { url: 'https://cdn.mdview.sh/r/v1.js' },
      theme: { id: 'default', url: 'https://cdn.mdview.sh/themes/default.css' },
    });
    expect(html).toContain('<\\/script>');
    // 解析回来时还原
    const parsed = fromMdvHtml(html);
    expect(parsed.source).toContain('</script>');
  });

  it('fromMdvHtml 能反向解析回原始 markdown', () => {
    const html = toMdvHtml(SAMPLE_MD, {
      title: 'Hello',
      engine: { url: 'https://cdn.mdview.sh/r/v1.js' },
      theme: { id: 'default', url: 'https://cdn.mdview.sh/themes/default.css' },
    });
    const parsed = fromMdvHtml(html);
    expect(parsed.title).toBe('Hello');
    expect(parsed.source.trim()).toBe(SAMPLE_MD);
    expect(parsed.engine.url).toContain('cdn.mdview.sh/r/v1.js');
    expect(parsed.theme.url).toContain('cdn.mdview.sh/themes/default.css');
  });

  it('convertForm 在三形态之间互转，保持源码不变', () => {
    const original = toMdvHtml(SAMPLE_MD, {
      form: 'progressive',
      engine: { url: 'https://cdn.mdview.sh/r/v1.js' },
      theme: { id: 'default', url: 'https://cdn.mdview.sh/themes/default.css' },
    });
    const minimal = convertForm(original, 'minimal');
    const back = fromMdvHtml(minimal);
    expect(back.source.trim()).toBe(SAMPLE_MD);
  });

  it('progressive 与 standalone 都把 prerendered 写进 <main>', () => {
    const prerendered = '<h1 id="hello">Hello mdview</h1><p>body <strong>here</strong>.</p>';
    const progressive = toMdvHtml(SAMPLE_MD, {
      form: 'progressive',
      engine: { url: 'https://cdn.mdview.sh/r/v1.js' },
      theme: { id: 'default', url: 'https://cdn.mdview.sh/themes/default.css' },
      prerenderedHtml: prerendered,
    });
    const standalone = toMdvHtml(SAMPLE_MD, {
      form: 'standalone',
      engine: {},
      theme: { id: 'default', inline: '#mdview-output{color:black}' },
      prerenderedHtml: prerendered,
    });
    const minimal = toMdvHtml(SAMPLE_MD, {
      form: 'minimal',
      engine: { url: 'https://cdn.mdview.sh/r/v1.js' },
      theme: { id: 'default', url: 'https://cdn.mdview.sh/themes/default.css' },
      prerenderedHtml: prerendered,
    });
    expect(progressive).toContain(prerendered);
    expect(standalone).toContain(prerendered);
    // minimal 故意不嵌入 prerendered（依赖运行时引擎）
    expect(minimal).not.toContain(prerendered);
    expect(minimal).toMatch(/<main id="mdview-output"><\/main>/);
  });

  it('SRI integrity 在 link 与 script 上都正确出现', () => {
    const html = toMdvHtml(SAMPLE_MD, {
      form: 'progressive',
      engine: {
        url: 'https://cdn.mdview.sh/r/v1.0.3.js',
        integrity: 'sha384-foo',
      },
      theme: {
        id: 'default',
        url: 'https://cdn.mdview.sh/themes/default.css',
        integrity: 'sha384-bar',
      },
    });
    expect(html).toContain('integrity="sha384-foo"');
    expect(html).toContain('integrity="sha384-bar"');
    expect(html).toContain('crossorigin="anonymous"');
  });

  it('title 缺省时从 markdown 第一个 h1 提取', () => {
    const html = toMdvHtml('# My Title\n\nbody', {
      engine: { url: 'https://cdn.mdview.sh/r/v1.js' },
      theme: { id: 'default', url: 'https://cdn.mdview.sh/themes/default.css' },
    });
    expect(html).toContain('<title>My Title</title>');
  });

  it('title 缺省且没有 h1 时回退 Untitled', () => {
    const html = toMdvHtml('just text', {
      engine: { url: 'https://cdn.mdview.sh/r/v1.js' },
      theme: { id: 'default', url: 'https://cdn.mdview.sh/themes/default.css' },
    });
    expect(html).toContain('<title>Untitled</title>');
  });

  it('lang 字段写入 <html lang>', () => {
    const html = toMdvHtml(SAMPLE_MD, {
      lang: 'zh-CN',
      engine: { url: 'https://cdn.mdview.sh/r/v1.js' },
      theme: { id: 'default', url: 'https://cdn.mdview.sh/themes/default.css' },
    });
    expect(html).toContain('<html lang="zh-CN"');
  });

  it('convertForm 不丢自定义引擎 / 主题 URL', () => {
    const orig = toMdvHtml(SAMPLE_MD, {
      form: 'progressive',
      engine: { url: 'https://custom.cdn/r.js' },
      theme: { id: 'lapis', url: 'https://custom.cdn/themes/lapis.css' },
      prerenderedHtml: '<p>body</p>',
    });
    const standalone = convertForm(orig, 'standalone');
    const back = fromMdvHtml(standalone);
    expect(back.engine.url).toContain('custom.cdn');
    expect(back.theme.url).toContain('custom.cdn');
  });
});
