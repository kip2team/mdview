// 启动欢迎页 —— 没打开任何文件时显示
// 关键元素：大号 logo / "拖一个 .md 进来" / 主要快捷键提示 / 最近文件入口
import type { RecentFile } from '../lib/recent-files';

interface WelcomeProps {
  onOpen: () => void;
  recents: RecentFile[];
  onPickRecent: (file: RecentFile) => void;
}

export function Welcome({ onOpen, recents, onPickRecent }: WelcomeProps): JSX.Element {
  return (
    <div className="mdv-welcome">
      <div className="mdv-welcome-card">
        <div className="mdv-welcome-logo" aria-hidden>
          📖
        </div>
        <h1 className="mdv-welcome-title">mdview</h1>
        <p className="mdv-welcome-tagline">A reader-first home for Markdown.</p>

        <div className="mdv-welcome-actions">
          <button type="button" className="mdv-btn mdv-btn-primary" onClick={onOpen}>
            Open Markdown file…
          </button>
          <span className="mdv-welcome-hint">
            or drop a <code>.md</code> file anywhere in this window
          </span>
        </div>

        {recents.length > 0 && (
          <section className="mdv-welcome-recent">
            <h2>Recent</h2>
            <ul>
              {recents.map((f) => (
                <li key={f.path}>
                  <button type="button" onClick={() => onPickRecent(f)}>
                    <span className="mdv-recent-name">{f.name}</span>
                    <span className="mdv-recent-path">{f.path}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="mdv-welcome-shortcuts">
          <div>
            <kbd>⌘O</kbd> Open
          </div>
          <div>
            <kbd>⌘E</kbd> Export
          </div>
        </footer>
      </div>
    </div>
  );
}
