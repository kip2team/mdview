# Desktop Auto-Update — 整条链路

桌面端通过 [tauri-plugin-updater](https://v2.tauri.app/plugin/updater/) 实现"应用内增量更新":
用户点 Install → 下载新 `.app` tarball → 验证 minisign 签名 → 替换 bundle → 重启,**不需要重新拖 dmg**。

## 一图看全流程

```
开发本地                            GitHub                            用户机器
─────────                          ────────                          ────────
pnpm release:desktop:bump 0.1.0
  └─ 改 3 处版本字段
  └─ git commit + tag desktop-v0.1.0
git push origin main
git push origin desktop-v0.1.0
                          ─────►  release-desktop.yml 触发
                                   ├─ macos-14 build (universal-apple-darwin)
                                   ├─ tauri-action 用 minisign 私钥签 .app.tar.gz
                                   ├─ 上传到 GH Release: dmg + app.tar.gz + .sig + latest.json
                                   └─ commit latest.json 到 main:
                                        apps/mdview-sh/public/release/latest.json
                                                                   ─────►  桌面应用启动 5s 后
                                                                            ├─ check() GET raw.githubusercontent.com/.../latest.json
                                                                            ├─ 比版本: 0.1.0 > 当前
                                                                            └─ 右下角弹 "New version 0.1.0 available · Install"
                                                                                  ↓ 用户点 Install
                                                                            ├─ 下载 app.tar.gz
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

- `~/.tauri/mdview.key` —— **私钥,不要进 Git**
- `~/.tauri/mdview.key.pub` —— 公钥(已经写进 [tauri.conf.json](../apps/desktop/src-tauri/tauri.conf.json))

> 当前仓库已经接好了一把 keypair。要换密钥重新生成,记得同步更新 `tauri.conf.json` 的 `pubkey` 字段。

### 2. 把私钥塞进 GitHub Secrets

仓库 → Settings → Secrets and variables → Actions:

| Secret | 值 |
| --- | --- |
| `TAURI_SIGNING_PRIVATE_KEY` | `cat ~/.tauri/mdview.key` 的完整内容 |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | 生成时设的密码;`--ci` 模式无密码就留空 |

> 提交 secrets 之前最后确认一次 `~/.tauri/mdview.key` **没被 git 跟踪**。
> 通常它在 `~/.tauri/` 下,不会进项目目录,但如果有自定义路径要小心。

### 3. Endpoint 已配好

[tauri.conf.json](../apps/desktop/src-tauri/tauri.conf.json) 的 `plugins.updater.endpoints`:

```json
[
  "https://raw.githubusercontent.com/kip2team/mdview/main/apps/mdview-sh/public/release/latest.json",
  "https://mdview.sh/release/latest.json"
]
```

第一个是 GitHub raw URL,commit 到 main 立即生效;第二个是 Cloudflare 上的 `mdview.sh`,做 secondary endpoint(plugin 内置按顺序探测,这条要等 mdview-sh 重新部署才有最新文件)。

## 每次发版

```bash
# 1. 升版本(同步改 package.json / tauri.conf.json / Cargo.toml + 提交 + 打 tag)
pnpm release:desktop:bump 0.1.0

# 2. 推 main + tag,触发 GitHub Actions
git push origin main
git push origin desktop-v0.1.0
```

完成。CI ~10 分钟后:

- GitHub Releases 多一条 `mdview desktop-v0.1.0`,资产里有 dmg + app.tar.gz + .sig + latest.json。
- main 分支多一个 commit 把新的 `latest.json` 落到 `apps/mdview-sh/public/release/`。
- 在线运行的旧版应用启动 5s 后,会在右下角看到更新 banner。

## 用户视角

- **首次安装**: 从 GitHub Releases 或官网下载 dmg → 拖到 /Applications。
- **后续更新**: 应用启动 5s 后,如果有新版,右下角浮一个 pill:
  > New version **0.1.0** available · `Install & restart`
  点一下,下载 + 验签 + 替换 + 重启,全程不离开应用。
- **手动检查**: 菜单 Help → "Check for Updates…",立即触发一次 check;UI 给即时反馈,DevTools Console 有详细日志(`[mdview] updater: …`)。

## 常见问题

| 现象 | 原因 | 怎么排查 |
| --- | --- | --- |
| 控制台无 updater 日志 | `checkForUpdate()` 没调到 | 看 [App.tsx](../apps/desktop/src/App.tsx) 里 5s `setTimeout` 是否被 unmount 提前清理 |
| `[mdview] updater: check failed — Network` | endpoint 不通 | 浏览器直接打开 endpoint URL 验,或检查代理/证书 |
| `[mdview] updater: check failed — signature` | latest.json 里的 .sig 与本地 pubkey 不匹配 | 私钥/公钥对应不上 → 重新生成或修正 secrets |
| 一直说 `already up to date` | manifest 里的 version ≤ 当前 | bump 脚本是否真的改到 3 处 + push 是否成功 |
| GH Release 里没有 latest.json | tauri-action 没生成 | 看 build job 日志,常见是 `args: --target universal-apple-darwin` 拼错 |
| `latest.json` 没 commit 到 main | `publish-manifest` job 失败 | Actions 里看 `gh release download` step,大概率 GH API 延迟,workflow 已 sleep 10s 兜底,极端情况手动 re-run |

## Windows / Linux 何时加

当前工作流只构建 macOS universal。要加 Windows/Linux:

1. 把 `release-desktop.yml` 的单 macos job 改成 matrix:
   ```yaml
   strategy:
     matrix:
       include:
         - { runner: macos-14,    target: universal-apple-darwin }
         - { runner: windows-latest, target: x86_64-pc-windows-msvc }
         - { runner: ubuntu-22.04,    target: x86_64-unknown-linux-gnu }
   ```
2. tauri-action 会自动产出对应平台的资产并合并到同一个 `latest.json` 的 `platforms` 字段。
3. Windows 还需要 EV code signing(否则用户首次会看到 SmartScreen 警告);Linux 端 AppImage / deb 都支持自更新。

那一步等到真有 Win/Linux 用户再做。
