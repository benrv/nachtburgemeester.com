/* ============================================================
   NACHTREGISTER — productie
   licht · rook · kaart · register · correcties
   ============================================================ */
(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  const TZ = 'Europe/Amsterdam';
  const STATUS = { actief: 'Burgemeester', collectief: 'Collectief', vacant: 'Geen burgemeester' };
  const labels = { dawn: 'Dageraad', day: 'Dag', dusk: 'Schemer', night: 'Nacht' };
  let hazeReady = false;

  const timeFmt = new Intl.DateTimeFormat('nl-NL', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const hmFmt = new Intl.DateTimeFormat('nl-NL', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });
  const shortDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso.length === 4 ? iso + '-01-01T12:00:00' : iso + 'T12:00:00');
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(d).replace(/\//g, '.');
  };

  /* ---------- sun & sky ---------- */
  function solar(date) {
    const rad = Math.PI / 180;
    const y = date.getUTCFullYear();
    const day = Math.floor((Date.UTC(y, date.getUTCMonth(), date.getUTCDate()) - Date.UTC(y, 0, 0)) / 86400000);
    const g = (357.529 + 0.98560028 * day) * rad;
    const q = 280.459 + 0.98564736 * day;
    const L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * rad;
    const e = (23.439 - 0.00000036 * day) * rad;
    const dec = Math.asin(Math.sin(e) * Math.sin(L));
    let RA = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / rad;
    RA = (RA + 360) % 360;
    let eq = 4 * (q - RA);
    if (eq > 20) eq -= 1440;
    const lat = 52.3676, lon = 4.9041;
    const noonUTC = 720 - 4 * lon - eq;
    const cosH = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(dec)) / (Math.cos(lat * rad) * Math.cos(dec));
    if (cosH < -1 || cosH > 1) return null;
    const ha = Math.acos(cosH) / rad;
    const nowUTC = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
    const alt = Math.asin(Math.sin(lat * rad) * Math.sin(dec) + Math.cos(lat * rad) * Math.cos(dec) * Math.cos(((nowUTC - noonUTC) / 4) * rad)) / rad;
    const toLocal = mins => hmFmt.format(new Date(Date.UTC(y, date.getUTCMonth(), date.getUTCDate()) + mins * 60000));
    return { rise: toLocal(noonUTC - 4 * ha), set: toLocal(noonUTC + 4 * ha), noon: noonUTC, alt, morning: nowUTC < noonUTC };
  }

  const phaseFor = (date) => {
    const s = solar(date);
    if (!s) return { phase: 'night', sun: null };
    if (s.alt > 3) return { phase: 'day', sun: s };
    if (s.alt > -6) return { phase: s.morning ? 'dawn' : 'dusk', sun: s };
    return { phase: 'night', sun: s };
  };

  const sky = { mode: 'auto', visual: 'night', phase: 'night', sun: null };
  try {
    const saved = localStorage.getItem('nr-sky');
    if (saved && ['auto', 'dawn', 'day', 'dusk', 'night'].includes(saved)) sky.mode = saved;
  } catch (e) {}
  const param = new URLSearchParams(location.search).get('sky');
  if (param && ['dawn', 'day', 'dusk', 'night'].includes(param)) sky.mode = param;

  const setSkyLabels = () => {
    const label = labels[sky.visual] || 'Nacht';
    const btn = $('#skyBtnLabel');
    if (btn) btn.textContent = label;
    const pass = $('#passPhase');
    if (pass) pass.textContent = label;
    const auto = $('#skyAutoLabel');
    if (auto) auto.textContent = sky.mode === 'auto' ? `${label} · ${hmFmt.format(new Date())}` : 'Handmatig gekozen';
    $$('[data-sky-mode]').forEach(b => b.classList.toggle('is-on', b.dataset.skyMode === sky.mode));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', sky.visual === 'day' ? '#E9E3D6' : sky.visual === 'dusk' ? '#120D18' : sky.visual === 'dawn' ? '#0B1620' : '#0A0A0B');
  };

  const applySky = (visual, animate = true) => {
    const change = () => {
      document.documentElement.dataset.sky = visual;
      sky.visual = visual;
      setSkyLabels();
      updateSunLine();
      setHazePalette(visual);
      if (hazeReady) hazeBurst(innerWidth * .5, innerHeight * .62, 9, 1);
    };
    if (animate && !reduce && document.startViewTransition) document.startViewTransition(change);
    else change();
  };

  const computeAuto = () => {
    const p = phaseFor(new Date());
    sky.phase = p.phase; sky.sun = p.sun;
    return p.phase;
  };

  const setMode = (mode, animate = true) => {
    sky.mode = mode;
    try { localStorage.setItem('nr-sky', mode); } catch (e) {}
    const visual = mode === 'auto' ? computeAuto() : mode;
    if (mode !== 'auto') { const p = phaseFor(new Date()); sky.sun = p.sun; sky.phase = p.phase; }
    if (visual !== sky.visual) applySky(visual, animate);
    else { setSkyLabels(); updateSunLine(); }
  };

  const updateSunLine = () => {
    const s = sky.sun || solar(new Date());
    if (!s) return;
    sky.sun = s;
    const sun = $('#sunLine');
    if (sun) sun.textContent = `Zon op ${s.rise} · onder ${s.set}`;
    const st = $('#passStatus');
    if (!st) return;
    const h = Number(new Intl.DateTimeFormat('nl-NL', { timeZone: TZ, hour: '2-digit', hour12: false }).format(new Date()));
    if (sky.mode !== 'auto') {
      st.textContent = sky.visual === 'night' ? 'De nacht is open' : sky.visual === 'dusk' ? 'De nacht begint' : sky.visual === 'dawn' ? 'De nacht is voorbij' : 'De nacht komt eraan';
    } else {
      st.textContent = (h >= 21 || h < 6) ? 'De nacht is open' : h < 6 ? 'De nacht is voorbij' : h >= 17 ? 'De nacht begint' : 'De nacht komt eraan';
    }
  };

  const tick = () => {
    const p = Object.fromEntries(timeFmt.formatToParts(new Date()).map(x => [x.type, x.value]));
    const clock = $('#clock');
    if (clock) clock.innerHTML = `${p.hour}:${p.minute}<em>:${p.second}</em>`;
    const pass = $('#passClock');
    if (pass) pass.textContent = `${p.hour}:${p.minute}`;
    if (sky.mode === 'auto') {
      const ph = phaseFor(new Date());
      sky.phase = ph.phase; sky.sun = ph.sun;
      if (ph.phase !== sky.visual) applySky(ph.phase, true);
      else setSkyLabels();
    }
    updateSunLine();
  };

  const init = phaseFor(new Date());
  sky.phase = init.phase; sky.sun = init.sun;
  sky.visual = sky.mode === 'auto' ? init.phase : sky.mode;
  applySky(sky.visual, false);
  tick();
  setInterval(tick, 1000);

  /* ---------- header ---------- */
  const skyBtn = $('#skyBtn');
  const skyMenu = $('#skyMenu');
  const closeSky = () => { if (!skyMenu) return; skyMenu.hidden = true; skyBtn?.setAttribute('aria-expanded', 'false'); };
  const openSky = () => { if (!skyMenu) return; skyMenu.hidden = false; skyBtn?.setAttribute('aria-expanded', 'true'); };
  skyBtn?.addEventListener('click', e => {
    e.stopPropagation();
    skyMenu.hidden ? openSky() : closeSky();
  });
  document.addEventListener('click', e => {
    if (skyMenu && !skyMenu.hidden && !skyMenu.contains(e.target) && !skyBtn.contains(e.target)) closeSky();
  });
  $$('[data-sky-mode]').forEach(btn => btn.addEventListener('click', () => { setMode(btn.dataset.skyMode, true); closeSky(); }));

  const menuBtn = $('#menuBtn');
  const mobileNav = $('#mobileNav');
  function closeMenu() {
    if (!mobileNav || !mobileNav.classList.contains('is-open')) return;
    mobileNav.classList.remove('is-open');
    mobileNav.setAttribute('aria-hidden', 'true');
    if (menuBtn) { menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.textContent = 'Menu'; }
    document.body.classList.remove('is-locked');
  }
  menuBtn?.addEventListener('click', () => {
    if (!mobileNav) return;
    const open = !mobileNav.classList.contains('is-open');
    mobileNav.classList.toggle('is-open', open);
    mobileNav.setAttribute('aria-hidden', String(!open));
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Sluit' : 'Menu';
    document.body.classList.toggle('is-locked', open);
  });
  $$('a', mobileNav).forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeMenu(); closeSky(); }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      const search = $('#search');
      if (!search) return;
      e.preventDefault();
      $('#register')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      setTimeout(() => search.focus(), reduce ? 0 : 400);
    }
  });

  /* ---------- haze ---------- */
  const canvas = $('#haze');
  const ctx = canvas?.getContext('2d');
  let hazeParts = [], hazeRAF = 0, hazeSprites = {}, hazeTint = 'light', W = 0, H = 0, DPR = 1;
  let lastHaze = 0, lastEmit = 0;

  function makeSprite(color, soft) {
    const s = document.createElement('canvas');
    s.width = s.height = 256;
    const c = s.getContext('2d');
    const g = c.createRadialGradient(128, 128, 4, 128, 128, 128);
    g.addColorStop(0, `rgba(${color},${soft})`);
    g.addColorStop(.45, `rgba(${color},${soft * .55})`);
    g.addColorStop(1, `rgba(${color},0)`);
    c.fillStyle = g; c.fillRect(0, 0, 256, 256);
    return s;
  }
  function resizeHaze() {
    if (!canvas) return;
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = innerWidth; H = innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  function seedHaze() {
    const n = innerWidth < 720 ? 14 : 30;
    hazeParts = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: 160 + Math.random() * 300,
      vx: (Math.random() - .5) * .18, vy: -.05 - Math.random() * .18,
      a: .06 + Math.random() * .08, life: 1
    }));
  }
  function setHazePalette(visual) {
    if (!hazeReady || !ctx) return;
    hazeTint = visual === 'day' ? 'dark' : 'light';
    hazeSprites = { light: makeSprite('238,242,232', .5), dark: makeSprite('74,70,60', .42) };
  }
  function hazeBurst(x, y, amount = 8, power = 1) {
    if (!ctx || reduce) return;
    for (let i = 0; i < amount; i++) {
      hazeParts.push({
        x: x + (Math.random() - .5) * 120, y: y + (Math.random() - .5) * 80,
        r: 70 + Math.random() * 170,
        vx: (Math.random() - .5) * .7 * power, vy: (-.15 - Math.random() * .5) * power,
        a: .05 + Math.random() * .08, life: 1
      });
    }
    if (hazeParts.length > 90) hazeParts.splice(0, hazeParts.length - 90);
  }
  function drawHaze(t) {
    hazeRAF = requestAnimationFrame(drawHaze);
    if (document.hidden) return;
    if (t - lastHaze < 32) return;
    lastHaze = t;
    if (t - lastEmit > 1600) {
      lastEmit = t;
      hazeParts.push({ x: Math.random() * W, y: H + 120, r: 190 + Math.random() * 220, vx: (Math.random() - .5) * .12, vy: -.22 - Math.random() * .22, a: .05 + Math.random() * .05, life: 1.8 });
    }
    ctx.clearRect(0, 0, W, H);
    const sprite = hazeTint === 'day' ? hazeSprites.dark : hazeSprites.light;
    if (!sprite) return;
    for (const p of hazeParts) {
      p.x += p.vx; p.y += p.vy;
      if (p.y < -p.r) { p.y = H + p.r; p.x = Math.random() * W; }
      if (p.x < -p.r) p.x = W + p.r;
      if (p.x > W + p.r) p.x = -p.r;
      if (p.life !== 1) { p.life -= .004; p.a *= .998; }
      ctx.globalAlpha = Math.max(0, p.a * p.life);
      ctx.drawImage(sprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    ctx.globalAlpha = 1;
    hazeParts = hazeParts.filter(p => p.life > 0);
  }
  if (canvas && ctx && !reduce) {
    resizeHaze(); seedHaze(); drawHaze(0);
    hazeReady = true; setHazePalette(sky.visual);
    addEventListener('resize', () => { resizeHaze(); seedHaze(); });
    setTimeout(() => hazeBurst(innerWidth * .72, innerHeight * .42, 14, 1.4), 500);
    setTimeout(() => hazeBurst(innerWidth * .5, innerHeight * .98, 12, 1.2), 900);
    document.addEventListener('pointerdown', e => {
      if (e.target.closest('.btn')) hazeBurst(e.clientX, e.clientY, 9, 1.25);
    }, { passive: true });
    addEventListener('click', e => {
      if (e.target.closest('a,button,input,select,textarea,label')) return;
      hazeBurst(e.clientX, e.clientY, 7, 1.1);
    }, { passive: true });
  }

  /* ---------- map ---------- */
  const mapBox = $('.mapsec__map');
  const tooltip = $('#mapTip');
  const panel = {
    status: $('#msStatus'), prov: $('#msProv'), city: $('#msCity'), mayor: $('#msMayor'),
    since: $('#msSince'), blurb: $('#msBlurb'), tags: $('#msTags'), source: $('#msSource'),
    checked: $('#msChecked'), open: $('#msOpen')
  };
  if (mapBox && panel.city) {
    const nodes = $$('.map-node', mapBox);
    const nlMap = $('#nlMap');
    if (nlMap) {
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach(en => { if (en.isIntersecting) { nlMap.classList.add('is-lit'); io.disconnect(); } });
        }, { threshold: .12 });
        io.observe(nlMap);
      } else nlMap.classList.add('is-lit');
    }
    const update = (el) => {
      const status = el.dataset.status;
      const name = el.dataset.name || '';
      panel.status.className = `status status--${status}`;
      panel.status.innerHTML = `<i></i>${STATUS[status] || 'Burgemeester'}`;
      panel.prov.textContent = el.dataset.province || '';
      panel.city.textContent = el.dataset.city || '';
      panel.mayor.textContent = name || 'Geen burgemeester';
      panel.since.textContent = status === 'actief' && el.dataset.since ? `· sinds ${el.dataset.since}` : '';
      panel.blurb.textContent = el.dataset.blurb || '';
      panel.tags.innerHTML = (el.dataset.tags || '').split('|').filter(Boolean).map(t => `<span>${t}</span>`).join('');
      panel.source.textContent = el.dataset.source || 'Bron volgt';
      if (el.dataset.sourceUrl) panel.source.href = el.dataset.sourceUrl; else panel.source.removeAttribute('href');
      panel.checked.textContent = `gecontroleerd ${shortDate(el.dataset.checked)}`;
      if (el.dataset.href) panel.open.href = el.dataset.href;
    };
    const tip = (el) => {
      if (!tooltip) return;
      const r = el.getBoundingClientRect(), b = mapBox.getBoundingClientRect();
      tooltip.innerHTML = `${el.dataset.city}<small>${el.dataset.name || 'Geen burgemeester'}</small>`;
      tooltip.style.left = `${r.left - b.left + r.width / 2}px`;
      tooltip.style.top = `${r.top - b.top}px`;
      tooltip.classList.add('is-on');
    };
    nodes.forEach(el => {
      el.addEventListener('mouseenter', () => { update(el); tip(el); });
      el.addEventListener('focus', () => { update(el); tip(el); });
      el.addEventListener('mouseleave', () => tooltip?.classList.remove('is-on'));
      el.addEventListener('blur', () => tooltip?.classList.remove('is-on'));
    });
  }

  /* ---------- register ---------- */
  const register = $('#register');
  if (register) {
    const rows = $$('.row', register);
    const rowsBox = $('#rowList');
    const empty = $('#empty');
    const search = $('#search');
    const province = $('#province');
    const meta = $('#regMeta');
    const chips = $$('.chip', register);
    const state = { status: 'actief', q: '', province: 'all' };
    const label = { actief: 'burgemeesters', collectief: 'collectieven', vacant: 'steden zonder burgemeester' };

    const apply = () => {
      let visible = 0;
      rows.forEach(row => {
        const okStatus = row.dataset.status === state.status;
        const okProvince = state.province === 'all' || row.dataset.province === state.province;
        const hay = `${row.dataset.city} ${row.dataset.name} ${row.dataset.province} ${row.dataset.tags} ${row.dataset.source}`.toLowerCase();
        const okQuery = !state.q || hay.includes(state.q);
        const show = okStatus && okProvince && okQuery;
        row.hidden = !show;
        if (show) {
          visible++;
          const idx = row.querySelector('.row__idx');
          if (idx) idx.textContent = String(visible).padStart(2, '0');
        }
      });
      if (rowsBox) rowsBox.dataset.filter = state.status;
      if (meta) meta.textContent = `${visible} ${label[state.status]}`;
      if (search) search.placeholder = `Zoek in ${label[state.status]}`;
      if (empty) empty.hidden = visible !== 0;
    };

    chips.forEach(chip => chip.addEventListener('click', () => {
      chips.forEach(c => { const on = c === chip; c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', String(on)); });
      state.status = chip.dataset.status;
      apply();
    }));
    search?.addEventListener('input', e => { state.q = e.target.value.trim().toLowerCase(); apply(); });
    province?.addEventListener('change', e => { state.province = e.target.value; apply(); });
    $('#reset')?.addEventListener('click', () => {
      state.q = ''; state.status = 'actief'; state.province = 'all';
      if (search) search.value = '';
      if (province) province.value = 'all';
      chips.forEach(c => { const on = c.dataset.status === 'actief'; c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', String(on)); });
      apply();
    });

    // hover preview
    const preview = $('#preview');
    if (preview) {
      const pv = { status: $('#pvStatus'), city: $('#pvCity'), mayor: $('#pvMayor'), check: $('#pvCheck') };
      register.addEventListener('mouseover', e => {
        const row = e.target.closest('.row');
        if (!row || !fine) return;
        pv.status.textContent = STATUS[row.dataset.status] || '';
        pv.city.textContent = row.dataset.city;
        pv.mayor.textContent = row.dataset.name || 'Geen burgemeester';
        pv.check.textContent = `✓ bron · ${shortDate(row.dataset.checked)}`;
        preview.classList.add('is-on');
      });
      register.addEventListener('mousemove', e => {
        if (!preview.classList.contains('is-on')) return;
        const x = Math.min(e.clientX + 22, window.innerWidth - 250);
        const y = Math.max(e.clientY - 152, 110);
        preview.style.transform = `translate(${x}px, ${y}px) rotate(-2deg)`;
      });
      register.addEventListener('mouseleave', () => preview.classList.remove('is-on'));
    }
    apply();
  }

  /* ---------- reveal ---------- */
  const revealEls = $$('[data-reveal]');
  revealEls.forEach(el => {
    const sibs = el.parentElement ? [...el.parentElement.children].filter(x => x.hasAttribute('data-reveal')) : [];
    const idx = sibs.indexOf(el);
    if (idx > 0) el.style.setProperty('--d', `${Math.min(idx * .07, .35)}s`);
  });
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    revealEls.forEach(el => io.observe(el));
  } else revealEls.forEach(el => el.classList.add('is-in'));

  // count-up
  const counters = $$('[data-count]');
  if (counters.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      counters.forEach(el => { el.textContent = el.dataset.count; });
    } else {
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          const el = en.target, target = Number(el.dataset.count);
          if (!Number.isFinite(target)) return;
          const t0 = performance.now();
          const step = t => {
            const p = Math.min(1, (t - t0) / 850);
            el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          io.unobserve(el);
        });
      }, { threshold: .6 });
      counters.forEach(el => io.observe(el));
    }
  }

  /* ---------- cursor / spotlight / progress ---------- */
  const cursor = $('.cursor');
  if (cursor && fine) {
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    addEventListener('mousemove', e => {
      tx = e.clientX; ty = e.clientY;
      document.documentElement.style.setProperty('--mx', `${e.clientX}px`);
      document.documentElement.style.setProperty('--my', `${e.clientY}px`);
      cursor.classList.add('is-on');
    });
    (function loop() {
      cx += (tx - cx) * .2; cy += (ty - cy) * .2;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener('mouseover', e => cursor.classList.toggle('is-big', !!e.target.closest('a, button, .row, .map-node, .chip')));
    document.addEventListener('mouseleave', () => cursor.classList.remove('is-on'));
  }

  const hero = $('.hero');
  if (hero && !reduce && fine) {
    hero.addEventListener('mousemove', e => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--px', (e.clientX - r.left) / r.width - .5);
      hero.style.setProperty('--py', (e.clientY - r.top) / r.height - .5);
    });
    hero.addEventListener('mouseleave', () => { hero.style.setProperty('--px', 0); hero.style.setProperty('--py', 0); });
  }

  const progress = $('.progress i');
  if (progress) {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      progress.style.width = `${Math.min(100, (scrollY / Math.max(h, 1)) * 100)}%`;
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- correction form ---------- */
  const form = $('#correctionForm');
  if (form) {
    const city = $('#corrCity');
    const text = $('#corrText');
    const source = $('#corrSource');
    const mail = $('#corrMail');
    const consent = $('#corrConsent');
    const msg = $('#formMsg');
    const endpoint = form.dataset.endpoint || '';

    const qs = new URLSearchParams(location.search).get('stad');
    if (qs && city) {
      const opt = [...city.options].find(o => o.value === qs);
      if (opt) opt.selected = true;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!msg) return;
      msg.classList.remove('is-ok', 'is-error');
      if (!city?.value) { msg.textContent = 'Kies eerst een stad.'; msg.classList.add('is-error'); city?.focus(); return; }
      if (!text || text.value.trim().length < 8) { msg.textContent = 'Beschrijf iets specifieker wat er niet klopt.'; msg.classList.add('is-error'); text?.focus(); return; }
      if (!source || source.value.trim().length < 5) { msg.textContent = 'Voeg een bron toe: een link, artikel of omschrijving.'; msg.classList.add('is-error'); source?.focus(); return; }
      if (mail?.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value.trim())) { msg.textContent = 'Dit e-mailadres lijkt niet te kloppen.'; msg.classList.add('is-error'); mail.focus(); return; }
      if (consent && !consent.checked) { msg.textContent = 'Vink de privacyverklaring aan om de melding te versturen.'; msg.classList.add('is-error'); consent.focus(); return; }

      const honeypot = form.querySelector('input[name="website"]');
      if (honeypot && honeypot.value) { msg.textContent = 'Dank voor je melding.'; msg.classList.add('is-ok'); form.reset(); return; }

      const data = {
        city: city.value,
        correction: text.value.trim(),
        source: source.value.trim(),
        email: mail?.value.trim() || '',
        page: location.href
      };

      if (endpoint) {
        const btn = form.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.dataset.label = btn.innerHTML; btn.textContent = 'Versturen…'; }
        try {
          const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
          if (!res.ok) throw new Error('netwerk');
          msg.textContent = 'Dank. We controleren je melding en passen het register aan met bron en datum.';
          msg.classList.add('is-ok');
          form.reset();
        } catch (err) {
          msg.textContent = 'Versturen lukte niet. Mail ons op hallo@nachtburgermeester.com.';
          msg.classList.add('is-error');
        } finally {
          if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.label || btn.innerHTML; }
        }
      } else {
        const body = `Stad: ${data.city}\n\nWat klopt er niet:\n${data.correction}\n\nBron:\n${data.source}\n\nE-mail: ${data.email || 'niet opgegeven'}\nPagina: ${data.page}`;
        location.href = `mailto:hallo@nachtburgermeester.com?subject=${encodeURIComponent('Correctie nachtregister: ' + data.city)}&body=${encodeURIComponent(body)}`;
        msg.textContent = 'Je e-mailprogramma opent met de melding. Verstuur de e-mail om de correctie af te ronden.';
        msg.classList.add('is-ok');
      }
    });
  }
})();
