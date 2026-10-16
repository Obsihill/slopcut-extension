/* Shared by isolated content scripts, options, and the service worker. */
globalThis.ASB = (() => {
  const sites = Object.freeze({unity: 'Unity Asset Store', booth: 'BOOTH'});
  const defaults = () => ({version: 2, enabled: true, sitesEnabled: {unity: true, booth: true}, blocked: []});
  function publisherId(value) {
    const s = String(value || '').trim();
    if (/^\d{1,16}$/.test(s)) return s.replace(/^0+(?=\d)/, '');
    try {
      const u = new URL(s, 'https://assetstore.unity.com');
      if (u.protocol !== 'https:' || u.hostname !== 'assetstore.unity.com') return null;
      return u.pathname.match(/\/(?:publishers)\/(\d{1,16})(?:\/|$)/i)?.[1]?.replace(/^0+(?=\d)/, '') || null;
    } catch { return null; }
  }
  function boothId(value) {
    let s = String(value || '').trim().toLowerCase();
    if (/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(s)) s = `https://${s}.booth.pm/`;
    else if (/^[a-z0-9-]+\.booth\.pm(?:\/|$)/.test(s)) s = `https://${s}`;
    try {
      const u = new URL(s);
      if (u.protocol !== 'https:' || u.username || u.password || u.port) return null;
      const id = u.hostname.match(/^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)\.booth\.pm$/)?.[1];
      if (!id || ['www','accounts','manage','admin','api','asset','help','support','download'].includes(id)) return null;
      return id;
    } catch { return null; }
  }
  function sellerId(site, value) { return site === 'booth' ? boothId(value) : site === 'unity' ? publisherId(value) : null; }
  const key = value => `${value.site || 'unity'}:${value.id}`;
  const sellerUrl = value => value.site === 'booth' ? `https://${boothId(value.id)}.booth.pm/` : `https://assetstore.unity.com/publishers/${publisherId(value.id)}`;
  function entry(value) {
    const site = value?.site ?? 'unity'; // v1 backups and stored entries belong to Unity.
    const id = sellerId(site, value?.id);
    if (!id) throw new Error('선택한 사이트의 올바른 판매자 URL 또는 ID를 입력하세요.');
    return {site, id, name: String(value?.name || (site === 'booth' ? id : `제작자 #${id}`)).trim().slice(0, 200) || id,
      addedAt: Number.isFinite(value?.addedAt) ? value.addedAt : Date.now()};
  }
  function normalize(value) {
    const entries = new Map();
    for (const e of Array.isArray(value?.blocked) ? value.blocked : []) {
      try { const item = entry(e); entries.set(key(item), item); } catch { /* Skip malformed stored records. */ }
    }
    return {version: 2, enabled: value?.enabled !== false,
      sitesEnabled: Object.fromEntries(Object.keys(sites).map(site => [site, value?.sitesEnabled?.[site] !== false])),
      blocked: [...entries.values()]};
  }
  async function read() { return normalize((await chrome.storage.local.get('state')).state); }
  async function request(type, payload = {}) {
    const result = await chrome.runtime.sendMessage({type, ...payload});
    if (!result?.ok) throw new Error(result?.error || '확장 프로그램 응답이 없습니다. 페이지를 새로고침하세요.');
    return result.state;
  }
  return {sites, defaults, publisherId, boothId, sellerId, key, sellerUrl, entry, normalize, read, request};
})();
