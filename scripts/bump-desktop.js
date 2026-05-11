#!/usr/bin/env node
// 桌面端版本同步 + 打 tag
// 用法: pnpm release:desktop:bump 0.1.0
//
// 这个脚本改三处版本字段(必须保持一致, 否则 updater 比版本会出错):
//   1. apps/desktop/package.json
//   2. apps/desktop/src-tauri/tauri.conf.json
//   3. apps/desktop/src-tauri/Cargo.toml
// 然后 git add + commit + tag(desktop-v<version>),不自动 push。
// 推送之后 .github/workflows/release-desktop.yml 接管打包/签名/发布。
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

const VERSION = process.argv[2];
const SEMVER = /^[0-9]+\.[0-9]+\.[0-9]+(?:-[a-zA-Z0-9.]+)?$/;
if (!VERSION || !SEMVER.test(VERSION)) {
  console.error('Usage: bump-desktop.js <semver>   e.g. 0.1.0  or  0.2.0-beta.1');
  process.exit(1);
}

const PKG = resolve(ROOT, 'apps/desktop/package.json');
const TAURI = resolve(ROOT, 'apps/desktop/src-tauri/tauri.conf.json');
const CARGO = resolve(ROOT, 'apps/desktop/src-tauri/Cargo.toml');

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
  if (next === src) {
    throw new Error(`Cargo.toml: failed to find [package].version line in ${path}`);
  }
  writeFileSync(path, next);
  console.log(`  ${path}  -> ${VERSION}`);
}

console.log(`Bumping desktop to ${VERSION}…`);
patchJson(PKG);
patchJson(TAURI);
patchCargo(CARGO);

const tag = `desktop-v${VERSION}`;
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

run('git', ['add', PKG, TAURI, CARGO]);
run('git', ['commit', '-m', `chore(desktop): bump to ${VERSION}`]);
run('git', ['tag', tag]);

console.log(`\nTagged ${tag}.`);
console.log(`Next:  git push origin main && git push origin ${tag}`);
console.log(`That kicks off .github/workflows/release-desktop.yml.`);
