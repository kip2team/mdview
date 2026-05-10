// 扩展 popup —— 主题切换器，存到 chrome.storage.sync 跨设备同步
const STORAGE_KEY = 'mdview:theme';

const select = document.getElementById('theme') as HTMLSelectElement | null;
if (select) {
  chrome.storage.sync.get(STORAGE_KEY, (data) => {
    const current = (data[STORAGE_KEY] as string) ?? 'default';
    select.value = current;
  });
  select.addEventListener('change', () => {
    chrome.storage.sync.set({ [STORAGE_KEY]: select.value });
  });
}
