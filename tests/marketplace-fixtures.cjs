// Minimal structures observed on the public sites on 2026-10-17.
const urls={cgtrader:'https://www.cgtrader.com/search?keywords=chair',fab:'https://www.fab.com/search?q=chair',turbosquid:'https://www.turbosquid.com/Search/3D-Models/chair'};
const details={cgtrader:'https://www.cgtrader.com/3d-models/furniture/chair/test-chair',fab:'https://www.fab.com/listings/00000000-0000-0000-0000-000000000001',turbosquid:'https://www.turbosquid.com/3d-models/test-chair-123'};
const image='data:image/svg+xml;base64,'+Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="150"><rect width="240" height="150" fill="#91aab1"/><path d="M65 120V70H170V120M65 65V25H170V65" fill="none" stroke="#293a40" stroke-width="14"/></svg>').toString('base64');
function card(site,seller='sample-seller',id=1) {
  if(site==='cgtrader')return `<div id="card-${id}" class="card-3d-model" data-attributes='${JSON.stringify({id,itemBrand:seller})}'><article class="card-3d-model__article"><a href="/3d-models/furniture/chair/chair-${id}"><img src="${image}"></a><h3>Chair ${id}</h3></article></div>`;
  if(site==='fab')return `<div id="card-${id}" class="fabkit-Stack-root product"><div class="fabkit-Stack-root fabkit-Surface-root"><div class="fabkit-Stack-root fabkit-Stack--column info"><div><a href="/listings/item-${id}">Chair ${id}</a></div><a href="/sellers/${encodeURIComponent(seller)}"><div class="fabkit-Typography-ellipsisWrapper">${seller}</div></a><div class="price">$10</div></div></div><div class="fabkit-Thumbnail-root"><img src="${image}"></div></div>`;
  return `<div id="card-${id}" data-monitor="srp-result-item"><div class="product_search_result" data-monitor="srp-result-card" data-ts-id="${id}"><a data-monitor="srp-result-primary-link" href="/3d-models/chair-${id}"><img src="${image}"></a><div data-search-result-turbo-frame-src-value="/3d-models/${id}/previews?frame_id=product-previews-${id}&amp;panel_id=${id}"><h3>Chair ${id}</h3></div></div></div>`;
}
function seller(site,name='sample-seller') {
  if(site==='cgtrader')return `<div class="seller-area__header-content-wrapper"><a class="seller-area__header-content-username" href="/designers/${name}">${name}</a></div>`;
  if(site==='fab')return `<div class="fabkit-Stack-root fabkit-Stack--column"><a class="fabkit-Badge-root" href="/sellers/${encodeURIComponent(name)}"><div class="fabkit-Badge-label">${name}</div></a></div>`;
  return `<div><a data-testid="artist-search-link" href="/Search/Artists/${name}">${name}</a></div>`;
}
const preview = name=>`<turbo-frame><a data-click-event-label-of-event-value="contributorName" href="/Search/Artists/${name}">${name}</a></turbo-frame>`;
function detail(site){return `<main class="item-page__body"><h1>Chair</h1><img src="${image}">${seller(site)}<section id="description"><a href="https://elsewhere.test/designers/other">unrelated</a></section><section id="results">${card(site,'other-seller',2)}</section></main>`;}
module.exports={urls,details,card,seller,preview,detail};
