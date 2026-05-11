// 导出 .mdv.html 对话框 —— 三形态可选 / 主题选择 / 引擎版本
import { useEffect, useState } from 'react';
import { render } from '@mdview/core';
import { themeDefaults } from '@mdview/themes';
import { toMdvHtml, type MdvForm } from '@mdview/format';
import { saveFileDialog, writeTextToFile } from '../ipc';
import { THEME_OPTIONS } from '../lib/theme-loader';
import { THEME_CSS_RAW, EXTENSIONS_CSS_RAW, cdnThemeUrl, cdnEngineUrl } from '../lib/theme-assets';

interface ExportDialogProps {
  /** 当前在阅读的 markdown 内容 */
  markdown: string;
  /** 当前主题（作为默认值） */
  defaultThemeId: string;
  /** 当前文件路径，作为另存为对话框的默认目标 */
  filePath?: string;
  /** 关闭对话框 */
  onClose: () => void;
}

export function ExportDialog({
  markdown,
  defaultThemeId,
  filePath,
  onClose,
}: ExportDialogProps): JSX.Element {
  const [form, setForm] = useState<MdvForm>('progressive');
  const [themeId, setThemeId] = useState(defaultThemeId);
  const [engineVersion, setEngineVersion] = useState<'latest' | 'pinned'>('latest');
  const [includeSri, setIncludeSri] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // 引擎版本固定时才能开 SRI（rolling 版本 hash 会变，SRI 没意义）
  const sriEnabled = engineVersion === 'pinned';

  async function handleExport(): Promise<void> {
    setBusy(true);
    setError(undefined);
    try {
      // 服务端预渲染 HTML —— progressive / standalone 形态需要
      const prerendered = render(markdown, {
        themeDefaults: themeDefaults(themeId),
      }).html;

      const html = buildMdvHtml({
        markdown,
        form,
        themeId,
        engineVersion,
        includeSri: includeSri && sriEnabled,
        prerendered,
      });

      const defaultPath = suggestExportPath(filePath, form);
      const target = await saveFileDialog({
        defaultPath,
        filters: [{ name: 'mdview HTML', extensions: ['html'] }],
      });
      if (!target) {
        setBusy(false);
        return;
      }
      await writeTextToFile(target, html);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  // Esc 关闭 + 焦点返回触发按钮
  // 注意：onClose 是 prop 不在 deps 里也无所谓 —— 这个 effect 一次性绑定
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      className="mdv-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div className="mdv-modal" role="dialog" aria-modal="true" aria-labelledby="mdv-export-title">
        <h2 id="mdv-export-title" className="mdv-modal-title">
          Export as .mdv.html
        </h2>

        <fieldset className="mdv-form-group">
          <legend>Form</legend>
          {(
            [
              {
                value: 'progressive',
                label: 'Progressive (recommended · ~5KB)',
                desc: 'Single file, prerendered HTML + theme/engine via CDN. Works without JS for first paint.',
              },
              {
                value: 'minimal',
                label: 'Minimal (~1KB)',
                desc: 'Smallest size; needs the mdview CDN to render. Best for blog CMS embeds.',
              },
              {
                value: 'standalone',
                label: 'Standalone (offline-friendly · ~120KB)',
                desc: 'No remote dependencies. Theme CSS inlined. Good for archival / email.',
              },
            ] as { value: MdvForm; label: string; desc: string }[]
          ).map((opt) => (
            <label key={opt.value} className="mdv-form-option">
              <input
                type="radio"
                name="form"
                value={opt.value}
                checked={form === opt.value}
                onChange={() => setForm(opt.value)}
              />
              <div>
                <div className="mdv-form-option-label">{opt.label}</div>
                <div className="mdv-form-option-desc">{opt.desc}</div>
              </div>
            </label>
          ))}
        </fieldset>

        <div className="mdv-form-row">
          <label className="mdv-form-field">
            <span>Theme</span>
            <select value={themeId} onChange={(e) => setThemeId(e.target.value)}>
              {THEME_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          <label className="mdv-form-field">
            <span>Engine version</span>
            <select
              value={engineVersion}
              onChange={(e) => setEngineVersion(e.target.value as 'latest' | 'pinned')}
            >
              <option value="latest">v1 · latest (auto-update)</option>
              <option value="pinned">v1.0.0 · pinned</option>
            </select>
          </label>
        </div>

        <label className="mdv-form-checkbox">
          <input
            type="checkbox"
            disabled={!sriEnabled}
            checked={includeSri && sriEnabled}
            onChange={(e) => setIncludeSri(e.target.checked)}
          />
          <span>
            Include Subresource Integrity (SRI) hashes
            {!sriEnabled && (
              <span className="mdv-hint"> — only available with pinned engine version</span>
            )}
          </span>
        </label>

        {error && <div className="mdv-error">{error}</div>}

        <div className="mdv-modal-footer">
          <button type="button" className="mdv-btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="mdv-btn mdv-btn-primary"
            onClick={handleExport}
            disabled={busy}
          >
            {busy ? 'Exporting…' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 工具函数 ─────────────────────────────────────────────

interface BuildOptions {
  markdown: string;
  form: MdvForm;
  themeId: string;
  engineVersion: 'latest' | 'pinned';
  includeSri: boolean;
  prerendered: string;
}

/** 把表单状态转成 toMdvHtml 入参并生成 HTML */
function buildMdvHtml(opts: BuildOptions): string {
  const { markdown, form, themeId, engineVersion, includeSri, prerendered } = opts;

  const engineUrl = cdnEngineUrl(engineVersion === 'pinned' ? 'v1.0.0' : 'v1');
  const themeUrl = cdnThemeUrl(themeId);

  // SRI 哈希在引擎实际部署后才能填充 —— MVP 留占位说明
  const placeholderSri = includeSri ? 'sha384-PLACEHOLDER_REPLACE_WHEN_CDN_LIVE' : undefined;

  if (form === 'standalone') {
    // 内嵌主题 CSS（含扩展样式），不引用 CDN
    const inlineCss = THEME_CSS_RAW[themeId] ?? THEME_CSS_RAW.default;
    const inlineWithExt = `${inlineCss}\n\n${EXTENSIONS_CSS_RAW}`;
    return toMdvHtml(markdown, {
      form,
      // 不内嵌引擎 —— prerendered HTML 已经渲染好，离线可看（见 02-Format-Spec §2.3 说明）
      engine: {},
      theme: { id: themeId, inline: inlineWithExt },
      prerenderedHtml: prerendered,
    });
  }

  // minimal / progressive 共用 CDN 引用路径
  return toMdvHtml(markdown, {
    form,
    engine: {
      url: engineUrl,
      ...(placeholderSri ? { integrity: placeholderSri } : {}),
    },
    theme: {
      id: themeId,
      url: themeUrl,
      ...(placeholderSri ? { integrity: placeholderSri } : {}),
    },
    prerenderedHtml: form === 'progressive' ? prerendered : undefined,
  });
}

/** 推荐导出路径：当前 .md 文件同目录的同名 .mdv.html */
function suggestExportPath(filePath: string | undefined, form: MdvForm): string {
  if (!filePath) return `untitled.${form === 'progressive' ? '' : form + '.'}mdv.html`;
  const lastDot = filePath.lastIndexOf('.');
  const stem = lastDot >= 0 ? filePath.slice(0, lastDot) : filePath;
  // 单形态导出时不再带 form 段
  return `${stem}.mdv.html`;
}
