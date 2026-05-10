// Tauri 主入口 —— 把生命周期交给 lib crate 处理，便于跨平台 entry point 一致
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    mdview_desktop_lib::run()
}
