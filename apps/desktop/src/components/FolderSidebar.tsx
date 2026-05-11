// 文件夹模式侧栏 —— 列出文件夹下所有 .md，点击切换
import type { FolderEntry } from '../lib/folder-browse';

interface Props {
  root: string;
  files: FolderEntry[];
  activePath?: string;
  onPick: (entry: FolderEntry) => void;
  onClose: () => void;
}

export function FolderSidebar({ root, files, activePath, onPick, onClose }: Props): JSX.Element {
  return (
    <aside className="mdv-folder-sidebar" aria-label="Folder files">
      <div className="mdv-folder-header">
        <strong title={root}>{rootName(root)}</strong>
        <button
          type="button"
          className="mdv-folder-close"
          onClick={onClose}
          aria-label="Close folder browser"
        >
          ×
        </button>
      </div>
      {files.length === 0 ? (
        <div className="mdv-folder-empty">No .md files found</div>
      ) : (
        <ul>
          {files.map((f) => (
            <li key={f.path}>
              <button
                type="button"
                className={f.path === activePath ? 'is-active' : ''}
                onClick={() => onPick(f)}
                title={f.relativePath}
              >
                {f.name}
                {f.relativePath !== f.name && (
                  <span className="mdv-folder-dir">
                    {f.relativePath.slice(0, -f.name.length).replace(/\/$/, '')}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

function rootName(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).pop() ?? path;
}
