---
mdview: 1
title: mdview Cookbook
description: Real-world templates showing the right theme + extension combos for common writing scenarios.
theme: default
toc: true
---

# Cookbook

四个真实场景，每个都展示**主题 + 扩展**的最佳组合，以及典型 front matter 配置。把它们当模板用，复制改字。

## 场景索引

| 场景         | 推荐主题  | 推荐扩展                               | 模板                               |
| ------------ | --------- | -------------------------------------- | ---------------------------------- |
| 技术博客文章 | `medium`  | callout / color / math / mermaid / kbd | [tech-blog.md](./tech-blog.md)     |
| 产品 PRD     | `default` | callout / kbd                          | [product-prd.md](./product-prd.md) |
| 读书笔记     | `medium`  | callout                                | [book-note.md](./book-note.md)     |
| API 文档     | `github`  | callout / kbd                          | [api-doc.md](./api-doc.md)         |

## 通用配方原则

> [!tip] 元数据是文档的"演出说明"
> 在 front matter 里把主题、扩展、TOC、阅读时长一次声明清楚，所有 mdview viewer
> 都按你设定的方式呈现，不需要每个用户调他自己的偏好。

> [!note] 选主题靠"读者注意力"
> 长文 / 阅读体验优先 → `medium`（衬线、宽行距、窄列）；
> 技术内容 + 看一眼即走 → `default`（中性、紧凑）；
> README 风 / 拷贝到 GitHub 也认得 → `github`。

> [!warning] 扩展"按需启用"
> 不要无脑 `extensions: [所有]`。每开一个扩展会拉一个 hydrate 包，
> 加载时间和体积都会涨。只开你这篇真用得到的。
