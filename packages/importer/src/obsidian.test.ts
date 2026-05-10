// Obsidian 主题转换冒烟测试
import { describe, expect, it } from 'vitest';
import { importObsidianTheme } from './obsidian.js';

describe('importObsidianTheme', () => {
  it('替换 .markdown-preview-view 为 #mdview-output', () => {
    const css = '.markdown-preview-view { padding: 20px; }';
    const { css: out } = importObsidianTheme(css, { id: 't' });
    expect(out).toContain('#mdview-output { padding: 20px; }');
    expect(out).not.toContain('.markdown-preview-view');
  });

  it('替换 .markdown-rendered 为 #mdview-output', () => {
    const css = '.markdown-rendered h1 { color: red; }';
    const { css: out } = importObsidianTheme(css, { id: 't' });
    expect(out).toContain('#mdview-output h1');
  });

  it('callout 类映射到 mdv-callout', () => {
    const css = '.callout { background: yellow; } .callout-title { font-weight: bold; }';
    const { css: out } = importObsidianTheme(css, { id: 't' });
    expect(out).toContain('#mdview-output .mdv-callout');
    expect(out).toContain('.mdv-callout-title');
  });

  it('丢弃 .workspace 等 Obsidian 私有 chrome 选择器', () => {
    const css = '.workspace { display: flex; } .markdown-preview-view { color: black; }';
    const { css: out, warnings } = importObsidianTheme(css, { id: 't' });
    expect(out).not.toContain('.workspace');
    expect(warnings.some((w) => w.includes('.workspace'))).toBe(true);
  });

  it('丢弃 .modal- 类', () => {
    const css = '.modal-bg { opacity: 0.5; }';
    const { css: out } = importObsidianTheme(css, { id: 't' });
    expect(out).not.toContain('.modal-bg');
  });

  it('保留 @media 与其内的转换后规则', () => {
    const css = '@media (min-width: 768px) { .markdown-preview-view { padding: 30px; } }';
    const { css: out } = importObsidianTheme(css, { id: 't' });
    expect(out).toContain('@media');
    expect(out).toContain('#mdview-output');
  });

  it('生成 obsidian sourceFormat 元数据', () => {
    const { meta } = importObsidianTheme('.markdown-preview-view {}', {
      id: 'minimal',
      name: 'Minimal',
      author: 'kepano',
    });
    expect(meta.sourceFormat).toBe('obsidian');
    expect(meta.id).toBe('minimal');
    expect(meta.name).toBe('Minimal');
    expect(meta.author).toBe('kepano');
  });

  it('cm-header-N 映射到对应 hN', () => {
    const css = '.cm-header-1 { font-size: 2em; } .cm-header-3 { font-size: 1.25em; }';
    const { css: out } = importObsidianTheme(css, { id: 't' });
    expect(out).toContain('#mdview-output h1');
    expect(out).toContain('#mdview-output h3');
  });

  it('注释不破坏规则解析', () => {
    const css =
      '/* this is a comment with .markdown-preview-view inside */\n' +
      '.markdown-preview-view { color: black; }';
    const { css: out } = importObsidianTheme(css, { id: 't' });
    expect(out).toContain('#mdview-output');
  });
});
