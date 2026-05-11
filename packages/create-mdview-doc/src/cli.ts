#!/usr/bin/env node
// `npm create mdview-doc <name>` —— 拉一个 mdview 风味的样板项目
// 包含：
//   <name>/
//     ├── <name>.md           # 带 mdview 元数据的样板正文
//     ├── README.md           # 用户怎么开始
//     └── package.json        # 内嵌 mdview-cli，npm run preview / export
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { cac } from 'cac';

const cli = cac('create-mdview-doc');

cli
  .command('[name]', '在当前目录下脚手架一个 mdview 文档项目')
  .option('--theme <id>', '初始主题（default / github / medium）', { default: 'medium' })
  .option('--no-git', '跳过 git init')
  .action(
    async (name: string | undefined, options: { theme: string; git: boolean }) => {
      const projectName = (name ?? 'mdview-doc').toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const target = resolve(process.cwd(), projectName);
      if (existsSync(target)) {
        console.error(`error: directory already exists: ${target}`);
        process.exit(1);
      }
      await mkdir(target, { recursive: true });

      const docFilename = `${projectName}.md`;
      await writeFile(resolve(target, docFilename), starterDoc(projectName, options.theme), 'utf8');
      await writeFile(resolve(target, 'package.json'), starterPkg(projectName), 'utf8');
      await writeFile(resolve(target, 'README.md'), starterReadme(projectName, docFilename), 'utf8');
      await writeFile(resolve(target, '.gitignore'), '*.mdv.html\nnode_modules\n', 'utf8');

      console.log(`✓ created ${target}`);
      console.log('\nNext steps:\n');
      console.log(`  cd ${projectName}`);
      console.log(`  npm install`);
      console.log(`  npm run preview          # 在浏览器里预览`);
      console.log(`  npm run export:standalone # 导出离线 .mdv.html`);
      console.log('');
    },
  );

cli.help();
cli.version('0.0.1');
cli.parse();

// ── 样板内容 ─────────────────────────────────────────────────

function starterDoc(name: string, theme: string): string {
  const title = name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return `---
mdview: 1
title: ${title}
description: A mdview-flavored Markdown document.
theme: ${theme}
toc: true
readingTime: true
extensions:
  - mdv:color
  - mdv:callout
---

# ${title}

This is your new mdview document. Edit \`${name}.md\` and run \`npm run preview\`.

## What can I do with this?

> [!tip] mdview = Markdown that ships
> Write in Markdown. Get a beautiful, themable, shareable HTML out of it.

## Try the extensions

The brand colors are #0969da and #ff6b35. Hex literals get a tiny swatch.

## Learn more

- [mdview docs](https://mdview.sh/docs)
- [Format spec](https://mdview.sh/docs/02-Format-Spec)
- [GitHub](https://github.com/kip2team/mdview)
`;
}

function starterPkg(name: string): string {
  return JSON.stringify(
    {
      name,
      version: '0.0.1',
      private: true,
      scripts: {
        preview: `mdview render ${name}.md --theme medium > ${name}.preview.html && open ${name}.preview.html`,
        'export:progressive': `mdview export ${name}.md --form progressive`,
        'export:minimal': `mdview export ${name}.md --form minimal`,
        'export:standalone': `mdview export ${name}.md --form standalone`,
        'export:all': `mdview export ${name}.md --form all`,
      },
      dependencies: {
        '@mdview/cli': 'latest',
      },
    },
    null,
    2,
  ) + '\n';
}

function starterReadme(name: string, docFile: string): string {
  return `# ${name}

A mdview-flavored Markdown document. Edit \`${docFile}\`, then:

\`\`\`bash
npm install                  # 第一次运行先装 @mdview/cli
npm run preview              # 在浏览器里预览
npm run export:standalone    # 导出离线 .mdv.html，可邮件分享
npm run export:progressive   # 导出常规 .mdv.html，需要 cdn.mdview.sh 在线
npm run export:all           # 三种形态各一份
\`\`\`

## 改主题

打开 \`${docFile}\`，把 front matter 里的 \`theme:\` 字段改成 \`default\` / \`github\` / \`medium\`。

## 加内容扩展

\`extensions:\` 数组里加（按需）：

- \`mdv:color\` —— hex 色值显示色块
- \`mdv:callout\` —— Obsidian 风格 \`> [!warning]\` 提示块
- \`mdv:math\` —— \`$inline$\` / \`$$block$$\` 公式
- \`mdv:mermaid\` —— \`\`\`mermaid 流程图

详见 [mdview 文档](https://mdview.sh/docs)。
`;
}
