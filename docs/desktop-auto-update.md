# Desktop Auto-Update — 整条链路

桌面端通过 [tauri-plugin-updater](https://v2.tauri.app/plugin/updater/) 实现"应用内增量更新":
用户点 Install → 下载新 `.app` tarball → 验证 minisign 签名 → 替换 bundle → 重启,**不需要重新拖 dmg**。

## 一图看全流程

```
开发本地                            GitHub                                       用户机器
─────────                          ────────                                      ────────
pnpm release:desktop:bump 0.1.0
  └─ 改 3 处版本字段
  └─ git commit + tag desktop-v0.1.0
git push origin main
git push origin desktop-v0.1.0
                          ─────►  release-desktop.yml 触发
                                   ├─ macos-14 matrix: aarch64 + x86_64 各 build 一次
                                   ├─ tauri-action 上传 dmg + app.tar.gz 到 GH Release
                                   ├─ 自家 step 用 tauri signer 重签 .app.tar.gz
                                   │  (绕开 tauri-action 单 arch 的 sig 上传 bug)
                                   ├─ 上传 .sig 到 GH Release + 写 manifest 片段 artifact
                                   ├─ publish-manifest job 合并两个片段出 latest.json
                                   └─ commit latest.json 到 main:
                                        apps/mdview-sh/public/release/latest.json
                                                                                ─────►  桌面应用启动 5s 后
                                                                                         ├─ check() GET https://mdview.sh/release/latest.json
                                                                                         ├─ 比版本: 0.1.0 > 当前
                                                                                         └─ 右下角弹 "New version 0.1.0 available · Install"
                                                                                              ↓ 用户点 Install
                                                                                         ├─ 下载对应 arch 的 .app.tar.gz
                                                                                         ├─ 用 pubkey 验 .sig
                                                                                         ├─ 替换 .app
                                                                                         └─ relaunch
```

## 一次性配置(只做一次)

### 1. 生成签名 keypair

```bash
cd apps/desktop
pnpm tauri signer generate -w ~/.tauri/mdview.key --ci
```

产出:

- `~/.tauri/mdview.key` —— **私钥,不要进 Git**(`tauri signer generate -w` 生成的文件本身就是单行 base64)
- `~/.tauri/mdview.key.pub` —— 公钥(已写进 [tauri.conf.json](../apps/desktop/src-tauri/tauri.conf.json))

> 当前仓库已经接好了一把 keypair。要换密钥重新生成,记得同步更新 `tauri.conf.json` 的 `pubkey` 字段。

### 2. 把私钥塞进 GitHub Secrets

仓库 → Settings → Secrets and variables → Actions:

| Secret | 值 |
| --- | --- |
| `TAURI_SIGNING_PRIVATE_KEY` | `cat ~/.tauri/mdview.key` 的完整内容(单行 base64) |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | `--ci` 模式无密码 → **不要创建**(GitHub 不允许空值;workflow 读 `${{ secrets.X }}` 解析为空字符串,signer 接受) |

> 提交 secrets 之前最后确认一次 `~/.tauri/mdview.key` **没被 git 跟踪**。

### 3. Endpoint 已配好

[tauri.conf.json](../apps/desktop/src-tauri/tauri.conf.json) 的 `plugins.updater.endpoints`:

```json
[
  "https://mdview.sh/release/latest.json",
  "https://raw.githubusercontent.com/kip2team/mdview/main/apps/mdview-sh/public/release/latest.json"
]
```

- 第一条 `mdview.sh/release/latest.json` —— **生产 endpoint**;需要 `mdview-sh` worker 部署最新版后才能拿到新 manifest(目前手动 `pnpm web:deploy`,或接 Cloudflare Workers Builds 让它跟着 main 自动重发)。
- 第二条 raw URL —— **仅在 repo 公开时匿名可达**;私有 repo 一定 404,只作内部 fallback。

## 每次发版

```bash
# 1. 升版本(同步改 package.json / tauri.conf.json / Cargo.toml + 提交 + 打 tag)
pnpm release:desktop:bump 0.1.0

# 2. 推 main + tag,触发 release-desktop.yml
git push origin main
git push origin desktop-v0.1.0

# 3. (临时,直到 web 自动部署接入 CI) 重新发 mdview-sh worker,让 endpoint 拿到新 manifest
pnpm web:deploy
```

完成后 CI ~7 分钟:

- GitHub Releases 多一条 `mdview desktop-v0.1.0`,资产里有 **per arch 各 3 件**:
  - `mdview_<arch>.app.tar.gz` + `.sig` —— 自更新走这个
  - `mdview_0.1.0_<arch>.dmg` —— 给首装用户
  - `<arch>` ∈ `{aarch64, x64}`
- main 分支多一个 commit 把新 `latest.json` 落到 `apps/mdview-sh/public/release/`。
- mdview-sh worker 重新发后,在线运行的旧版应用启动 5s 后能看到更新 banner。

## 用户视角

- **首次安装**: 从 GitHub Releases 或官网下载 dmg → 拖到 /Applications。
- **后续更新**: 应用启动 5s 后,如果有新版,右下角浮一个 pill:
  > New version **0.1.0** available · `Install & restart`
  点一下:下载 + 验签 + 替换 + 重启,全程不离开应用。
- **手动检查**: 菜单 Help → "Check for Updates…",立即触发一次 check;UI 给即时反馈,DevTools Console 有 `[mdview] updater: …` 日志。

## 常见问题

| 现象 | 原因 | 怎么排查 |
| --- | --- | --- |
| 控制台无 updater 日志 | `checkForUpdate()` 没调到 | 看 [App.tsx](../apps/desktop/src/App.tsx) 里 5s `setTimeout` 有没有被 unmount 提前清掉 |
| `[mdview] updater: check failed — Network` | endpoint 不通 | 浏览器直接打开 `https://mdview.sh/release/latest.json` 验,或检查代理/证书 |
| `[mdview] updater: check failed — signature` | latest.json 里的 `signature` 与桌面端 `pubkey` 不匹配 | 私钥/公钥对应不上 → 重新生成 keypair 并同步更新 `tauri.conf.json#pubkey` 与 secret |
| 一直 `already up to date` | manifest 里的 version ≤ 当前 | bump 脚本是否真的改到 3 处 + push 是否成功 |
| GH Release 里没有 `.sig` | tauri-action 非 universal 模式签名上传 bug;workflow 已自家 `tauri signer sign` 兜底重签 | 看 `Re-sign tarball + upload .sig` step 日志 |
| `latest.json` 没 commit 到 main | `publish-manifest` job 失败 | Actions 里看具体 step;常见是 fragments artifact 没产出(check build job 是否绿) |
| `mdview.sh/release/latest.json` 返回 500 | mdview-sh worker 还没重发,新文件不在 bundle 里 | `pnpm web:deploy` 手动发(或接 CF Workers Builds 自动化) |

## Windows / Linux 何时加

当前 workflow 只构建 macOS(`aarch64-apple-darwin` + `x86_64-apple-darwin` matrix)。要加 Windows / Linux:

1. matrix 增加对应 runner:
   ```yaml
   strategy:
     matrix:
       include:
         - { runner: macos-14, target: aarch64-apple-darwin, arch_short: aarch64, updater_key: darwin-aarch64 }
         - { runner: macos-14, target: x86_64-apple-darwin, arch_short: x64, updater_key: darwin-x86_64 }
         - { runner: windows-latest, target: x86_64-pc-windows-msvc, arch_short: x64, updater_key: windows-x86_64 }
         - { runner: ubuntu-22.04, target: x86_64-unknown-linux-gnu, arch_short: x64, updater_key: linux-x86_64 }
   ```
2. 重签步骤的产物路径需要对 Windows 用 `.exe`/`.msi`,对 Linux 用 `.AppImage` 适配。
3. Windows 还需要 EV code signing(否则用户首次会看到 SmartScreen 警告);Linux 端 AppImage / deb 都支持自更新。

那一步等到真有 Win/Linux 用户再做。
