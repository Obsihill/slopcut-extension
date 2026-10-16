globalThis.ASBAdapters = globalThis.ASBAdapters || [];
ASBAdapters.push({
  site: 'booth', label: 'BOOTH', noun: '상품',
  home: 'https://booth.pm/',
  isDetail: loc => /\/items\/\d+\/?$/.test(loc.pathname),
  matches(loc) {
    if (loc.hostname === 'booth.pm') {
      const pathname = loc.pathname.replace(/^\/(?:ja|en|ko|zh-cn|zh-tw)(?=\/|$)/i, '') || '/';
      return /^\/(?:(?:items|search|browse|tags|events)(?:\/|$)|$)/.test(pathname);
    }
    return Boolean(ASB.boothId(`https://${loc.hostname}/`)) && /^\/(?:items(?:\/|$)|categories(?:\/|$)|search(?:\/|$)|$)/.test(loc.pathname);
  },
  selector: 'a.item-card__shop-name-anchor, a[data-product-list*="to shop_index"], .shop-name > a, .home-link-container__nickname > a',
  publisher(a) {
    let url; try {url = new URL(a.getAttribute('href'), location.href);} catch {return null;}
    // Product-description links, carts, legal/contact links, and avatars are not seller labels.
    if (url.pathname !== '/' && !/^\/(?:ja|en|ko|zh-cn|zh-tw)\/?$/.test(url.pathname)) return null;
    const id = ASB.boothId(url.href), name = a.textContent.replace(/\s+/g,' ').trim();
    return id && name ? {site:'booth',id,name} : null;
  },
  prepare(a) {
    if (a.closest('.item-card__shop-info,.shop-name,.home-link-container__nickname')) a.parentElement.classList.add('asb-publisher-row');
  },
  cardFor(a) {
    const card = a.closest('.item-card__wrap');
    if (!card) return null;
    // Some layouts wrap cards in grid cells; hide that cell too to avoid empty slots.
    const p = card.parentElement;
    return p && (p.tagName === 'LI' || p.classList.contains('item-card')) ? p : card;
  },
  extraCards(doc) {
    // Shop themes omit a seller label on every product. The hostname identifies the seller.
    const id = ASB.boothId(`https://${location.hostname}/`);
    if (!id) return [];
    return [...doc.querySelectorAll('.item')]
      .filter(el => el.querySelector('a[href*="/items/"]'))
      .map(card => ({card, publisher:{site:'booth',id}}));
  }
});
