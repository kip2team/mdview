// 引擎渲染性能基线 —— `pnpm --filter @mdview/core exec vitest bench`
// 三档 fixture：small / medium / large
import { bench, describe } from 'vitest';
import { render } from './render.js';

const SMALL = `# Hello

Just a paragraph.

- one
- two
- three
`;

const MEDIUM = generateMedium();
const LARGE = generateLarge();

describe('render — small (~250B)', () => {
  bench('plain', () => {
    render(SMALL);
  });
  bench('with all extensions', () => {
    render(SMALL, {
      extensions: [
        'mdv:color',
        'mdv:callout',
        'mdv:math',
        'mdv:mermaid',
        'mdv:kbd',
        'mdv:details',
        'mdv:sub-sup',
        'mdv:badge',
      ],
    });
  });
});

describe('render — medium (~50KB)', () => {
  bench('plain', () => {
    render(MEDIUM);
  });
  bench('with all extensions', () => {
    render(MEDIUM, {
      extensions: [
        'mdv:color',
        'mdv:callout',
        'mdv:math',
        'mdv:mermaid',
        'mdv:kbd',
        'mdv:details',
        'mdv:sub-sup',
        'mdv:badge',
      ],
    });
  });
});

describe('render — large (~500KB)', () => {
  bench('plain', () => {
    render(LARGE);
  });
});

// ── fixtures ──────────────────────────────────────────────────

function generateMedium(): string {
  const sections: string[] = ['# Big document\n'];
  for (let i = 0; i < 50; i++) {
    sections.push(`## Section ${i}`);
    sections.push('Lorem ipsum dolor sit amet, **consectetur** adipiscing *elit*.');
    sections.push('Press [[Cmd+K]] for #ff6b35 awesome.');
    sections.push('> [!note] Sample callout');
    sections.push('> with markdown content.');
    sections.push('```ts');
    sections.push(`function foo${i}() { return ${i}; }`);
    sections.push('```');
    sections.push('| col1 | col2 | col3 |');
    sections.push('| --- | --- | --- |');
    sections.push('| a | b | c |');
    sections.push('');
  }
  return sections.join('\n');
}

function generateLarge(): string {
  // 重复 medium 10 倍 —— 模拟一份"超长技术博客"的 markdown
  const m = generateMedium();
  return Array(10).fill(m).join('\n\n');
}
