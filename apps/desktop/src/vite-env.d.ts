/// <reference types="vite/client" />

// vite/client 已经声明了 *.css / *?url / *?raw 等通配 module
// 但通过 npm 包的 subpath import（如 '@mdview/themes/default.css?raw'）
// 会被 TS 当成正常 module import 而不是文件 import，需显式声明
declare module '*.css?url' {
  const url: string;
  export default url;
}
declare module '*.css?raw' {
  const raw: string;
  export default raw;
}
declare module '*.css' {
  const css: string;
  export default css;
}

// JSON imports with `with { type: 'json' }`
declare module '*.json' {
  const value: unknown;
  export default value;
}
