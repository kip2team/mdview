// mdview 桌面端 Rust 后端
// 职责：
// 1. 注册 dialog / fs 插件，前端通过它们读文件
// 2. 监听系统级"用文件打开"事件（macOS 双击 .md / Windows 命令行参数），
//    并通过 mdview://open-path 事件推送到前端
// 3. 注册 native 菜单（File / View / Help），菜单项触发 mdview://menu/<id> 事件让前端响应
use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
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
            let help_menu = SubmenuBuilder::new(app, "Help").item(&docs).build()?;

            let menu = MenuBuilder::new(app)
                .items(&[&file_menu, &view_menu, &help_menu])
                .build()?;
            app.set_menu(menu)?;
            // 命令行参数里第一个非自身的参数视作待打开文件路径
            // macOS 双击 .md 时也会把路径作为命令行参数传入
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
        .run(tauri::generate_context!())
        .expect("error while running mdview desktop");
}
