(() => {
  function cardFor(a) {
    for (let e = a.parentElement, depth = 0; e && depth < 7; e = e.parentElement,depth++) {
      if (e.matches('main,header,footer,nav') || e.querySelector('h1')) break;
      const links = new Set([...e.querySelectorAll('a[href*="/listings/"],a[href*="/bundles/"]')].map(a => a.getAttribute('href')));
      if (links.size > 1) break;
      if (links.size === 1 && e.querySelector('.fabkit-Thumbnail-root')) return e.parentElement?.tagName === 'LI' ? e.parentElement : e;
    }
    return null;
  }
  (globalThis.ASBAdapters ||= []).push({
    site:'fab', label:'Fab', noun:'상품', home:'https://www.fab.com/',
    matches:loc => ['www.fab.com','fab.com'].includes(loc.hostname) && !/^\/(?:portal|library|wishlist|cart|checkout|account|publish)(?:\/|$)/i.test(loc.pathname),
    isDetail:loc => /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(?:listings|bundles)\/[^/]+\/?$/i.test(loc.pathname),
    selector:'a[href*="/sellers/"]',
    publisher(a) {
      if (a.closest('header,footer,nav,h2,h3') || a.classList.contains('fabkit-Blades-titleWrapper')) return null;
      if (!a.matches('.fabkit-Badge-root') && !cardFor(a)) return null;
      const id = ASB.sellerId('fab',a.getAttribute('href'));
      const name = a.textContent.replace(/\s+/g,' ').trim();
      return id && name ? {site:'fab',id,name} : null;
    },
    prepare(a) { a.classList.add('asb-fab-seller'); a.parentElement.classList.add('asb-fab-info'); },
    cardFor
  });
})();
