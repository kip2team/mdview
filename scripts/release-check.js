#!/usr/bin/env node
// 发布前飞行检查 —— 一键确认所有发布通道的凭证 / 配置就位
// 通过：跑 `pnpm release:check`
// 设计原则：每条检查独立、给出明确的修复指令、失败不阻塞下一条
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const ok = '\x1b[32m✓\x1b[0m';
const fail = '\x1b[31m✗\x1b[0m';
const warn = '\x1b[33m⚠\x1b[0m';
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

let failures = 0;

function check(label, fn) {
  process.stdout.write(`${label}... `);
  try {
    const result = fn();
    if (result === false) {
      console.log(fail);
      failures++;
    } else if (result === 'warn') {
      console.log(warn);
    } else {
      console.log(ok + (typeof result === 'string' ? ' ' + dim(result) : ''));
    }
  } catch (err) {
    console.log(fail + ' ' + dim(String(err.message ?? err)));
    failures++;
  }
}

function exec(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

console.log('\nmdview release pre-flight\n');

// ── npm ────────────────────────────────────────────────
console.log(dim('npm packages'));

check('  npm whoami (npmjs.org)', () => {
  try {
    const user = exec('npm whoami --registry=https://registry.npmjs.org');
    return user || false;
  } catch {
    console.log('\n    Fix: npm login --registry=https://registry.npmjs.org');
    return false;
  }
});

check('  @mdview scope registry', () => {
  const reg = exec('npm config get @mdview:registry');
  if (reg && reg.includes('npmjs.org')) return reg;
  console.log('\n    Fix: npm config set @mdview:registry https://registry.npmjs.org');
  return 'warn';
});

check('  granular access token in .npmrc', () => {
  const npmrc = resolve(process.env.HOME ?? '', '.npmrc');
  if (!existsSync(npmrc)) return false;
  const content = readFileSync(npmrc, 'utf8');
  if (content.includes('//registry.npmjs.org/:_authToken=')) return 'token set';
  console.log('\n    Fix: 在 npmjs.com 创建 Granular Token（Bypass 2FA）后追加到 ~/.npmrc');
  return false;
});

// ── Cloudflare ─────────────────────────────────────────
console.log('\n' + dim('Cloudflare (Workers + Pages)'));

check('  wrangler installed', () => {
  return exec('wrangler --version');
});

check('  wrangler logged in', () => {
  try {
    const out = exec('wrangler whoami');
    if (out.includes('@')) return out.split('\n').find((l) => l.includes('@')) ?? 'logged in';
    return false;
  } catch {
    console.log('\n    Fix: wrangler login');
    return false;
  }
});

check('  apps/mdview-sh wrangler.toml has KV ids', () => {
  const toml = readFileSync(resolve(ROOT, 'apps/mdview-sh/wrangler.toml'), 'utf8');
  if (toml.includes('REPLACE_WITH_REAL_')) {
    console.log('\n    Fix: 创建 KV namespace 后把 id 填到 wrangler.toml');
    return false;
  }
  return 'configured';
});

// ── git ────────────────────────────────────────────────
console.log('\n' + dim('git'));

check('  on main branch', () => {
  const branch = exec('git branch --show-current');
  return branch === 'main' ? branch : 'warn';
});

check('  no uncommitted changes', () => {
  const status = exec('git status --porcelain');
  if (status) {
    console.log('\n    ' + dim(status.split('\n').slice(0, 3).join('\n    ')));
    return 'warn';
  }
  return 'clean';
});

// ── build sanity ──────────────────────────────────────
console.log('\n' + dim('workspace'));

check('  pnpm-lock.yaml present', () => {
  return existsSync(resolve(ROOT, 'pnpm-lock.yaml'));
});

check('  all packages have publishConfig.access=public', () => {
  const pkgs = [
    'core',
    'themes',
    'format',
    'cli',
    'engine-browser',
    'importer',
    'mcp',
    'create-mdview-doc',
  ];
  const missing = [];
  for (const p of pkgs) {
    const pj = JSON.parse(
      readFileSync(resolve(ROOT, 'packages', p, 'package.json'), 'utf8'),
    );
    if (pj.publishConfig?.access !== 'public') missing.push(p);
  }
  if (missing.length) {
    console.log('\n    Missing: ' + missing.join(', '));
    return false;
  }
  return 'all 8 ok';
});

// ── 总结 ─────────────────────────────────────────────
console.log();
if (failures === 0) {
  console.log(`\x1b[32mAll critical checks passed.\x1b[0m\n`);
  console.log(`Next:`);
  console.log(`  pnpm release:web      # mdview.sh Astro Worker`);
  console.log(`  pnpm release:cdn      # cdn.mdview.sh Pages`);
  console.log(`  pnpm release:npm      # 所有 @mdview/* 包`);
  console.log(`  pnpm release:all      # 三条线按顺序`);
} else {
  console.log(`\x1b[31m${failures} failure(s). Fix the items above before release.\x1b[0m`);
  process.exit(1);
}
