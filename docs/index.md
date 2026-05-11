---
mdview: 1
title: mdview Documentation
description: A reader-first home for Markdown — engine, format, themes and tools.
theme: default
toc: true
---

# Welcome to mdview

mdview 是一套以"渲染引擎"为核心的 Markdown 阅读 / 分享 / 编辑生态。一份核心引擎，多端消费：桌面端、Web、浏览器扩展、IDE 插件、CLI、MCP。

## 从这里开始

- [PRD & Plan](/docs/01-PRD-and-Plan) —— 产品愿景、架构、路线图
- [.mdv.html Format Spec](/docs/02-Format-Spec) —— 自渲染 HTML 协议规范
- [Feature Backlog](/docs/03-Feature-Backlog) —— 全量功能候选池
- [Getting Started](/docs/getting-started) —— 把项目跑起来

## 三个支柱

> [!info] Engine-first
> 所有端共用 `@mdview/core`。新增端 = 写一个薄壳。

> [!info] 自渲染 HTML（`.mdv.html`）
> 导出一个 HTML 文件，里面主体仍是原始 Markdown。任何文本编辑器都能改，浏览器直接打开就能看，且可换主题。

> [!info] 极简沉浸式阅读
> 双击 `.md` 即开。不打扰你看内容。

## 与 GitHub / Typora / Obsidian 的差异

GitHub 自带渲染、Typora 所见即所得、Obsidian 是知识管理。mdview 把战场放在**阅读器与跨端引擎**——同一份 Markdown 在桌面、Web、IDE、AI 工具里看起来都一样美。
