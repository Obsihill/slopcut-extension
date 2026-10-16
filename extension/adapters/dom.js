/* Only generated rows are edited; existing site-owned links stay in place. */
globalThis.ASBDOM = {
  sellerRow(container, item) {
    let row = [...container.children].find(e => e.hasAttribute('data-asb-seller-row'));
    if (!item) { row?.remove(); return; }
    if (!row) {
      row = document.createElement('div'); row.className = 'asb-seller-row';
      row.setAttribute('data-asb-seller-row','');
      row.append(document.createElement('a')); container.append(row);
    }
    const a = row.querySelector('a'), href = ASB.sellerUrl(item);
    if (a.getAttribute('href') !== href) a.setAttribute('href',href);
    if (a.textContent !== item.name) a.textContent = item.name;
    return a;
  }
};
