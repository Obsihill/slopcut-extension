(() => {
  const cardSelector = '[data-monitor="srp-result-item"]';
  const observed = new WeakMap(), cache = new Map(), queue = [];
  let observer, running = 0;
  function previewUrl(card) {
    const path = card.querySelector('[data-search-result-turbo-frame-src-value]')?.getAttribute('data-search-result-turbo-frame-src-value');
    if (!path) return null;
    try {
      const u = new URL(path,location.origin);
      if (u.origin !== location.origin || !/^\/3d-models\/\d+\/previews$/.test(u.pathname) || u.username || u.password) return null;
      if ([...u.searchParams].some(([k,v]) => !['frame_id','panel_id'].includes(k) || !/^(?:product-previews-)?\d+$/.test(v))) return null;
      return u.href;
    } catch { return null; }
  }
  function load(url) {
    if (cache.has(url)) return cache.get(url);
    const promise = new Promise(resolve => queue.push({url,resolve}));
    cache.set(url,promise); if (cache.size > 256) cache.delete(cache.keys().next().value);
    pump(); return promise;
  }
  function pump() {
    while (running < 2 && queue.length) {
      const {url,resolve} = queue.shift(); running++;
      const controller = new AbortController(), timeout = setTimeout(() => controller.abort(),8000);
      fetch(url,{credentials:'same-origin',redirect:'error',signal:controller.signal})
        .then(async response => {
          if (!response.ok) return null;
          const text = await response.text(); if (text.length > 1024 * 1024) return null;
          const doc = new DOMParser().parseFromString(text,'text/html');
          const a = doc.querySelector('a[data-click-event-label-of-event-value="contributorName"][href*="/Search/Artists/"]');
          const id = a && ASB.sellerId('turbosquid',a.getAttribute('href'));
          const name = a?.textContent.trim();
          return id && name ? {site:'turbosquid',id,name} : null;
        }).catch(() => null).then(resolve).finally(() => { clearTimeout(timeout); running--; pump(); });
    }
  }
  (globalThis.ASBAdapters ||= []).push({
    site:'turbosquid', label:'TurboSquid', noun:'상품', home:'https://www.turbosquid.com/3d-models',
    matches:loc => ['www.turbosquid.com','turbosquid.com'].includes(loc.hostname) && !/^\/(?:Login|cart|checkout|Download|account|PublishYourStuff|help)(?:\/|$)/i.test(loc.pathname),
    isDetail:loc => /^\/3d-models\/[^/]+-\d+\/?$/i.test(loc.pathname),
    selector:'a[data-testid="artist-search-link"], a[data-click-event-label-of-event-value="contributorName"][href*="/Search/Artists/"], [data-asb-seller-row] > a',
    publisher(a) {
      if (a.closest('header,footer,nav')) return null;
      const id = ASB.sellerId('turbosquid',a.getAttribute('href')), name = a.textContent.replace(/\s+/g,' ').trim();
      return id && name ? {site:'turbosquid',id,name} : null;
    },
    discover(doc) {
      if (typeof IntersectionObserver === 'undefined') return;
      observer ||= new IntersectionObserver(entries => {
        for (const entry of entries) if (entry.isIntersecting) {
          const card = entry.target, url = observed.get(card); observer.unobserve(card);
          if (!url) continue;
          load(url).then(item => {
            if (!card.isConnected || previewUrl(card) !== url) return;
            ASBDOM.sellerRow(card,item);
          });
        }
      },{rootMargin:'250px'});
      for (const card of doc.querySelectorAll(cardSelector)) {
        const url = previewUrl(card);
        if (observed.get(card) === url) continue;
        ASBDOM.sellerRow(card,null); observed.set(card,url);
        if (url) observer.observe(card);
      }
    },
    prepare(a) { a.parentElement.classList.add('asb-publisher-row'); },
    cardFor:a => a.closest(cardSelector) || a.closest('turbo-frame[id^="product-previews-"]'),
    detailTarget:a => a.closest('[class*="smallDesk:grid-rows-"]')
  });
})();
