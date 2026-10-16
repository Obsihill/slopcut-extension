/* Shared by isolated content scripts, options, and the service worker. */
globalThis.ASB = (() => {
  const sites = Object.freeze({unity: 'Unity Asset Store', booth: 'BOOTH', cgtrader: 'CGTrader', fab: 'Fab', turbosquid: 'TurboSquid'});
  const defaults = () => ({version: 2, enabled: true, sitesEnabled: Object.fromEntries(Object.keys(sites).map(site => [site,true])), blocked: []});
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
  const profiles = {
    cgtrader: {host:'www.cgtrader.com', path:'designers'},
    fab: {host:'www.fab.com', path:'sellers'},
    turbosquid: {host:'www.turbosquid.com', path:'Search/Artists'}
  };
  function profileId(site, value) {
    const config = profiles[site]; if (!config) return null;
    let id = String(value || '').trim();
    try {
      if (/^(?:https?:|\/)/i.test(id)) {
        const u = new URL(id, `https://${config.host}`);
        if (u.protocol !== 'https:' || ![config.host,config.host.slice(4)].includes(u.hostname) || u.username || u.password || u.port) return null;
        const match = u.pathname.match(new RegExp(`^/${config.path}/([^/]+)/?$`, 'i'));
        if (!match) return null;
        id = decodeURIComponent(match[1]);
      }
      id = id.normalize('NFC');
      if (!id || id.length > 200 || /[\x00-\x1f\x7f/\\?#<>:%]/.test(id) || id === '.' || id === '..') return null;
      if (site !== 'fab' && !/^[a-z0-9][a-z0-9_. -]*$/i.test(id)) return null;
      return id.toLowerCase();
    } catch { return null; }
  }
  function sellerId(site, value) { return site === 'booth' ? boothId(value) : site === 'unity' ? publisherId(value) : profileId(site,value); }
  const key = value => `${value.site || 'unity'}:${value.id}`;
  const sellerUrl = value => {
    const site = value.site || 'unity', id = sellerId(site,value.id);
    if (!id) return '';
    if (site === 'booth') return `https://${id}.booth.pm/`;
    if (site === 'unity') return `https://assetstore.unity.com/publishers/${id}`;
    return `https://${profiles[site].host}/${profiles[site].path}/${encodeURIComponent(id)}`;
  };
  const placeholders = Object.freeze({unity:'https://assetstore.unity.com/publishers/12345', booth:'https://상점명.booth.pm/ 또는 상점명', cgtrader:'https://www.cgtrader.com/designers/판매자', fab:'https://www.fab.com/sellers/판매자', turbosquid:'https://www.turbosquid.com/Search/Artists/판매자'});
  function entry(value) {
    const site = value?.site ?? 'unity'; // v1 backups and stored entries belong to Unity.
    const id = sellerId(site, value?.id);
    if (!id) throw new Error('선택한 사이트의 올바른 판매자 URL 또는 ID를 입력하세요.');
    return {site, id, name: String(value?.name || (site === 'unity' ? `제작자 #${id}` : id)).trim().slice(0, 200) || id,
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
  return {sites, placeholders, defaults, publisherId, boothId, sellerId, key, sellerUrl, entry, normalize, read, request};
})();
