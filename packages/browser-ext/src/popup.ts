// 扩展 popup —— 主题切换器，存到 storage.sync 跨设备同步
// 兼容 Chrome / Firefox：Firefox 暴露 `browser`，Chrome 暴露 `chrome`
const STORAGE_KEY = 'mdview:theme';

const api =
  (globalThis as unknown as { browser?: typeof chrome }).browser ??
  (typeof chrome !== 'undefined' ? chrome : undefined);

const select = document.getElementById('theme') as HTMLSelectElement | null;

if (select && api?.storage) {
  api.storage.sync.get(STORAGE_KEY, (data: Record<string, unknown>) => {
    const current = (data[STORAGE_KEY] as string) ?? 'default';
    select.value = current;
  });
  select.addEventListener('change', () => {
    api.storage.sync.set({ [STORAGE_KEY]: select.value });
  });
}
