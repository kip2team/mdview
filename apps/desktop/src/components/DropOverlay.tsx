// 拖拽中浮层 —— 用户从外部拖文件到窗口时显示，强化"丢这就行"的可见性
interface DropOverlayProps {
  visible: boolean;
}

export function DropOverlay({ visible }: DropOverlayProps): JSX.Element | null {
  if (!visible) return null;
  return (
    <div className="mdv-drop-overlay" aria-hidden="true">
      <div className="mdv-drop-overlay-inner">
        <div className="mdv-drop-icon">📄</div>
        <div className="mdv-drop-text">Drop your Markdown here</div>
      </div>
    </div>
  );
}
