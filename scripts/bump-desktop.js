#!/usr/bin/env node
// 桌面端版本同步 + 打 tag + 一键 push
// 用法:
//   pnpm release:desktop:bump 0.1.0           # bump + commit + push main + tag + push tag
//   pnpm release:desktop:bump 0.1.0 --dry-run # 只 bump 文件, 不 commit/push (本地试)
//
// 设计 (避免 main 与 tag 分叉, 见 commit 5b0fb20 之前那次事故):
//   1. 预检: 必须在 main, working tree 干净, local main == origin/main, tag 未存在
//   2. 顺序: bump 文件 -> commit -> push main -> (push 成功才) tag -> push tag
//      这样 tag 永远落在 origin/main 的某个真实 commit 上, 永不分叉
//   3. 任一步失败立即退出, 不留半成品状态
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const VERSION = argv.find((a) => !a.startsWith('--'));

const SEMVER = /^[0-9]+\.[0-9]+\.[0-9]+(?:-[a-zA-Z0-9.]+)?$/;
if (!VERSION || !SEMVER.test(VERSION)) {
  console.error('Usage: bump-desktop.js <semver> [--dry-run]   e.g. 0.1.0  or  0.2.0-beta.1');
  process.exit(1);
}

const PKG = resolve(ROOT, 'apps/desktop/package.json');
const TAURI = resolve(ROOT, 'apps/desktop/src-tauri/tauri.conf.json');
const CARGO = resolve(ROOT, 'apps/desktop/src-tauri/Cargo.toml');

function git(args, opts = {}) {
  return spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', ...opts });
}
function gitOrDie(args) {
  const r = spawnSync('git', args, { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
function abort(msg) {
  console.error(`\n\u2717 ${msg}\n`);
  process.exit(1);
}

const TAG = `desktop-v${VERSION}`;

// ── 1. 预检 ─────────────────────────────────────────────────────
if (!DRY_RUN) {
  const branch = (git(['rev-parse', '--abbrev-ref', 'HEAD']).stdout || '').trim();
  if (branch !== 'main') abort(`必须在 main 分支 (当前在 '${branch}')`);

  const dirty = (git(['status', '--porcelain']).stdout || '').trim();
  if (dirty) abort(`working tree 不干净, 先 commit / stash:\n${dirty}`);

  console.log('Fetching origin to sync ref state…');
  gitOrDie(['fetch', 'origin', 'main', '--tags']);
  const localSha = (git(['rev-parse', 'main']).stdout || '').trim();
  const remoteSha = (git(['rev-parse', 'origin/main']).stdout || '').trim();
  if (localSha !== remoteSha) {
    const ab = (git(['rev-list', '--left-right', '--count', 'origin/main...main']).stdout || '').trim();
    abort(
      `local main 与 origin/main 不一致 (behind\tahead = ${ab})\n` +
      `先跑 \`git pull origin main --rebase\` (或确认 ahead 后 \`git push\`) 再重试`,
    );
  }

  if (git(['rev-parse', '--verify', `refs/tags/${TAG}`]).status === 0) {
    abort(`tag ${TAG} 本地已存在`);
  }
  const remoteTag = (git(['ls-remote', '--tags', 'origin', `refs/tags/${TAG}`]).stdout || '').trim();
  if (remoteTag) abort(`tag ${TAG} 已经在 origin 上了`);
}

// ── 2. 改三处版本字段 ────────────────────────────────────────────
function patchJson(path) {
  const j = JSON.parse(readFileSync(path, 'utf8'));
  const old = j.version;
  j.version = VERSION;
  writeFileSync(path, JSON.stringify(j, null, 2) + '\n');
  console.log(`  ${path}  ${old} -> ${VERSION}`);
}
function patchCargo(path) {
  const src = readFileSync(path, 'utf8');
  const next = src.replace(/^version\s*=\s*"[^"]+"/m, `version = "${VERSION}"`);
  if (next === src) throw new Error(`Cargo.toml: 没找到 [package].version 行 -> ${path}`);
  writeFileSync(path, next);
  console.log(`  ${path}  -> ${VERSION}`);
}

console.log(`Bumping desktop to ${VERSION}…`);
patchJson(PKG);
patchJson(TAURI);
patchCargo(CARGO);

if (DRY_RUN) {
  console.log('\n--dry-run: 文件已改, 不会 commit/tag/push. 想撤销跑 `git checkout -- ' +
    'apps/desktop/package.json apps/desktop/src-tauri/tauri.conf.json apps/desktop/src-tauri/Cargo.toml`');
  process.exit(0);
}

// ── 3. commit -> push main -> tag -> push tag ────────────────────
gitOrDie(['add', PKG, TAURI, CARGO]);
gitOrDie(['commit', '-m', `chore(desktop): bump to ${VERSION}`]);

console.log('\nPushing main…');
const pushMain = spawnSync('git', ['push', 'origin', 'main'], { cwd: ROOT, stdio: 'inherit' });
if (pushMain.status !== 0) {
  console.error(
    '\n\u2717 push main 失败 (可能有人在 fetch 之后又推了一次).\n' +
    '解决: git pull origin main --rebase\n' +
    '      git push origin main\n' +
    '      git tag ' + TAG + '\n' +
    '      git push origin ' + TAG + '\n' +
    '本地 bump commit 已留在 HEAD, 没创建 tag.',
  );
  process.exit(pushMain.status ?? 1);
}

// main 已经推上去, 此时打 tag 一定指向 origin/main 上的某个 commit, 不会变成 orphan
gitOrDie(['tag', TAG]);
console.log(`Pushing tag ${TAG}…`);
gitOrDie(['push', 'origin', TAG]);

console.log(`\n\u2713 Released ${TAG}.`);
console.log(`Watch CI:  https://github.com/kip2team/mdview/actions/workflows/release-desktop.yml`);
