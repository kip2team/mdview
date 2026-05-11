#!/usr/bin/env node
// 一键三连发：飞行检查 → web → cdn → npm
// 任一环节失败立即停止，给出明确的回滚指令
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

// 步骤定义：每步独立、有清晰入口、失败可回滚
const steps = [
  { name: 'pre-flight check', cmd: 'pnpm', args: ['release:check'] },
  { name: 'build all packages', cmd: 'pnpm', args: ['build'] },
  { name: 'deploy mdview.sh (Workers)', cmd: 'pnpm', args: ['release:web'] },
  { name: 'deploy cdn.mdview.sh (Pages)', cmd: 'pnpm', args: ['release:cdn'] },
  { name: 'publish @mdview/* to npm', cmd: 'pnpm', args: ['changeset', 'publish'] },
  { name: 'push tags to GitHub', cmd: 'git', args: ['push', '--follow-tags'] },
];

let stepIdx = 0;
for (const step of steps) {
  stepIdx++;
  console.log(`\n${cyan(`[${stepIdx}/${steps.length}]`)} ${step.name}`);
  console.log(dim(`  $ ${step.cmd} ${step.args.join(' ')}`));

  const r = spawnSync(step.cmd, step.args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (r.status !== 0) {
    console.log(red(`\n✗ failed at step ${stepIdx}: ${step.name}`));
    console.log(dim(`  Exit code: ${r.status}`));
    console.log(dim(`  Resume from this step after fixing:`));
    console.log(
      dim(`    pnpm ${step.args.join(' ').startsWith('release:') ? step.args[0] : 'release:all'}`),
    );
    process.exit(r.status ?? 1);
  }
}

console.log(green(`\n✓ all surfaces released.\n`));
console.log(`mdview.sh         ${dim('https://mdview.sh')}`);
console.log(`cdn.mdview.sh     ${dim('https://cdn.mdview.sh/manifest.json')}`);
console.log(`npm               ${dim('https://www.npmjs.com/~kip2 (or your username)')}`);
