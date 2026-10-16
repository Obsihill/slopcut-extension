(() => {
  'use strict';
  const adapter = globalThis.ASBAdapters?.find(a => a.matches(location));
  if (!adapter || globalThis.__asbLoaded) return;
  globalThis.__asbLoaded = true;
  let state = ASB.defaults(), timer, observer;
  const buttons = new Map();
  const activeSellers = new Set();
  const isEnabled = () => state.enabled && state.sitesEnabled[adapter.site] !== false;
  function sellerCards(key) {
    const cards = new Set();
    for (const a of document.querySelectorAll(adapter.selector)) {
      const item = adapter.publisher(a);
      if (item && ASB.key(item) === key) {
        const card = adapter.cardFor(a); if (card) cards.add(card);
      }
    }
    for (const {card, publisher} of adapter.extraCards?.(document) || []) if (ASB.key(publisher) === key) cards.add(card);
    return [...cards];
  }

  function scan() {
    observer?.disconnect();
    try {
      const blocked = new Set(state.blocked.map(ASB.key));
      for (const el of document.querySelectorAll('[data-asb-hidden]')) el.removeAttribute('data-asb-hidden');
      for (const [a,b] of buttons) {
        const item = a.isConnected ? adapter.publisher(a) : null;
        if (!item || blocked.has(ASB.key(item)) || b.previousElementSibling !== a || !b.isConnected) {
          b.remove(); buttons.delete(a);
        }
      }
      for (const a of document.querySelectorAll(adapter.selector)) {
        const item = adapter.publisher(a); if (!item) continue;
        if (blocked.has(ASB.key(item))) {
          if (isEnabled() && !activeSellers.has(ASB.key(item))) adapter.cardFor(a)?.setAttribute('data-asb-hidden','true');
          continue;
        }
        if (buttons.has(a)) {
          const b = buttons.get(a);
          if (b.dataset.seller !== ASB.key(item)) {
            b.dataset.seller = ASB.key(item); b.textContent = '차단';
            b.title = `${item.name} 판매자 ${adapter.noun} 숨기기`;
            b.setAttribute('aria-label', `${item.name} 차단`);
          }
          adapter.prepare?.(a); continue;
        }
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'asb-button'; b.textContent = '차단';
        b.dataset.seller = ASB.key(item);
        b.title = `${item.name} 판매자 ${adapter.noun} 숨기기`;
        b.setAttribute('aria-label', `${item.name} 차단`);
        b.addEventListener('click', async e => {
          e.preventDefault(); e.stopPropagation();
          const current = adapter.publisher(a); if (!current) return;
          const key = ASB.key(current); if (activeSellers.has(key)) return;
          const detail = adapter.isDetail(location) && !adapter.cardFor(a);
          const pageUrl = location.href;
          activeSellers.add(key);
          b.disabled = true;
          try {
            state = await ASB.request('block', {publisher:current});
            const targets = detail ? [a.closest('main,[role="main"]') || document.querySelector('main,[role="main"]')] : sellerCards(key);
            const valid = () => isEnabled() && location.href === pageUrl && state.blocked.some(item => ASB.key(item) === key);
            let committed = false;
            const commit = () => {
              if (committed) return;
              committed = true; activeSellers.delete(key); scan();
              if (detail && valid()) {
                if (history.length > 1) history.back();
                else location.replace(adapter.home);
              }
            };
            // Animation failure must never undo a successful save or strand a card.
            try {
              if (valid() && globalThis.ASBEffects) await ASBEffects.dissolve(targets, commit, valid);
              else commit();
            } catch { commit(); }
          } catch (error) {
            b.textContent = '다시 시도';
            b.title = error.message || '저장하지 못했습니다.';
            b.setAttribute('aria-label', `${current.name} 차단 실패, 다시 시도`);
          } finally { activeSellers.delete(key); b.disabled = false; }
        });
        a.after(b); buttons.set(a,b); adapter.prepare?.(a);
      }
      if (isEnabled()) for (const {card,publisher:item} of adapter.extraCards?.(document) || []) {
        if (blocked.has(ASB.key(item)) && !activeSellers.has(ASB.key(item))) card.setAttribute('data-asb-hidden','true');
      }
    } finally {
      observer?.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['href'],characterData:true});
    }
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(scan,120); }
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.state) { state = ASB.normalize(changes.state.newValue); schedule(); }
  });
  ASB.read().then(value => {
    state = value; observer = new MutationObserver(schedule); scan();
    window.addEventListener('pageshow', () => {
      ASB.read().then(value => { state = value; scan(); }).catch(error => console.warn('[SlopCut]', error.message));
    });
  }).catch(error => console.warn('[SlopCut]', error.message));
})();
