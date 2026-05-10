// 阅读时长 / 字数统计 —— front matter `readingTime: true` 时显示在主标题下方
// 算法（足够好的近似）：
//   - 西文：250 wpm（约 50 ms / word）
//   - 中文：500 chars/min
//   - 文档混合时取两者总和的最大值
interface Props {
  markdown: string;
  show: boolean;
}

export function ReadingStats({ markdown, show }: Props): JSX.Element | null {
  if (!show) return null;

  const stats = computeStats(markdown);
  return (
    <div className="mdv-reading-stats" aria-label="Reading statistics">
      <span>{stats.words.toLocaleString()} words</span>
      <span aria-hidden>·</span>
      <span>{stats.minutes} min read</span>
    </div>
  );
}

interface Stats {
  words: number;
  chineseChars: number;
  minutes: number;
}

function computeStats(markdown: string): Stats {
  // 去掉代码块、front matter，避免代码污染字数
  const cleaned = markdown
    .replace(/^---[\s\S]*?\n---\n/, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]+`/g, '');

  // 中文字符
  const chineseMatches = cleaned.match(/[一-鿿㐀-䶿]/g) ?? [];
  const chineseChars = chineseMatches.length;

  // 英文 / 数字 / 其他 letter 词数
  const cleanedSansChinese = cleaned.replace(/[一-鿿㐀-䶿]/g, ' ');
  const wordMatches = cleanedSansChinese.match(/[A-Za-z0-9_]+/g) ?? [];
  const words = wordMatches.length + chineseChars; // 把中文字也按"词"计数，便于统一展示

  const minutesEnglish = wordMatches.length / 250;
  const minutesChinese = chineseChars / 500;
  const minutes = Math.max(1, Math.ceil(minutesEnglish + minutesChinese));

  return { words, chineseChars, minutes };
}
