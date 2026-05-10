// 一次性首启提示 —— 加载文件后浮现，3-4 秒后或 dismiss 后消失
// localStorage key 'mdview:onboarding-seen' 记录已显示
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'mdview:onboarding-seen';

interface Props {
  /** 是否已经打开了文件 —— 只在用户实际开始使用后弹 */
  active: boolean;
}

export function Onboarding({ active }: Props): JSX.Element | null {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!active) return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }
    // 等用户阅读 1.5s 再弹，避免打断
    const id = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(id);
  }, [active]);

  function dismiss(): void {
    setShow(false);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
  }

  if (!show) return null;
  return (
    <div className="mdv-onboarding" role="status" aria-live="polite">
      <div className="mdv-onboarding-content">
        <strong>Tip</strong>
        <span>
          Press <kbd>⌘K</kbd> for everything: open files, switch themes, change view modes.
        </span>
      </div>
      <button
        type="button"
        className="mdv-onboarding-dismiss"
        onClick={dismiss}
        aria-label="Dismiss tip"
      >
        ×
      </button>
    </div>
  );
}
