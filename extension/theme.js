/* Options-page appearance is independent of seller data and content-script settings. */
globalThis.SlopCutTheme = (() => {
  const values = ['system', 'light', 'dark'];
  const normalize = value => values.includes(value) ? value : 'system';
  const media = window.matchMedia?.('(prefers-color-scheme: dark)');
  let preference = 'system';
  function apply(value) {
    preference = normalize(value);
    const root = document.documentElement;
    root.dataset.theme = preference;
    root.dataset.colorMode = preference === 'system' ? (media?.matches ? 'dark' : 'light') : preference;
    root.style.colorScheme = root.dataset.colorMode;
    const control = document.getElementById('theme');
    if (control) control.value = preference;
    // Keep the legacy cache key so a rename preserves existing theme preferences.
    // A local mirror applies explicit preferences before the asynchronous storage read.
    try { localStorage.setItem('slopblock.theme', preference); } catch { /* Cache is optional. */ }
  }
  let cached;
  try { cached = localStorage.getItem('slopblock.theme'); } catch { /* Use browser preference. */ }
  apply(cached);
  media?.addEventListener('change', () => apply(preference));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.uiTheme) apply(changes.uiTheme.newValue);
  });
  document.addEventListener('DOMContentLoaded', () => apply(preference), {once:true});
  const ready = chrome.storage.local.get('uiTheme').then(data => apply(data.uiTheme)).catch(() => {});
  async function set(value) {
    if (!values.includes(value)) throw new Error('올바른 테마를 선택하세요.');
    await chrome.storage.local.set({uiTheme:value});
    apply(value);
  }
  return {ready, set, get preference() { return preference; }};
})();
