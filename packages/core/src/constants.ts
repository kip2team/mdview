// 协议版本号 —— 写入 .mdv.html 的 data-mdview 属性
export const MDVIEW_PROTOCOL_VERSION = 1 as const;

// 源码 script 标签的 type，浏览器不会解析它，作为安全的内嵌方式
export const MDVIEW_SOURCE_SCRIPT_TYPE = 'text/x-mdview' as const;

// 约定的 DOM id —— engine 在浏览器中按这两个 id 查找节点
export const MDVIEW_SOURCE_ID = 'mdview-source' as const;
export const MDVIEW_OUTPUT_ID = 'mdview-output' as const;
