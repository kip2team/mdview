// mdview 桌面端 Rust 后端
// 职责：
// 1. 注册 dialog 插件 + 自家文件读写命令(read_markdown_file/write_markdown_file/...)。
//    不用 tauri-plugin-fs —— 那个走前端编译期 scope 白名单, Recent 等任意路径用例会被拒;
//    自家命令在 Rust 进程里直接 std::fs, 边界回到 OS 自己的 ACL/TCC, 首次访问触发系统授权弹窗。
// 2. 监听系统级"用文件打开"事件（macOS 双击 .md / Windows 命令行参数），
//    并通过 mdview://open-path 事件推送到前端
// 3. 注册 native 菜单（File / View / Help），菜单项触发 mdview://menu/<id> 事件让前端响应
use serde::Serialize;
use std::fs;
use std::path::Path;
use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::Emitter;

#[derive(Serialize)]
struct MarkdownEntry {
    name: String,
    path: String,
    #[serde(rename = "relativePath")]
    relative_path: String,
}

#[tauri::command]
fn read_markdown_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("{e}"))
}

#[tauri::command]
fn write_markdown_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| format!("{e}"))
}

/// 返回毫秒级 mtime,前端用来检测外部修改
#[tauri::command]
fn stat_mtime(path: String) -> Result<u64, String> {
    let meta = fs::metadata(&path).map_err(|e| format!("{e}"))?;
    let mtime = meta.modified().map_err(|e| format!("{e}"))?;
    let ms = mtime
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| format!("{e}"))?
        .as_millis() as u64;
    Ok(ms)
}

const MAX_ENTRIES: usize = 200;
const MD_EXTS: &[&str] = &["md", "markdown", "mdv"];

#[tauri::command]
fn list_markdown_dir(root: String) -> Result<Vec<MarkdownEntry>, String> {
    let root_path = Path::new(&root).to_path_buf();
    let mut out: Vec<MarkdownEntry> = Vec::new();
    collect_md(&root_path, &root_path, &mut out).map_err(|e| format!("{e}"))?;
    out.truncate(MAX_ENTRIES);
    Ok(out)
}

fn collect_md(root: &Path, dir: &Path, out: &mut Vec<MarkdownEntry>) -> std::io::Result<()> {
    if out.len() >= MAX_ENTRIES {
        return Ok(());
    }
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let name = entry.file_name().to_string_lossy().into_owned();
        // 跳过点开头隐藏目录和明显无关的大目录,避免扫穿巨型 monorepo
        if name.starts_with('.') || name == "node_modules" {
            continue;
        }
        let path = entry.path();
        let ft = entry.file_type()?;
        if ft.is_dir() {
            collect_md(root, &path, out)?;
            if out.len() >= MAX_ENTRIES {
                return Ok(());
            }
        } else if ft.is_file() {
            let ext = path
                .extension()
                .and_then(|s| s.to_str())
                .unwrap_or("")
                .to_ascii_lowercase();
            if MD_EXTS.contains(&ext.as_str()) {
                let rel = path
                    .strip_prefix(root)
                    .unwrap_or(&path)
                    .to_string_lossy()
                    .into_owned();
                out.push(MarkdownEntry {
                    name,
                    path: path.to_string_lossy().into_owned(),
                    relative_path: rel,
                });
            }
        }
        if out.len() >= MAX_ENTRIES {
            return Ok(());
        }
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        // plugin-updater + plugin-process: 让前端能 check()/downloadAndInstall()/relaunch().
        // 需要在 tauri.conf.json 配 endpoints + pubkey 才会真正下载更新, 否则 check() 静默失败。
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            read_markdown_file,
            write_markdown_file,
            stat_mtime,
            list_markdown_dir
        ])
        .on_menu_event(|app, event| {
            // 菜单点击 → 把 id 发给前端，前端 listen('mdview://menu/...') 响应
            let _ = app.emit("mdview://menu", event.id().0.as_str());
        })
        .setup(|app| {
            // 构造 menu
            let open = MenuItemBuilder::with_id("open", "Open File…")
                .accelerator("CmdOrCtrl+O")
                .build(app)?;
            let open_folder = MenuItemBuilder::with_id("open-folder", "Open Folder…")
                .accelerator("CmdOrCtrl+Shift+O")
                .build(app)?;
            let save = MenuItemBuilder::with_id("save", "Save")
                .accelerator("CmdOrCtrl+S")
                .build(app)?;
            let export_html = MenuItemBuilder::with_id("export", "Export as .mdv.html…")
                .accelerator("CmdOrCtrl+E")
                .build(app)?;
            let palette = MenuItemBuilder::with_id("palette", "Command Palette…")
                .accelerator("CmdOrCtrl+K")
                .build(app)?;
            let zen = MenuItemBuilder::with_id("zen", "Zen Mode")
                .accelerator("CmdOrCtrl+.")
                .build(app)?;
            let cycle_view = MenuItemBuilder::with_id("cycle-view", "Cycle View Mode")
                .accelerator("CmdOrCtrl+\\")
                .build(app)?;
            let docs = MenuItemBuilder::with_id("docs", "Documentation")
                .build(app)?;
            let check_updates =
                MenuItemBuilder::with_id("check-updates", "Check for Updates…").build(app)?;

            let file_menu = SubmenuBuilder::new(app, "File")
                .item(&open)
                .item(&open_folder)
                .separator()
                .item(&save)
                .item(&export_html)
                .build()?;
            let view_menu = SubmenuBuilder::new(app, "View")
                .item(&palette)
                .item(&cycle_view)
                .item(&zen)
                .build()?;
            let help_menu = SubmenuBuilder::new(app, "Help")
                .item(&docs)
                .item(&check_updates)
                .build()?;

            let menu = MenuBuilder::new(app)
                .items(&[&file_menu, &view_menu, &help_menu])
                .build()?;
            app.set_menu(menu)?;
            // 命令行参数 -> 待打开文件路径
            // 这条路径只对 Linux/Windows 命令行启动有用; macOS 双击 .md (Launch Services)
            // 走 Apple Event, 由下面 .run(...) 里的 RunEvent::Opened 处理。
            let args: Vec<String> = std::env::args().skip(1).collect();
            if let Some(path) = args.iter().find(|a| !a.starts_with('-')) {
                let handle = app.handle().clone();
                let path = path.clone();
                // 给前端 React 组件一点时间挂载好事件监听 —— 用 OS 线程小睡，零额外依赖
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(150));
                    let _ = handle.emit("mdview://open-path", path);
                });
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building mdview desktop")
        .run(|app_handle, event| {
            // macOS 双击 .md / "用 mdview 打开"会走 Apple Event (application:openURLs:),
            // 不进 std::env::args, 必须在这里接住; 否则应用启动后停在欢迎页 ——
            // 这是 0.0.2 之前的严重 bug。
            if let tauri::RunEvent::Opened { urls } = event {
                for url in urls {
                    // 只接受 file:// URL (custom schemes 暂不处理)
                    if let Ok(path) = url.to_file_path() {
                        if let Some(p) = path.to_str() {
                            let handle = app_handle.clone();
                            let p = p.to_string();
                            // 冷启动时 Opened 可能在前端 React 挂载完之前到达,
                            // 跟 cli args 那条路径一样 sleep 一下等 listener 就位
                            std::thread::spawn(move || {
                                std::thread::sleep(std::time::Duration::from_millis(300));
                                let _ = handle.emit("mdview://open-path", p);
                            });
                        }
                    }
                }
            }
        });
}
