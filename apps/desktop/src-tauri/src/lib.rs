// mdview 桌面端 Rust 后端 —— 当前职责极简：
// 1. 注册 dialog / fs 插件，前端通过它们读文件
// 2. 监听系统级"用文件打开"事件（macOS 双击 .md / Windows 命令行参数）
//    并通过 mdview://open-path 事件推送到前端
use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
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
