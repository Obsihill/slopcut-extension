/* Dissolve the live DOM with a noise mask; no screenshots or image downloads. */
globalThis.ASBEffects = (() => {
  const clamp = value => Math.max(0, Math.min(1, value));
  const finish = callback => { callback(); return Promise.resolve(); };

  function dissolve(elements, commit, valid = () => true) {
    const cards = [...new Set(elements)].filter(el => el?.isConnected);
    // This effect is explicitly requested by the user clicking Block or Preview.
    // Do not silently disable it when Windows reports reduced motion.
    if (!window.requestAnimationFrame || document.hidden) return finish(commit);
    const visible = cards.filter(el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
    }).slice(0, 8);
    if (!visible.length) return finish(commit);
    const overlay = document.createElement('canvas');
    overlay.className = 'asb-dust'; overlay.setAttribute('aria-hidden', 'true');
    const ctx = overlay.getContext('2d');
    if (!ctx) return finish(commit);
    const scale = Math.min(window.devicePixelRatio || 1, 1.5);
    overlay.width = Math.ceil(innerWidth * scale); overlay.height = Math.ceil(innerHeight * scale);
    ctx.scale(scale, scale);
    const properties = ['mask-image', 'mask-size', 'mask-repeat', 'filter', 'pointer-events'];
    const jobs = visible.map(el => {
      const rect = el.getBoundingClientRect(), mask = document.createElement('canvas');
      mask.width = Math.min(160, Math.max(1, Math.ceil(rect.width / 4)));
      mask.height = Math.min(180, Math.max(1, Math.ceil(rect.height / 4)));
      const mc = mask.getContext('2d'), pixels = mc.createImageData(mask.width, mask.height);
      const noise = Float32Array.from({length: mask.width * mask.height}, (_, i) => {
        const x = (i % mask.width) / mask.width, y = Math.floor(i / mask.width) / mask.height;
        return .04 + ((1 - x) * .55 + y * .15 + Math.random() * .3) * .6;
      });
      const dust = Array.from({length: Math.min(80, Math.ceil(rect.width * rect.height / 900))}, () => {
        const x = Math.random(), y = Math.random();
        const index = Math.min(mask.height - 1, Math.floor(y * mask.height)) * mask.width + Math.min(mask.width - 1, Math.floor(x * mask.width));
        return {x, y, birth: noise[index], vx: 30 + Math.random() * 100, vy: -20 - Math.random() * 70, size: 1 + Math.random() * 2.5, shade: Math.floor(Math.random() * 32)};
      });
      const saved = properties.map(name => [name, el.style.getPropertyValue(name), el.style.getPropertyPriority(name)]);
      const filter = window.getComputedStyle(el).filter;
      el.style.setProperty('mask-size', '100% 100%', 'important');
      el.style.setProperty('mask-repeat', 'no-repeat', 'important');
      el.style.setProperty('pointer-events', 'none', 'important');
      el.setAttribute('data-asb-dissolving', 'true');
      return {el, mask, mc, pixels, noise, dust, saved, filter: filter === 'none' ? '' : filter};
    });
    document.documentElement.append(overlay);
    return new Promise(resolve => {
      let start, last = -Infinity, ended = false, frame, deadline;
      function complete() {
        if (ended) return;
        ended = true; window.cancelAnimationFrame(frame); clearTimeout(deadline);
        document.removeEventListener('visibilitychange', onVisibility);
        // Measure the remaining grid cells before removing the blocked ones (FLIP).
        const neighbors = new Set();
        for (const card of cards) for (const sibling of card.parentElement?.children || []) {
          if (!cards.includes(sibling) && neighbors.size < 120) neighbors.add(sibling);
        }
        const before = [...neighbors].map(el => [el, el.getBoundingClientRect()]);
        overlay.remove();
        for (const job of jobs) {
          job.el.removeAttribute('data-asb-dissolving');
          for (const [name, value, priority] of job.saved) {
            if (value) job.el.style.setProperty(name, value, priority); else job.el.style.removeProperty(name);
          }
        }
        try {
          commit();
          if (!document.hidden) for (const [el, old] of before) {
            if (!el.isConnected || !el.animate) continue;
            const next = el.getBoundingClientRect(), x = old.left - next.left, y = old.top - next.top;
            if ((!x && !y) || !next.width || !next.height || next.bottom < 0 || next.top > innerHeight) continue;
            const base = window.getComputedStyle(el).transform;
            el.animate([{transform: `translate(${x}px,${y}px) ${base === 'none' ? '' : base}`}, {transform: base}], {duration: 240, easing: 'ease-out'});
          }
        } finally { resolve(); }
      }
      function onVisibility() { if (document.hidden) complete(); }
      function tick(now) {
        if (ended) return;
        if (!valid()) { complete(); return; }
        start ??= now;
        const t = clamp((now - start) / 900);
        if (now - last >= 30) {
          last = now; ctx.clearRect(0, 0, overlay.width / scale, overlay.height / scale);
          for (const job of jobs) {
            if (!job.el.isConnected) continue;
            const r = job.el.getBoundingClientRect();
            for (let i = 0; i < job.noise.length; i++) job.pixels.data[i * 4 + 3] = Math.round(clamp((job.noise[i] + .14 - t) / .14) * 255);
            job.mc.putImageData(job.pixels, 0, 0);
            job.el.style.setProperty('mask-image', `url("${job.mask.toDataURL()}")`, 'important');
            job.el.style.setProperty('filter', `${job.filter} grayscale(${clamp(t * 2)}) brightness(${1 - clamp(t * 1.4) * .9})`, 'important');
            for (const p of job.dust) {
              const age = (t - p.birth) / .34;
              if (age <= 0 || age >= 1) continue;
              ctx.globalAlpha = Math.sin(age * Math.PI) * .85;
              ctx.fillStyle = `rgb(${p.shade},${p.shade},${p.shade})`;
              const size = p.size * (1 - age * .6);
              ctx.fillRect(r.left + r.width * p.x + p.vx * age, r.top + r.height * p.y + p.vy * age + Math.sin(age * 7 + p.x * 10) * 8, size, size);
            }
          }
        }
        if (t >= 1) complete(); else frame = window.requestAnimationFrame(tick);
      }
      document.addEventListener('visibilitychange', onVisibility);
      deadline = setTimeout(complete, 1300);
      frame = window.requestAnimationFrame(tick);
    });
  }
  return {dissolve};
})();
