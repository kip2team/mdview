// Preview 页面浮动工具栏 —— 容纳主题切换器 + "复制短链" 按钮
import { useState } from 'react';
import { WebThemeSwitcher } from './WebThemeSwitcher';

interface Props {
  /** 当前主题 */
  theme: string;
  /** 当前预览的目标 URL（为了 /api/short 调用） */
  sourceUrl: string;
}

export function PreviewToolbar({ theme, sourceUrl }: Props): JSX.Element {
  const [status, setStatus] = useState<'idle' | 'loading' | 'copied' | 'error'>('idle');

  async function handleCopyShortLink(): Promise<void> {
    setStatus('loading');
    try {
      const res = await fetch('/api/short', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: sourceUrl, theme }),
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { shortUrl: string };
      await navigator.clipboard.writeText(data.shortUrl);
      setStatus('copied');
      setTimeout(() => setStatus('idle'), 1800);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2400);
    }
  }

  return (
    <div className="mdv-web-toolbar">
      <button
        type="button"
        className="mdv-web-share"
        onClick={handleCopyShortLink}
        disabled={status === 'loading'}
      >
        {status === 'idle' && (
          <>
            <span aria-hidden>🔗</span>
            <span>Copy short link</span>
          </>
        )}
        {status === 'loading' && <span>Generating…</span>}
        {status === 'copied' && <span>✓ Copied to clipboard</span>}
        {status === 'error' && <span>✗ Failed, try again</span>}
      </button>
      <WebThemeSwitcher current={theme} />
    </div>
  );
}
