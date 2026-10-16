importScripts('shared.js');
// A single writer prevents simultaneous tabs from overwriting each other's blocks.
let queue = Promise.resolve();
chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id) return;
  const allowed = ['block', 'unblock', 'enabled', 'siteEnabled', 'import', 'clear', 'options'];
  if (!allowed.includes(message?.type)) return;
  queue = queue.catch(() => {}).then(async () => {
    try {
      if (message.type === 'options') {
        await chrome.runtime.openOptionsPage(); respond({ok: true}); return;
      }
      const state = await ASB.read();
      if (message.type === 'block') {
        const item = ASB.entry(message.publisher);
        if (!state.blocked.some(e => ASB.key(e) === ASB.key(item))) state.blocked.push(item);
      } else if (message.type === 'unblock') {
        const item = ASB.entry({site:message.site, id:message.id});
        state.blocked = state.blocked.filter(e => ASB.key(e) !== ASB.key(item));
      } else if (message.type === 'enabled') state.enabled = Boolean(message.enabled);
      else if (message.type === 'siteEnabled') {
        if (!Object.hasOwn(ASB.sites, message.site)) throw new Error('지원하지 않는 사이트입니다.');
        state.sitesEnabled[message.site] = Boolean(message.enabled);
      } else if (message.type === 'clear') {
        if (message.site && !Object.hasOwn(ASB.sites, message.site)) throw new Error('지원하지 않는 사이트입니다.');
        state.blocked = message.site ? state.blocked.filter(e => e.site !== message.site) : [];
      }
      else if (message.type === 'import') {
        if (!Array.isArray(message.entries) || message.entries.length > 10000) throw new Error('백업 목록 형식 또는 크기를 확인하세요.');
        const merged = new Map(state.blocked.map(e => [ASB.key(e), e]));
        for (const e of message.entries) { const item = ASB.entry(e); merged.set(ASB.key(item), item); }
        state.blocked = [...merged.values()];
      }
      await chrome.storage.local.set({state});
      respond({ok: true, state});
    } catch (error) { respond({ok: false, error: error.message}); }
  });
  return true;
});
