#!/bin/bash
# 修复 macOS Gatekeeper "已损坏" 警告 —— mdview 暂未做 Apple notarization,
# 从网络下载的 .app 会被打上 com.apple.quarantine 扩展属性,Gatekeeper 拒绝打开。
# 这个脚本帮你一键移除该属性。
#
# Fix the macOS Gatekeeper "app is damaged" warning. mdview is not yet
# Apple-notarized; macOS marks downloaded apps as quarantined and refuses
# to launch them. This script removes the quarantine attribute.

set -e

APP="/Applications/mdview.app"

clear
cat <<'BANNER'

  ┌────────────────────────────────────────────────┐
  │  mdview — Fix Gatekeeper "damaged" warning     │
  │  mdview — 修复 macOS 打开报错                  │
  └────────────────────────────────────────────────┘

BANNER

if [ ! -d "$APP" ]; then
  echo "❌  没有在 /Applications 里找到 mdview.app"
  echo "    请先把 mdview 从 dmg 里拖到 Applications,然后重新双击本脚本。"
  echo
  echo "❌  mdview.app not found in /Applications."
  echo "    Drag mdview.app from the dmg into the Applications folder first,"
  echo "    then double-click this script again."
  echo
  read -r -p "按回车关闭 / Press Enter to close ... " _
  exit 1
fi

echo "🔧  正在移除 mdview 的 macOS 隔离属性 ..."
echo "    Removing macOS quarantine attribute ..."
echo

if xattr -dr com.apple.quarantine "$APP" 2>/dev/null; then
  echo "✅  完成 / Done."
else
  echo "    需要管理员权限,请输入开机密码:"
  echo "    Administrator privileges required — enter your login password:"
  echo
  sudo xattr -dr com.apple.quarantine "$APP"
  echo "✅  完成 / Done."
fi

echo
echo "🎉  现在可以从启动台 / Dock / Applications 打开 mdview。"
echo "    You can now launch mdview from Launchpad, Dock, or Applications."
echo
read -r -p "按回车关闭 / Press Enter to close ... " _
