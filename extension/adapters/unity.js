/* Site adapters only identify sellers, button placement, and complete product cards. */
globalThis.ASBAdapters = globalThis.ASBAdapters || [];
ASBAdapters.push({
  site: 'unity', label: 'Unity', noun: '에셋',
  home: 'https://assetstore.unity.com/',
  isDetail: loc => /\/packages\/(?!category(?:\/|$))/.test(loc.pathname),
  matches: loc => loc.hostname === 'assetstore.unity.com',
  selector: 'a[href*="/publishers/"]',
  publisher(a) {
    if (a.closest('header,footer,nav')) return null;
    const id = ASB.publisherId(a.getAttribute('href'));
    const name = a.textContent.replace(/\s+/g, ' ').trim();
    if (!id || !name || /^(see more|view all|더 보기|もっと見る|查看更多)$/i.test(name) || a.querySelector('h2,h3')) return null;
    return {site: 'unity', id, name};
  },
  prepare(a) {
    if (a.matches('[data-test="product-card-publisher"]')) a.parentElement.classList.add('asb-publisher-row');
  },
  cardFor(a) {
    const article = a.closest('article');
    if (article && article.querySelector('a[href*="/packages/"]')) {
      return article.parentElement?.tagName === 'LI' ? article.parentElement : article;
    }
    for (let e = a.parentElement, depth = 0; e && depth < 7; e = e.parentElement, depth++) {
      if (e.matches('main,header,footer,nav') || e.querySelector('h1')) break;
      const assets = new Set([...e.querySelectorAll('a[href*="/packages/"]')].map(n => n.getAttribute('href').split('?')[0]));
      if (assets.size > 1) break;
      if (assets.size === 1 && e.querySelector('img,[style*="background-image"]')) return e;
    }
    return null;
  }
});
