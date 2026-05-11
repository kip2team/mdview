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
          {/* 与 mdview.sh / favicon 同款 logo:浏览器窗+md+眼睛 d */}
          <svg viewBox="0 0 64 64" width="64" height="64" fill="none">
            <rect x="3" y="6" width="58" height="52" rx="7" fill="#1f2328" />
            <circle cx="10" cy="13" r="1.7" fill="#4493f8" />
            <circle cx="16" cy="13" r="1.7" fill="#3fb950" />
            <circle cx="22" cy="13" r="1.7" fill="#8b949e" />
            <path
              d="M48 10.5 L45.5 13 L48 15.5 M54 10.5 L56.5 13 L54 15.5"
              stroke="#8b949e"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M52.4 9.5 L49.6 16.5"
              stroke="#8b949e"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
            <rect x="7" y="20" width="50" height="35" rx="3" fill="#ffffff" />
            <path
              d="M14 47 V35 a4 4 0 0 1 8 0 V47 M22 39 a4 4 0 0 1 8 0 V47"
              stroke="#1f2328"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M50 23 V47" stroke="#1f2328" strokeWidth="4" strokeLinecap="round" />
            <ellipse
              cx="43"
              cy="41"
              rx="7"
              ry="5"
              stroke="#1f2328"
              strokeWidth="3"
              fill="#ffffff"
            />
            <circle cx="43" cy="41" r="2.2" fill="#1f2328" />
            <circle cx="44" cy="40" r="0.7" fill="#ffffff" />
          </svg>
        </div>
        <h1 className="mdv-welcome-title">
          <span className="mdv-brand-md">md</span>
          <span className="mdv-brand-view">view</span>
        </h1>
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
