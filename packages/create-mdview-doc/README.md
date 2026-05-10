# create-mdview-doc

零配置脚手架，一句命令生成一份带 mdview 元数据的 Markdown 项目。

## 用法

```bash
npm create mdview-doc my-article
# 或
pnpm create mdview-doc my-article
# 或
yarn create mdview-doc my-article
```

会在当前目录下生成：

```
my-article/
├── my-article.md      # 带 front matter 的样板正文
├── package.json       # 包含 preview / export:* 脚本
├── README.md
└── .gitignore
```

## 选项

```bash
npm create mdview-doc my-article -- --theme github     # 选主题
npm create mdview-doc my-article -- --no-git           # 不自动 git init
```

## 然后

```bash
cd my-article
npm install
npm run preview            # 浏览器预览
npm run export:standalone  # 离线版 .mdv.html
```

详见生成的 `README.md`。
