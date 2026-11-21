/* ============================================================
   NACHTREGISTER — afterhours layer
   sterren · marquee · section rail · kaart · tilt · cursor
   ============================================================ */
(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- section rail (ook met reduced motion) ---------- */
  const hero = $('.hero');
  if (hero) {
    const sections = $$('main > section[id]');
    const items = [
      { id: 'top', num: '00', label: 'Top' },
      ...sections.map((s) => ({
        id: s.id,
        num: ($('.sec-head__num', s)?.textContent || '').trim(),
        label: ($('.sec-head__label', s)?.textContent || s.id).trim()
      }))
    ];
    if (sections.length > 1) {
      const nav = document.createElement('nav');
      nav.className = 'nightrail';
      nav.setAttribute('aria-label', 'Secties op deze pagina');
      nav.innerHTML = items.map((item) => `
        <a href="#${item.id}" data-rail="${item.id}"${item.id === 'top' ? ' class="is-active" aria-current="true"' : ''}>
          <b>${item.num}</b><i aria-hidden="true"></i><span>${item.label}</span>
        </a>`).join('');
      document.body.append(nav);
      const links = $$('a', nav);
      let railTick = 0;
      const setActive = (id) => {
        links.forEach((a) => {
          const on = a.dataset.rail === id;
          a.classList.toggle('is-active', on);
          if (on) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      };
      const updateRail = () => {
        railTick = 0;
        nav.classList.toggle('is-on', scrollY > 90);
        const probe = scrollY + innerHeight * .38;
        if (scrollY < hero.offsetHeight * .55) { setActive('top'); return; }
        let current = 'top';
        for (const s of sections) {
          if (s.offsetTop <= probe) current = s.id;
        }
        setActive(current);
      };
      addEventListener('scroll', () => {
        if (!railTick) railTick = requestAnimationFrame(updateRail);
      }, { passive: true });
      addEventListener('resize', updateRail);
      updateRail();
    }
  }

  /* ---------- agenda filter ---------- */
  const agenda = $('[data-agenda]');
  if (agenda) {
    const rows = $$('.agenda__row', agenda);
    const filters = $$('[data-agenda-filter]', agenda);
    const empty = $('[data-agenda-empty]', agenda);
    const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(new Date());
    let current = 'all';
    const applyAgenda = () => {
      let visible = 0;
      filters.forEach((b) => {
        const f = b.dataset.agendaFilter;
        const count = rows.filter((r) => r.dataset.date >= today && (f === 'all' || r.dataset.venue === f)).length;
        const badge = b.querySelector('span');
        if (badge) badge.textContent = count;
      });
      rows.forEach((row) => {
        const upcoming = row.dataset.date >= today;
        const matches = current === 'all' || row.dataset.venue === current;
        const show = upcoming && matches;
        row.hidden = !show;
        if (show) visible++;
      });
      if (empty) empty.hidden = visible !== 0;
      filters.forEach((b) => {
        const on = b.dataset.agendaFilter === current;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', String(on));
      });
    };
    filters.forEach((b) => b.addEventListener('click', () => { current = b.dataset.agendaFilter; applyAgenda(); }));
    applyAgenda();
  }

  /* ---------- sky-change flash ---------- */
  const html = document.documentElement;
  if (!reduce) {
    let lastSky = html.dataset.sky;
    let flashTimer = 0;
    new MutationObserver(() => {
      const next = html.dataset.sky;
      if (next === lastSky) return;
      lastSky = next;
      document.body.classList.remove('is-sky-shift');
      void document.body.offsetWidth;
      document.body.classList.add('is-sky-shift');
      clearTimeout(flashTimer);
      flashTimer = setTimeout(() => document.body.classList.remove('is-sky-shift'), 850);
    }).observe(html, { attributes: true, attributeFilter: ['data-sky'] });
  }

  if (reduce) return;

  /* ---------- hero stars ---------- */
  const starCanvas = $('#heroStars');
  if (starCanvas && hero) {
    const ctx = starCanvas.getContext('2d');
    let W = 0, H = 0, DPR = 1, stars = [], shot = null, raf = 0, last = 0;
    let px = 0, py = 0, tx = 0, ty = 0, visible = true;

    const seed = () => {
      const n = W < 720 ? 38 : 86;
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * W,
        y: Math.random() * H * .92,
        z: .25 + Math.random() * .75,
        s: .35 + Math.random() * 1.25,
        a: .22 + Math.random() * .65,
        ph: Math.random() * Math.PI * 2,
        drift: .01 + Math.random() * .025
      }));
    };
    const resize = () => {
      const r = hero.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      DPR = Math.min(window.devicePixelRatio || 1, 1.5);
      starCanvas.width = Math.round(W * DPR);
      starCanvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      seed();
    };
    const draw = (now) => {
      raf = requestAnimationFrame(draw);
      if (document.hidden || !visible) return;
      if (now - last < 33) return;
      last = now;
      const mode = html.dataset.sky || 'night';
      if (mode === 'day') { ctx.clearRect(0, 0, W, H); return; }
      px += (tx - px) * .035; py += (ty - py) * .035;
      ctx.clearRect(0, 0, W, H);
      const t = now * .001;
      ctx.globalCompositeOperation = 'lighter';
      for (const s of stars) {
        const x = s.x + Math.sin(t * .11 + s.ph) * 6 + px * s.z * 18;
        const y = s.y + Math.cos(t * .09 + s.ph) * 4 + py * s.z * 12;
        const tw = .55 + .45 * Math.sin(t * .9 + s.ph);
        const a = s.a * tw * (mode === 'dawn' ? .7 : 1);
        ctx.fillStyle = mode === 'dawn' ? `rgba(255,218,178,${a})` : mode === 'dusk' ? `rgba(255,226,200,${a})` : `rgba(241,237,227,${a})`;
        ctx.beginPath();
        ctx.arc(x, y, s.s, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!shot && Math.random() < .008) {
        shot = { x: W * (.15 + Math.random() * .7), y: H * (.1 + Math.random() * .45), vx: 4 + Math.random() * 4, vy: 1.2 + Math.random() * 2, life: 0 };
      }
      if (shot) {
        shot.life += 1;
        shot.x += shot.vx; shot.y += shot.vy;
        const fade = Math.max(0, 1 - shot.life / 26);
        ctx.strokeStyle = `rgba(255,255,255,${fade * .65})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(shot.x, shot.y);
        ctx.lineTo(shot.x - shot.vx * 8, shot.y - shot.vy * 8);
        ctx.stroke();
        if (shot.life > 28) shot = null;
      }
      ctx.globalCompositeOperation = 'source-over';
    };
    resize();
    addEventListener('resize', resize);
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(hero);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => { visible = entries[0]?.isIntersecting ?? true; }, { threshold: 0 }).observe(hero);
    }
    hero.addEventListener('pointermove', (e) => {
      if (!fine) return;
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - .5;
      ty = (e.clientY - r.top) / r.height - .5;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
    raf = requestAnimationFrame(draw);
  }

  /* ---------- scroll-reactive marquee ---------- */
  const marquee = $('[data-marquee]');
  if (marquee) {
    const track = $('.marquee__track', marquee);
    if (track) {
      marquee.classList.add('is-manual');
      let x = 0, lastY = scrollY, vel = 0, paused = false, last = performance.now();
      const frame = (now) => {
        requestAnimationFrame(frame);
        if (document.hidden) return;
        const dt = Math.min(50, now - last); last = now;
        const dy = scrollY - lastY; lastY = scrollY;
        vel += (dy - vel) * .14;
        if (!paused) {
          const speed = fine ? .55 : .38;
          x -= speed * (dt / 16.67) + Math.min(2.4, Math.abs(vel) * .12);
          const half = track.scrollWidth / 2;
          if (half > 0 && x <= -half) x = 0;
          if (x > 0) x = half > 0 ? -half : 0;
          const skew = clamp(-vel * .13, -2.6, 2.6);
          track.style.transform = `translate3d(${x}px,0,0) skewX(${skew}deg)`;
        }
      };
      marquee.addEventListener('mouseenter', () => { if (fine) paused = true; });
      marquee.addEventListener('mouseleave', () => { paused = false; });
      requestAnimationFrame(frame);
    }
  }

  /* ---------- map: pointer light, node focus, smoke ---------- */
  const mapBox = $('[data-map]');
  if (mapBox) {
    const setMapPoint = (e) => {
      const r = mapBox.getBoundingClientRect();
      mapBox.style.setProperty('--map-x', `${e.clientX - r.left}px`);
      mapBox.style.setProperty('--map-y', `${e.clientY - r.top}px`);
    };
    mapBox.addEventListener('pointermove', (e) => {
      setMapPoint(e);
      const node = e.target.closest('.map-node');
      $$('.map-node.is-hover', mapBox).forEach((n) => { if (n !== node) n.classList.remove('is-hover'); });
      if (node) node.classList.add('is-hover');
    }, { passive: true });
    mapBox.addEventListener('pointerleave', () => {
      $$('.map-node.is-hover', mapBox).forEach((n) => n.classList.remove('is-hover'));
      mapBox.style.removeProperty('--map-x');
      mapBox.style.removeProperty('--map-y');
    });
    mapBox.addEventListener('click', (e) => {
      if (!e.target.closest('.map-node')) return;
      window.dispatchEvent(new CustomEvent('nr:smoke', { detail: { x: e.clientX, y: e.clientY, amount: 5, power: .9 } }));
    }, { passive: true });
    if ('IntersectionObserver' in window) {
      const sec = mapBox.closest('.mapsec');
      new IntersectionObserver((entries) => {
        sec.classList.toggle('is-scanning', entries[0]?.isIntersecting ?? false);
      }, { threshold: .08 }).observe(mapBox);
    } else mapBox.closest('.mapsec')?.classList.add('is-scanning');
  }

  /* ---------- register row spotlight ---------- */
  $$('.row').forEach((row) => {
    row.addEventListener('pointermove', (e) => {
      const r = row.getBoundingClientRect();
      row.style.setProperty('--rx', `${((e.clientX - r.left) / r.width) * 100}%`);
      row.style.setProperty('--ry', `${((e.clientY - r.top) / r.height) * 100}%`);
    }, { passive: true });
  });

  /* ---------- 3D tilt for pass & poster ---------- */
  if (fine) {
    $$('[data-tilt]').forEach((el) => {
      const max = el.classList.contains('poster') ? 6 : 4.5;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - .5;
        const ny = (e.clientY - r.top) / r.height - .5;
        el.style.setProperty('--tilt-x', `${(-ny * max).toFixed(2)}deg`);
        el.style.setProperty('--tilt-y', `${(nx * max).toFixed(2)}deg`);
      }, { passive: true });
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--tilt-x', '0deg');
        el.style.setProperty('--tilt-y', '0deg');
      });
    });
  }

  /* ---------- cursor label ---------- */
  const cursor = $('.cursor');
  if (cursor && fine) {
    document.addEventListener('pointerover', (e) => {
      const t = e.target instanceof Element ? e.target.closest('a,button,.row,.map-node,.chip') : null;
      if (!t) { cursor.classList.remove('is-label'); cursor.removeAttribute('data-label'); return; }
      let label = 'OPEN';
      if (t.classList.contains('row')) label = 'BEKIJK';
      else if (t.classList.contains('map-node')) label = 'STAD';
      else if (t.classList.contains('chip')) label = 'FILTER';
      cursor.dataset.label = label;
      cursor.classList.add('is-label');
    });
    document.addEventListener('pointerout', (e) => {
      if (!e.relatedTarget) { cursor.classList.remove('is-label'); cursor.removeAttribute('data-label'); }
    });
  }
})();


/* ---------- rookpuffs (zonder canvas) ---------- */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  window.addEventListener('nr:smoke', (e) => {
    const d = e.detail || {};
    const amount = Math.min(14, d.amount ?? 7);
    const x = d.x ?? innerWidth * .5;
    const y = d.y ?? innerHeight * .6;
    for (let i = 0; i < amount; i++) {
      const puff = document.createElement('span');
      puff.className = 'smoke-puff';
      puff.setAttribute('aria-hidden', 'true');
      puff.style.setProperty('--x', `${x + (Math.random() - .5) * 110}px`);
      puff.style.setProperty('--y', `${y + (Math.random() - .5) * 60}px`);
      puff.style.animationDelay = `${Math.random() * .25}s`;
      document.body.append(puff);
      setTimeout(() => puff.remove(), 2400);
    }
  }, { passive: true });

  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.btn,.chip,.row,.map-node')) return;
    window.dispatchEvent(new CustomEvent('nr:smoke', { detail: { x: e.clientX, y: e.clientY, amount: 3, power: .7 } }));
  }, { passive: true });
})();
