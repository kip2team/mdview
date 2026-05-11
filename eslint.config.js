// ESLint flat config —— mdview 全 workspace 共享
// 规则尽量保守，主要拦明显错误，不强求风格细节（prettier 接管格式）
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

// node + browser globals 合集. 内联避免引入 `globals` npm 包(它原本只是 transitive dep).
// 这里把 mdview 实际碰到的全局变量列全, 太宽不会出错; 漏的话 no-undef 会立刻报出来再加。
const ENV_GLOBALS = {
  // Node
  console: 'readonly',
  process: 'readonly',
  Buffer: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  global: 'readonly',
  globalThis: 'readonly',
  require: 'readonly',
  module: 'readonly',
  exports: 'readonly',
  // 跨平台 timer / fetch
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  setImmediate: 'readonly',
  clearImmediate: 'readonly',
  queueMicrotask: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  TextEncoder: 'readonly',
  TextDecoder: 'readonly',
  fetch: 'readonly',
  Headers: 'readonly',
  Request: 'readonly',
  Response: 'readonly',
  AbortController: 'readonly',
  AbortSignal: 'readonly',
  Blob: 'readonly',
  FormData: 'readonly',
  crypto: 'readonly',
  performance: 'readonly',
  // Browser / Webview
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  location: 'readonly',
  history: 'readonly',
  localStorage: 'readonly',
  sessionStorage: 'readonly',
  HTMLElement: 'readonly',
  HTMLAnchorElement: 'readonly',
  HTMLButtonElement: 'readonly',
  HTMLDivElement: 'readonly',
  HTMLInputElement: 'readonly',
  HTMLLinkElement: 'readonly',
  HTMLDialogElement: 'readonly',
  HTMLFormElement: 'readonly',
  HTMLImageElement: 'readonly',
  HTMLScriptElement: 'readonly',
  HTMLStyleElement: 'readonly',
  HTMLTextAreaElement: 'readonly',
  HTMLSelectElement: 'readonly',
  HTMLOptionElement: 'readonly',
  Element: 'readonly',
  Node: 'readonly',
  NodeList: 'readonly',
  Event: 'readonly',
  KeyboardEvent: 'readonly',
  MouseEvent: 'readonly',
  DragEvent: 'readonly',
  CustomEvent: 'readonly',
  PointerEvent: 'readonly',
  FocusEvent: 'readonly',
  InputEvent: 'readonly',
  WheelEvent: 'readonly',
  ClipboardEvent: 'readonly',
  CSSStyleDeclaration: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  ResizeObserver: 'readonly',
  IntersectionObserver: 'readonly',
  MutationObserver: 'readonly',
  alert: 'readonly',
  confirm: 'readonly',
  prompt: 'readonly',
  getComputedStyle: 'readonly',
  DOMParser: 'readonly',
  FileReader: 'readonly',
  File: 'readonly',
  Image: 'readonly',
  // DOMPurify / pdf-lib 等运行时
  DOMException: 'readonly',
};

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/node_modules/**',
      '**/target/**',
      'apps/desktop/src-tauri/target/**',
      // 生成产物 / 缓存目录 —— 别让 ESLint 去扫 bundler 压缩后的输出
      'cdn-dist/**',
      '**/.astro/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
    ],
  },
  {
    // 给所有源码文件统一注入 Node + Browser globals,避免 no-undef 在脚本/构建产物文件里误报
    languageOptions: {
      globals: ENV_GLOBALS,
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // 一些过严的默认值放宽，避免噪音
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
  {
    // .d.ts 声明文件: 三斜杠引用是常见用法(Astro / Vite 等自动生成)
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    // 测试文件允许更随意一点
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
