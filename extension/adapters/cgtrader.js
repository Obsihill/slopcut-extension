(globalThis.ASBAdapters ||= []).push({
  site:'cgtrader', label:'CGTrader', noun:'상품', home:'https://www.cgtrader.com/3d-models',
  matches:loc => ['www.cgtrader.com','cgtrader.com'].includes(loc.hostname) && !/^\/(?:profile|account|cart|checkout|messages|admin|dashboard)(?:\/|$)/i.test(loc.pathname),
  isDetail:loc => /^\/3d-(?:models|print-models)\/[^/]+\/[^/]+\/[^/]+\/?$/.test(loc.pathname),
  selector:'.seller-area__header-content-username, [data-asb-seller-row] > a',
  publisher(a) {
    const id = ASB.sellerId('cgtrader',a.getAttribute('href'));
    const name = a.textContent.trim();
    return id && name ? {site:'cgtrader',id,name} : null;
  },
  discover(doc) {
    for (const card of doc.querySelectorAll('.card-3d-model[data-attributes]')) {
      let id = null;
      try { id = ASB.sellerId('cgtrader',JSON.parse(card.getAttribute('data-attributes')).itemBrand); } catch { /* Unknown card. */ }
      ASBDOM.sellerRow(card,id ? {site:'cgtrader',id,name:id} : null);
    }
  },
  prepare(a) { if (!a.closest('[data-asb-seller-row]')) a.parentElement.classList.add('asb-publisher-row'); },
  cardFor:a => a.closest('.card-3d-model'),
  detailTarget:a => a.closest('.item-page__body')
});
