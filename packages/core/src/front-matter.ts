// 极简 front matter 解析 —— 替代 gray-matter（gray-matter 依赖 Node 的 Buffer，浏览器跑不了）
// 行为约定与 gray-matter 一致，但只支持 YAML 一种 + UTF-8 字符串输入
import { parse as parseYaml } from 'yaml';

/** 解析结果 —— 与 gray-matter 输出 shape 兼容（.data + .content） */
export interface ParsedFrontMatter {
  /** 解析出来的 YAML 头数据；没有 / 解析失败时为空对象 */
  data: Record<string, unknown>;
  /** front matter 之后的正文 */
  content: string;
}

// 必须从首行的 `---` 起、再次 `---` 闭合
// 支持 \r\n 和 \n 两种换行
const FRONT_MATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function parseFrontMatter(input: string): ParsedFrontMatter {
  const match = input.match(FRONT_MATTER_RE);
  if (!match) {
    return { data: {}, content: input };
  }

  let data: Record<string, unknown> = {};
  try {
    const parsed = parseYaml(match[1] ?? '');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      data = parsed as Record<string, unknown>;
    }
  } catch {
    // YAML 异常时按"没有有效 front matter"处理，避免一份带格式错误的文档完全炸掉
  }

  return {
    data,
    content: input.slice(match[0].length),
  };
}
