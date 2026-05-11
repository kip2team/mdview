// 应用内自动更新封装
// 走 tauri-plugin-updater + tauri-plugin-process,直接增量替换 .app bundle,
// 不用让用户重新拖 dmg。流程: check() 拿 latest.json -> downloadAndInstall() -> relaunch()。
//
// 启用前提(README/release 流程也要更新):
//   1. `pnpm tauri signer generate -w ~/.tauri/mdview.key` 生成 keypair
//   2. tauri.conf.json 加 plugins.updater = { endpoints: [...], pubkey: "..." }
//   3. CI 在 release tag 时产出 mdview.app.tar.gz + .sig 上传 GitHub Release,
//      并把 latest.json (含 url+signature+version) publish 到 endpoints 里那个地址
// 任何步骤没就位时,check() 都会抛错,这里统一 try/catch 不打扰用户。

import type { Update } from '@tauri-apps/plugin-updater';

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

const isTauri = (): boolean => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export interface AvailableUpdate {
  version: string;
  notes?: string;
  /** 调用一次开始下载并安装,完成后会自动 relaunch */
  install(onProgress?: (downloaded: number, total: number | undefined) => void): Promise<void>;
}

/** 检查是否有新版本 —— 没有 / 出错都返回 null,不打扰用户。
 * 日志用 console.info / console.warn(不是 debug),DevTools 默认 level 就能看到。 */
export async function checkForUpdate(): Promise<AvailableUpdate | null> {
  if (!isTauri()) {
    console.info('[mdview] updater: skipped (not Tauri runtime)');
    return null;
  }
  try {
    const { check } = await import('@tauri-apps/plugin-updater');
    console.info('[mdview] updater: checking endpoint…');
    const update: Update | null = await check();
    if (!update) {
      console.info('[mdview] updater: already up to date');
      return null;
    }
    console.info(
      `[mdview] updater: new version ${update.version} available (current ${update.currentVersion})`,
    );
    return {
      version: update.version,
      notes: update.body,
      async install(onProgress) {
        let downloaded = 0;
        let total: number | undefined;
        await update.downloadAndInstall((event) => {
          if (event.event === 'Started') {
            total = event.data.contentLength;
            console.info(`[mdview] updater: download started (${total ?? '?'} bytes)`);
          } else if (event.event === 'Progress') {
            downloaded += event.data.chunkLength;
            onProgress?.(downloaded, total);
          } else if (event.event === 'Finished') {
            console.info('[mdview] updater: download finished, installing…');
          }
        });
        // 安装完直接重启,否则用户得手动重开应用才能用新版本
        const { relaunch } = await import('@tauri-apps/plugin-process');
        await relaunch();
      },
    };
  } catch (err) {
    // 网络不通 / endpoint 4xx-5xx / 签名校验失败 / 配置缺失 都会抛到这里
    // 用 warn 让用户能在 DevTools Console 看到具体原因,而不是静默
    console.warn('[mdview] updater: check failed —', err);
    return null;
  }
}
