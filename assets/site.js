/* ============================================================
   Megahit GrowthOS — shared site JS
   Modules: logo · custom cursor + orbit trail · starfield ·
   symbol generators (high-tech-metal family, dark) ·
   interactive aurora bars demo (aurora-breathing-light) ·
   dashboard feed · waitlist gate modal · reveals · nav
   ============================================================ */
'use strict';
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = matchMedia('(pointer: fine)').matches;

/* ---------- 1. Logo (inline SVG, recreated from brand mark) ---------- */
/* Three rising blades; tallest tip in brand blue. mode: 'mark' | 'full' */
function megahitLogo(mode = 'full', h = 30) {
  /* Official Megahit logos (from Megahit_logos/), recolored white-on-transparent
     for dark backgrounds. 'full' = horizontal lockup, 'mark' = square blades. */
  const src = mode === 'mark' ? '/assets/logo-mark.png' : '/assets/logo-horizontal.png';
  return `<img src="${src}" alt="Megahit.AI GrowthOS" height="${h}" style="height:${h}px;width:auto;display:block" draggable="false">`;
}
document.querySelectorAll('[data-logo]').forEach(el => {
  el.innerHTML = megahitLogo(el.dataset.logo || 'full', +(el.dataset.h || 30));
});

/* ---------- 2. Custom cursor: logo mark + glowing orbit trail ---------- */
(function cursor() {
  if (RM || !FINE) return;
  document.body.classList.add('custom-cursor');
  const cur = document.createElement('div');
  cur.id = 'cursor-logo';
  cur.innerHTML = megahitLogo('mark', 22);
  document.body.appendChild(cur);
  const cv = document.createElement('canvas');
  cv.id = 'cursor-trail';
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W, H; const fit = () => { W = cv.width = innerWidth; H = cv.height = innerHeight; };
  fit(); addEventListener('resize', fit);

  const pts = [];            // {x, y, t}
  const bursts = [];         // click rings {x, y, t}
  let mx = -100, my = -100;
  addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cur.style.left = mx + 'px'; cur.style.top = my + 'px';
    pts.push({ x: mx, y: my, t: performance.now() });
    if (pts.length > 90) pts.shift();
  });
  addEventListener('mousedown', () => { document.body.classList.add('cursor-down'); bursts.push({ x: mx, y: my, t: performance.now() }); });
  addEventListener('mouseup', () => document.body.classList.remove('cursor-down'));

  const LIFE = 750; // ms trail life
  (function draw() {
    const now = performance.now();
    ctx.clearRect(0, 0, W, H);
    while (pts.length && now - pts[0].t > LIFE) pts.shift();
    // glowing orbit-track: layered fading polyline (wide soft + thin bright core)
    if (pts.length > 2) {
      ctx.lineCap = ctx.lineJoin = 'round';
      for (const [width, color, blur] of [
        [7, 'rgba(38,78,247,', 18], [2.6, 'rgba(92,225,230,', 10], [1, 'rgba(255,255,255,', 4]
      ]) {
        for (let i = 1; i < pts.length; i++) {
          const a = (1 - (now - pts[i].t) / LIFE);
          if (a <= 0) continue;
          ctx.strokeStyle = color + (a * (width === 7 ? .35 : width === 2.6 ? .8 : .9)) + ')';
          ctx.lineWidth = width * a;
          ctx.shadowBlur = blur; ctx.shadowColor = color + a + ')';
          ctx.beginPath();
          ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
          ctx.lineTo(pts[i].x, pts[i].y);
          ctx.stroke();
        }
      }
      ctx.shadowBlur = 0;
    }
    // click bursts: expanding orbit ring
    for (let i = bursts.length - 1; i >= 0; i--) {
      const age = now - bursts[i].t, T = 650;
      if (age > T) { bursts.splice(i, 1); continue; }
      const p = age / T, r = 6 + p * 46, a = (1 - p);
      ctx.strokeStyle = `rgba(92,225,230,${a * .9})`;
      ctx.lineWidth = 1.4; ctx.shadowBlur = 14; ctx.shadowColor = `rgba(38,78,247,${a})`;
      ctx.beginPath(); ctx.ellipse(bursts[i].x, bursts[i].y, r, r * .38, -0.5, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;
    }
    requestAnimationFrame(draw);
  })();
})();

/* ---------- 3. Starfield (hero universe) ---------- */
function initStars(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, stars = [];
  const fit = () => {
    const r = canvas.parentElement.getBoundingClientRect();
    W = canvas.width = r.width; H = canvas.height = r.height;
    stars = Array.from({ length: Math.floor(W * H / 4200) }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() < .88 ? Math.random() * 1 + .3 : Math.random() * 1.8 + .8,
      ph: Math.random() * Math.PI * 2, sp: .3 + Math.random() * 1.2,
      hue: Math.random() < .12 ? 'rgba(92,225,230,' : Math.random() < .08 ? 'rgba(81,112,255,' : 'rgba(255,255,255,',
      depth: .3 + Math.random() * .7,
    }));
  };
  fit(); new ResizeObserver(fit).observe(canvas.parentElement);
  let px = 0, py = 0;
  if (!RM) addEventListener('mousemove', e => {
    px = (e.clientX / innerWidth - .5) * 14; py = (e.clientY / innerHeight - .5) * 8;
  });
  (function draw(t) {
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      const tw = RM ? .7 : .45 + .55 * Math.abs(Math.sin(t * .0004 * s.sp + s.ph));
      ctx.fillStyle = s.hue + (tw * .9) + ')';
      ctx.beginPath();
      ctx.arc(s.x - px * s.depth, s.y - py * s.depth, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!RM) requestAnimationFrame(draw);
  })(0);
}

/* ---------- 4. Symbol generators (high-tech-metal family, dark ink) ---------- */
const SYM_NS = 'http://www.w3.org/2000/svg';
const SYM_INK = 'rgba(235,240,255,.85)';
const SYM_ACC = '#264ef7';
function symEl(svg, name, attrs) {
  const el = document.createElementNS(SYM_NS, name);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  svg.appendChild(el); return el;
}
const SYMBOLS = {
  whirl(svg, { n = 44, step = 5.2, shrink = .962 } = {}) {
    let s = 86;
    for (let i = 0; i < n; i++) {
      symEl(svg, 'rect', { x: 100 - s / 2, y: 100 - s / 2, width: s, height: s, fill: 'none',
        stroke: i === n - 6 ? SYM_ACC : SYM_INK, 'stroke-width': .8, transform: `rotate(${i * step} 100 100)` });
      s *= shrink;
    }
  },
  fan(svg, { n = 36, spread = 74 } = {}) {
    for (let i = 0; i < n; i++)
      symEl(svg, 'line', { x1: 100, y1: 34, x2: 100 - spread + (i / (n - 1)) * spread * 2, y2: 166,
        stroke: i === Math.floor(n / 2) ? SYM_ACC : SYM_INK, 'stroke-width': .8 });
    symEl(svg, 'line', { x1: 100 - spread, y1: 166, x2: 100 + spread, y2: 166, stroke: SYM_INK, 'stroke-width': 1 });
  },
  rings(svg, { n = 24, gap = 3.5, k = 6 } = {}) {
    for (let i = 2; i < n; i++) {
      const pts = [];
      for (let a = 0; a <= 360; a += 5) {
        const rad = a * Math.PI / 180, r = i * gap + Math.sin(rad * k + i * .55) * 1.7 * (i / n);
        pts.push(`${(100 + Math.cos(rad) * r).toFixed(1)},${(100 + Math.sin(rad) * r).toFixed(1)}`);
      }
      symEl(svg, 'polygon', { points: pts.join(' '), fill: 'none', stroke: i === n - 3 ? SYM_ACC : SYM_INK, 'stroke-width': .7 });
    }
  },
  dots(svg, { n = 380, c = 4.3 } = {}) {
    for (let i = 1; i < n; i++) {
      const a = i * 137.508 * Math.PI / 180, r = c * Math.sqrt(i);
      if (r > 86) break;
      symEl(svg, 'circle', { cx: (100 + Math.cos(a) * r).toFixed(1), cy: (100 + Math.sin(a) * r).toFixed(1),
        r: (.5 + r / 86 * 1.6).toFixed(2), fill: i % 29 === 0 ? SYM_ACC : SYM_INK });
    }
  },
  orbits(svg, { rings = 4 } = {}) {
    symEl(svg, 'circle', { cx: 100, cy: 100, r: 6, fill: SYM_ACC });
    for (let i = 1; i <= rings; i++) {
      const r = 18 + i * 17;
      symEl(svg, 'ellipse', { cx: 100, cy: 100, rx: r, ry: r * .42, fill: 'none', stroke: SYM_INK,
        'stroke-width': .8, transform: `rotate(${i * 24} 100 100)` });
      const a = i * 2.1;
      symEl(svg, 'circle', { cx: 100 + r * Math.cos(a) * Math.cos(i * 24 * Math.PI / 180) - r * .42 * Math.sin(a) * Math.sin(i * 24 * Math.PI / 180),
        cy: 100 + r * Math.cos(a) * Math.sin(i * 24 * Math.PI / 180) + r * .42 * Math.sin(a) * Math.cos(i * 24 * Math.PI / 180),
        r: 2.6, fill: SYM_INK });
    }
  },
  waves(svg, { n = 14, amp = 9 } = {}) {
    for (let i = 0; i < n; i++) {
      const y = 34 + i * (132 / (n - 1)); let d = `M18 ${y}`;
      for (let x = 18; x <= 182; x += 6)
        d += ` L${x} ${(y + Math.sin((x + i * 14) * .06) * amp * Math.sin(i / n * Math.PI)).toFixed(1)}`;
      symEl(svg, 'path', { d, fill: 'none', stroke: i === Math.floor(n / 2) ? SYM_ACC : SYM_INK, 'stroke-width': .8 });
    }
  },
  arcs(svg, { n = 30 } = {}) {
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, len = .5 + (i % 5) * .28, r1 = 26 + (i % 7) * 9;
      const x0 = 100 + r1 * Math.cos(a0), y0 = 100 + r1 * Math.sin(a0);
      const x1 = 100 + r1 * Math.cos(a0 + len), y1 = 100 + r1 * Math.sin(a0 + len);
      symEl(svg, 'path', { d: `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r1} ${r1} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`,
        fill: 'none', stroke: i % 9 === 0 ? SYM_ACC : SYM_INK, 'stroke-width': .9 });
    }
  },
  grid(svg, { n = 12 } = {}) {
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = 26 + i * (148 / (n - 1)), y = 26 + j * (148 / (n - 1));
      const d = Math.hypot(x - 100, y - 100);
      symEl(svg, 'circle', { cx: x, cy: y, r: Math.max(.4, 2.4 - d / 42).toFixed(2),
        fill: d < 14 ? SYM_ACC : SYM_INK });
    }
  },
  liss(svg, { a = 3, b = 4 } = {}) {
    let d = '';
    for (let t = 0; t <= 400; t++) {
      const x = 100 + 74 * Math.sin(a * t * .0157 + Math.PI / 2), y = 100 + 74 * Math.sin(b * t * .0157);
      d += (t ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    symEl(svg, 'path', { d, fill: 'none', stroke: SYM_INK, 'stroke-width': .8 });
    symEl(svg, 'circle', { cx: 100, cy: 100, r: 3, fill: SYM_ACC });
  },
  burst(svg, { n = 60 } = {}) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, r0 = 12 + (i % 3) * 8, r1 = 60 + Math.sin(i * 1.7) * 24;
      symEl(svg, 'line', { x1: 100 + r0 * Math.cos(a), y1: 100 + r0 * Math.sin(a),
        x2: 100 + r1 * Math.cos(a), y2: 100 + r1 * Math.sin(a),
        stroke: i % 15 === 0 ? SYM_ACC : SYM_INK, 'stroke-width': .7 });
    }
  },
};
document.querySelectorAll('svg[data-sym]').forEach(svg => {
  svg.setAttribute('viewBox', '0 0 200 200');
  (SYMBOLS[svg.dataset.sym] || SYMBOLS.whirl)(svg);
  if (!RM) {
    const g = document.createElementNS(SYM_NS, 'g');
    while (svg.firstChild) g.appendChild(svg.firstChild);
    svg.appendChild(g);
    g.style.transformOrigin = '100px 100px';
    g.style.transition = 'transform 1.6s cubic-bezier(.22,1,.36,1)';
    svg.closest('.card, .symbol-tile')?.addEventListener('mouseenter', () => g.style.transform = 'rotate(16deg)');
    svg.closest('.card, .symbol-tile')?.addEventListener('mouseleave', () => g.style.transform = 'rotate(0deg)');
  }
});

/* ---------- 5. Interactive aurora bars (dark register) ----------
   From /aurora-breathing-light: stepped skyline of glowing bars.
   INTERACTION: click → impulse; bars near click surge + a glow bloom
   rises at the click point, then decays (~2.4s). */
/* Light pastel register (SuperMem reference): soft aurora columns rising
   from the bottom of a near-white card + ambient color blooms top-left.
   Clicks spawn a pastel bloom + local column surge. */
function initAuroraDemo(host) {
  if (!host) return;
  const cv = host.querySelector('canvas');
  const ctx = cv.getContext('2d');
  let W, H, cols = [], buf, bctx;
  const S = 4;                       // heavy downscale → dreamy soft columns
  const FAMS = [                     // pale luminous [bottom, mid] on dark
    ['#eef9f3', '#c9ecd9'],          // white-mint
    ['#b7d3ee', '#dbe8f8'],          // pale blue
    ['#7fd2c2', '#b5e9dd'],          // soft teal
    ['#f2f6fb', '#dfe9f5'],          // near-white
    ['#a9e6cf', '#d5f3e6'],          // mint
  ];
  const AMBIENT = [                  // teal/blue nebula, top-left
    { x: .16, y: .14, r: .34, c: 'rgba(20,120,110,.32)' },
    { x: .34, y: .18, r: .36, c: 'rgba(36,90,150,.3)' },
    { x: .08, y: .32, r: .26, c: 'rgba(38,78,247,.12)' },
  ];
  const fit = () => {
    const r = host.getBoundingClientRect();
    W = cv.width = r.width; H = cv.height = r.height;
    buf = document.createElement('canvas');
    buf.width = Math.ceil(W / S); buf.height = Math.ceil(H / S);
    bctx = buf.getContext('2d');
    const N = Math.max(22, Math.floor(W / 42));
    cols = Array.from({ length: N }, (_, i) => {
      const tall = Math.random();                     // irregular skyline, no center bell
      return {
        x: (i + .5) * (W / N) + (Math.random() - .5) * 6,
        w: (W / N) * (.5 + Math.random() * .2),       // distinct bars with gaps
        min: (.13 + tall * .2 + Math.random() * .05) * H,
        max: (.26 + tall * .42 + Math.random() * .08) * H,
        ph: Math.random() * Math.PI * 2,              // independent breathing
        sp: .0006 + Math.random() * .0007,
        fam: FAMS[i % FAMS.length],
        a: .75 + Math.random() * .25,
      };
    });
  };
  fit(); new ResizeObserver(fit).observe(host);
  const impulses = [];
  host.addEventListener('click', e => {
    const r = cv.getBoundingClientRect();
    impulses.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now(),
      fam: FAMS[(Math.random() * FAMS.length) | 0] });
  });
  (function draw(now) {
    for (let i = impulses.length - 1; i >= 0; i--)
      if (now - impulses[i].t > 2600) impulses.splice(i, 1);
    bctx.clearRect(0, 0, buf.width, buf.height);
    bctx.save();
    bctx.scale(1 / S, 1 / S);
    // ambient blooms, top-left (slow drift)
    for (let i = 0; i < AMBIENT.length; i++) {
      const b = AMBIENT[i];
      const dx = RM ? 0 : Math.sin(now * .00008 + i * 2.1) * W * .04;
      const dy = RM ? 0 : Math.cos(now * .0001 + i * 1.3) * H * .03;
      const g = bctx.createRadialGradient(b.x * W + dx, b.y * H + dy, 0, b.x * W + dx, b.y * H + dy, b.r * W);
      g.addColorStop(0, b.c);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      bctx.fillStyle = g;
      bctx.fillRect(0, 0, W, H);
    }
    // pastel aurora columns
    for (const c of cols) {
      const osc = RM ? .5 : .5 + .5 * Math.sin(now * c.sp + c.ph);
      let h = c.min + (c.max - c.min) * osc;
      let boost = 0, hueShift = null;
      for (const im of impulses) {
        const age = (now - im.t) / 2600;
        const k = Math.exp(-Math.pow((c.x - im.x) / (W * .08), 2));
        const s = k * (1 - age) * Math.exp(-age * 2.2);
        boost += s * H * .28;
        if (s > .25) hueShift = im.fam;
      }
      h += boost;
      const fam = hueShift || c.fam;
      const g = bctx.createLinearGradient(0, H, 0, H - h);
      g.addColorStop(0, fam[0] + 'e6');
      g.addColorStop(.55, fam[1] + '7a');
      g.addColorStop(1, fam[1] + '00');
      bctx.fillStyle = g;
      bctx.globalAlpha = c.a;
      bctx.fillRect(c.x - c.w / 2, H - h, c.w, h);
      bctx.globalAlpha = 1;
    }
    // click blooms: glow flare at the click point
    for (const im of impulses) {
      const age = (now - im.t) / 2600, a = (1 - age) * Math.exp(-age * 1.4);
      const g = bctx.createRadialGradient(im.x, im.y - age * 30, 0, im.x, im.y - age * 30, 90 + age * 70);
      g.addColorStop(0, im.fam[0] + Math.round(a * 100).toString(16).padStart(2, '0'));
      g.addColorStop(.6, im.fam[1] + Math.round(a * 45).toString(16).padStart(2, '0'));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      bctx.fillStyle = g;
      bctx.fillRect(0, 0, W, H);
    }
    bctx.restore();
    ctx.clearRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(buf, 0, 0, W, H);
    if (!RM) requestAnimationFrame(draw);
  })(0);
}
document.querySelectorAll('.aurora-demo').forEach(initAuroraDemo);

/* ---------- 6. Orbit globe (dark) ---------- */
function initGlobe(svg) {
  if (!svg) return;
  svg.setAttribute('viewBox', '0 0 240 240');
  const C = 120, R = 92;
  const rings = [
    { rx: R, ry: R }, { rx: R * .38, ry: R }, { rx: R * .78, ry: R }, { rx: R, ry: R * .34 },
  ];
  rings.forEach(r => symEl(svg, 'ellipse', { cx: C, cy: C, rx: r.rx, ry: r.ry, fill: 'none',
    stroke: 'rgba(235,240,255,.7)', 'stroke-width': 1 }));
  const dots = [
    { ring: 1, sp: .00042, ph: 0, c: '#5ce1e6' }, { ring: 1, sp: .00042, ph: 3.1, c: '#fff' },
    { ring: 2, sp: -.00031, ph: 1.2, c: '#264ef7' }, { ring: 2, sp: -.00031, ph: 4.4, c: '#fff' },
    { ring: 3, sp: .00052, ph: 2.0, c: '#07eda1' }, { ring: 3, sp: .00052, ph: 5.2, c: '#fff' },
  ].map(d => ({ ...d, el: symEl(svg, 'circle', { r: 4, fill: d.c }) }));
  (function tick(now) {
    for (const d of dots) {
      const r = rings[d.ring], a = d.ph + now * d.sp;
      d.el.setAttribute('cx', C + r.rx * Math.cos(a));
      d.el.setAttribute('cy', C + r.ry * Math.sin(a));
    }
    if (!RM) requestAnimationFrame(tick);
  })(0);
}
document.querySelectorAll('svg[data-globe]').forEach(initGlobe);

/* ---------- 7. Dashboard live feed + counters + sync ring ---------- */
function initDash(dash) {
  if (!dash) return;
  const feed = dash.querySelector('.feed');
  if (feed) {
    const items = [
      ['ai', 'AI', 'Scored 340 ICP leads, drafted 3 sequences'],
      ['ops', 'OPS', 'Closed KOL deal — $2.8K'],
      ['ai', 'AI', 'Published 2 comparison pages targeting "vs" keywords'],
      ['ai', 'AI', 'Rerouted demo traffic to top-ranking page (+5x)'],
      ['ops', 'OPS', 'Negotiated press placement — TechCrunch pitch sent'],
      ['ai', 'AI', 'A/B test #14 shipped: subject line variant +38% opens'],
      ['ops', 'OPS', 'Reviewed founder post draft — voice calibrated'],
      ['ai', 'AI', 'Flagged 3 new KOLs matching ICP · briefs generated'],
    ];
    let idx = 0;
    const push = () => {
      const [cls, tag, txt] = items[idx % items.length]; idx++;
      const el = document.createElement('div');
      el.className = 'feed-item ' + cls;
      el.innerHTML = `<b>${tag}</b>${txt}`;
      feed.prepend(el);
      while (feed.children.length > 5) feed.lastChild.remove();
    };
    push(); push(); push();
    if (!RM) setInterval(push, 2600);
  }
}
document.querySelectorAll('.dash').forEach(initDash);

/* animated counters: <b data-count="8000" data-suffix="+"> */
function animateCounter(el) {
  const target = parseFloat(el.dataset.count), suf = el.dataset.suffix || '', pre = el.dataset.prefix || '';
  if (RM) { el.textContent = pre + target.toLocaleString() + suf; return; }
  const T = 1400, t0 = performance.now();
  (function tick(now) {
    const p = Math.min(1, (now - t0) / T), e = 1 - Math.pow(1 - p, 3);
    el.textContent = pre + Math.round(target * e).toLocaleString() + suf;
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}

/* ---------- 7b. How-it-works step demos ---------- */
(function stepDemos() {
  /* Step 1: GOAL node decomposes into agent branches + a growing 6-month gantt */
  const ps = document.getElementById('plan-svg');
  if (ps) {
    const MONO = 'JetBrains Mono, monospace';
    const goal = { x: 44, y: 100 };
    const agents = [
      { y: 34, c: '#5ce1e6', l: 'SEO', cost: '$84', bar: [0, 4] },
      { y: 78, c: '#38b6ff', l: 'OUT', cost: '$120', bar: [0, 6] },
      { y: 122, c: '#07eda1', l: 'KOL', cost: '$65', bar: [1, 4] },
      { y: 166, c: '#07edd8', l: 'OPS', cost: '$300', bar: [2, 3], human: true },
    ];
    const GX = 196, GW = 148, M = 6; // gantt origin/width, months
    // month grid
    for (let m = 0; m <= M; m++) {
      const x = GX + (m / M) * GW;
      symEl(ps, 'line', { x1: x, y1: 22, x2: x, y2: 178, stroke: 'rgba(235,240,255,.07)', 'stroke-width': 1 });
      if (m < M) symEl(ps, 'text', { x: x + GW / M / 2, y: 16, 'text-anchor': 'middle', fill: 'rgba(235,240,255,.3)', 'font-size': 5.5, 'font-family': MONO }).textContent = 'M' + (m + 1);
    }
    const branches = [], bars = [], pops = [];
    agents.forEach((a, i) => {
      const nx = 130;
      symEl(ps, 'path', { d: `M${goal.x + 18} ${goal.y} C ${goal.x + 60} ${goal.y}, ${nx - 46} ${a.y}, ${nx - 12} ${a.y}`,
        fill: 'none', stroke: 'rgba(235,240,255,.16)', 'stroke-width': 1 });
      branches.push({ from: goal, to: { x: nx, y: a.y }, c: a.c, ph: i * .24 });
      const grp = symEl(ps, 'g', { opacity: 0, transform: `translate(${nx} ${a.y})` });
      const node = document.createElementNS(SYM_NS, a.human ? 'rect' : 'circle');
      if (a.human) { node.setAttribute('x', -9); node.setAttribute('y', -9); node.setAttribute('width', 18); node.setAttribute('height', 18); node.setAttribute('rx', 5); }
      else node.setAttribute('r', 10);
      node.setAttribute('fill', a.c + '22'); node.setAttribute('stroke', a.c); node.setAttribute('stroke-width', 1.2);
      grp.appendChild(node);
      const t = document.createElementNS(SYM_NS, 'text');
      t.setAttribute('y', 2.5); t.setAttribute('text-anchor', 'middle');
      t.setAttribute('fill', a.c); t.setAttribute('font-size', 5.8); t.setAttribute('font-family', MONO);
      t.textContent = a.l; grp.appendChild(t);
      const cost = document.createElementNS(SYM_NS, 'text');
      cost.setAttribute('y', 22); cost.setAttribute('text-anchor', 'middle');
      cost.setAttribute('fill', 'rgba(235,240,255,.45)'); cost.setAttribute('font-size', 5.8); cost.setAttribute('font-family', MONO);
      cost.textContent = a.cost; grp.appendChild(cost);
      pops.push(grp);
      // gantt bar
      const bx = GX + (a.bar[0] / M) * GW, bw = (a.bar[1] / M) * GW;
      const bar = symEl(ps, 'rect', { x: bx, y: a.y - 5, width: 0, height: 10, rx: 5,
        fill: a.c + '2e', stroke: a.c, 'stroke-width': 1, 'stroke-dasharray': a.human ? '3 2' : 'none' });
      bars.push({ el: bar, w: bw });
    });
    // goal node
    symEl(ps, 'circle', { cx: goal.x, cy: goal.y, r: 17, fill: 'rgba(38,78,247,.14)', stroke: '#264ef7', 'stroke-width': 1.5 });
    symEl(ps, 'circle', { cx: goal.x, cy: goal.y, r: 23, fill: 'none', stroke: 'rgba(81,112,255,.35)', 'stroke-width': .8, 'stroke-dasharray': '2 4' });
    symEl(ps, 'text', { x: goal.x, y: goal.y + 2.5, 'text-anchor': 'middle', fill: '#fff', 'font-size': 6.2, 'font-family': MONO }).textContent = 'GOAL';
    symEl(ps, 'text', { x: goal.x, y: goal.y + 34, 'text-anchor': 'middle', fill: 'rgba(235,240,255,.4)', 'font-size': 5.2, 'font-family': MONO }).textContent = '50 B2B LEADS';
    // pulses along branches
    const pulses = branches.map(b => ({ ...b, el: symEl(ps, 'circle', { r: 2.2, fill: b.c }) }));
    (function tick(now) {
      for (const p of pulses) {
        const t = ((now * .0004) + p.ph) % 1;
        const mt = 1 - t;
        // approximate cubic path position
        const x = mt * mt * (p.from.x + 18) + 2 * mt * t * ((p.from.x + p.to.x) / 2) + t * t * (p.to.x - 12);
        const y = mt * p.from.y + t * p.to.y;
        p.el.setAttribute('cx', x); p.el.setAttribute('cy', y);
        p.el.setAttribute('opacity', Math.sin(t * Math.PI) * .9);
      }
      if (!RM) requestAnimationFrame(tick);
    })(0);
    // staggered pop-in + bar growth on reveal
    new IntersectionObserver((es, o) => es.forEach(e => {
      if (!e.isIntersecting) return;
      pops.forEach((g, i) => setTimeout(() => {
        g.style.transition = 'opacity .6s ease'; g.setAttribute('opacity', 1);
      }, RM ? 0 : 200 + i * 260));
      bars.forEach((b, i) => setTimeout(() => {
        b.el.style.transition = 'width 1.1s cubic-bezier(.22,1,.36,1)';
        b.el.setAttribute('width', b.w);
      }, RM ? 0 : 500 + i * 260));
      o.disconnect();
    }), { threshold: .4 }).observe(document.getElementById('demo-plan'));
  }
  /* Step 2: orchestrator radar — sweep pings agents, sparks fly, judgment → human */
  const rs = document.getElementById('radar-svg');
  if (rs) {
    const MONO = 'JetBrains Mono, monospace';
    const C = { x: 158, y: 100 };
    for (const r of [30, 56, 82])
      symEl(rs, 'circle', { cx: C.x, cy: C.y, r, fill: 'none', stroke: 'rgba(235,240,255,.1)', 'stroke-width': 1 });
    symEl(rs, 'line', { x1: C.x - 88, y1: C.y, x2: C.x + 88, y2: C.y, stroke: 'rgba(235,240,255,.06)', 'stroke-width': 1 });
    symEl(rs, 'line', { x1: C.x, y1: C.y - 88, x2: C.x, y2: C.y + 88, stroke: 'rgba(235,240,255,.06)', 'stroke-width': 1 });
    // sweep wedge (rotated via transform)
    const sweep = symEl(rs, 'path', { d: `M${C.x} ${C.y} L${C.x + 88} ${C.y} A88 88 0 0 0 ${C.x + 88 * Math.cos(-.5)} ${C.y + 88 * Math.sin(-.5)} Z`,
      fill: 'rgba(81,112,255,.12)' });
    const sweepLine = symEl(rs, 'line', { x1: C.x, y1: C.y, x2: C.x + 88, y2: C.y, stroke: '#5170ff', 'stroke-width': 1.2, opacity: .8 });
    // center
    symEl(rs, 'circle', { cx: C.x, cy: C.y, r: 13, fill: 'rgba(38,78,247,.16)', stroke: '#264ef7', 'stroke-width': 1.4 });
    symEl(rs, 'text', { x: C.x, y: C.y + 2.5, 'text-anchor': 'middle', fill: '#fff', 'font-size': 5.2, 'font-family': MONO }).textContent = 'ORCH';
    // agents on rings
    const agents = [
      { a: -2.55, r: 56, c: '#5ce1e6', l: 'SEO' }, { a: -.9, r: 82, c: '#38b6ff', l: 'OUT' },
      { a: .6, r: 56, c: '#07eda1', l: 'KOL' }, { a: 2.1, r: 82, c: '#5170ff', l: 'PR' },
    ].map(g => {
      const x = C.x + g.r * Math.cos(g.a), y = C.y + g.r * Math.sin(g.a) * .95;
      symEl(rs, 'circle', { cx: x, cy: y, r: 8, fill: g.c + '22', stroke: g.c, 'stroke-width': 1.1 });
      symEl(rs, 'text', { x, y: y + 2, 'text-anchor': 'middle', fill: g.c, 'font-size': 4.8, 'font-family': MONO }).textContent = g.l;
      return { ...g, x, y, ping: symEl(rs, 'circle', { cx: x, cy: y, r: 8, fill: 'none', stroke: g.c, 'stroke-width': 1, opacity: 0 }), lastPing: -1 };
    });
    // human node (right edge)
    const HU = { x: 322, y: 100 };
    symEl(rs, 'line', { x1: agents[2].x, y1: agents[2].y, x2: HU.x, y2: HU.y, stroke: 'rgba(7,237,216,.3)', 'stroke-width': 1, 'stroke-dasharray': '3 3' });
    symEl(rs, 'circle', { cx: HU.x, cy: HU.y, r: 12, fill: 'rgba(7,237,216,.1)', stroke: '#07edd8', 'stroke-width': 1.2 });
    symEl(rs, 'circle', { cx: HU.x, cy: HU.y - 3.5, r: 2.8, fill: '#07edd8' });
    symEl(rs, 'path', { d: `M${HU.x - 5.5} ${HU.y + 6} Q${HU.x} ${HU.y} ${HU.x + 5.5} ${HU.y + 6}`, fill: 'none', stroke: '#07edd8', 'stroke-width': 1.3 });
    symEl(rs, 'text', { x: HU.x, y: HU.y + 24, 'text-anchor': 'middle', fill: '#07edd8', 'font-size': 5, 'font-family': MONO }).textContent = 'HUMAN';
    const escort = symEl(rs, 'circle', { r: 2.4, fill: '#07edd8', opacity: 0 });
    (function tick(now) {
      const ang = RM ? .8 : (now * .0006) % (Math.PI * 2);
      const deg = ang * 180 / Math.PI;
      sweep.setAttribute('transform', `rotate(${deg} ${C.x} ${C.y})`);
      sweepLine.setAttribute('transform', `rotate(${deg} ${C.x} ${C.y})`);
      for (const g of agents) {
        // normalized angular distance sweep→agent
        let d = (ang - ((g.a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2));
        d = ((d % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        if (d < .25 && now - g.lastPing > 1500) g.lastPing = now;
        const age = (now - g.lastPing) / 1100;
        if (g.lastPing > 0 && age < 1) {
          g.ping.setAttribute('r', 8 + age * 22);
          g.ping.setAttribute('opacity', (1 - age) * .8);
        } else g.ping.setAttribute('opacity', 0);
      }
      // KOL escalation pulse travels to human node
      const et = (now % 4200) / 4200;
      if (et < .5) {
        const t = et / .5;
        escort.setAttribute('cx', agents[2].x + (HU.x - agents[2].x) * t);
        escort.setAttribute('cy', agents[2].y + (HU.y - agents[2].y) * t);
        escort.setAttribute('opacity', Math.sin(t * Math.PI));
      } else escort.setAttribute('opacity', 0);
      if (!RM) requestAnimationFrame(tick);
    })(0);
  }
  /* Step 3: sync diagram — agents → memory core → team, traveling pulses */
  const ss = document.getElementById('sync-svg');
  if (ss) {
    const agents = [
      { x: 46, y: 40, c: '#5ce1e6', l: 'SEO' }, { x: 46, y: 95, c: '#38b6ff', l: 'OUT' },
      { x: 46, y: 150, c: '#07eda1', l: 'KOL' },
    ];
    const core = { x: 180, y: 95 }, team = { x: 314, y: 95 };
    const lines = [];
    for (const a of agents) {
      symEl(ss, 'line', { x1: a.x + 14, y1: a.y, x2: core.x - 26, y2: core.y, stroke: 'rgba(235,240,255,.18)', 'stroke-width': 1 });
      lines.push({ from: a, to: core, c: a.c });
      symEl(ss, 'circle', { cx: a.x, cy: a.y, r: 11, fill: 'none', stroke: a.c, 'stroke-width': 1.2 });
      symEl(ss, 'text', { x: a.x, y: a.y + 3, 'text-anchor': 'middle', fill: a.c, 'font-size': 6.5,
        'font-family': 'JetBrains Mono, monospace' }).textContent = a.l;
    }
    symEl(ss, 'line', { x1: core.x + 26, y1: core.y, x2: team.x - 16, y2: team.y, stroke: 'rgba(235,240,255,.18)', 'stroke-width': 1 });
    lines.push({ from: core, to: team, c: '#264ef7' });
    lines.push({ from: team, to: core, c: '#07edd8' });
    // memory core
    symEl(ss, 'circle', { cx: core.x, cy: core.y, r: 24, fill: 'rgba(38,78,247,.12)', stroke: '#264ef7', 'stroke-width': 1.4 });
    symEl(ss, 'circle', { cx: core.x, cy: core.y, r: 17, fill: 'none', stroke: 'rgba(81,112,255,.5)', 'stroke-width': .8, 'stroke-dasharray': '3 4' });
    symEl(ss, 'text', { x: core.x, y: core.y - 1, 'text-anchor': 'middle', fill: '#fff', 'font-size': 7,
      'font-family': 'JetBrains Mono, monospace' }).textContent = 'MEMORY';
    symEl(ss, 'text', { x: core.x, y: core.y + 9, 'text-anchor': 'middle', fill: 'rgba(235,240,255,.5)', 'font-size': 5.5,
      'font-family': 'JetBrains Mono, monospace' }).textContent = 'never resets';
    // team node
    symEl(ss, 'circle', { cx: team.x, cy: team.y, r: 13, fill: 'rgba(7,237,216,.1)', stroke: '#07edd8', 'stroke-width': 1.2 });
    symEl(ss, 'text', { x: team.x, y: team.y + 3, 'text-anchor': 'middle', fill: '#07edd8', 'font-size': 6,
      'font-family': 'JetBrains Mono, monospace' }).textContent = 'TEAM';
    const pulses = lines.map((l, i) => ({ ...l, ph: i * .21,
      el: symEl(ss, 'circle', { r: 2.6, fill: l.c }) }));
    (function tick(now) {
      for (const p of pulses) {
        const t = ((now * .00035) + p.ph) % 1;
        p.el.setAttribute('cx', p.from.x + (p.to.x - p.from.x) * t);
        p.el.setAttribute('cy', p.from.y + (p.to.y - p.from.y) * t);
        p.el.setAttribute('opacity', Math.sin(t * Math.PI));
      }
      if (!RM) requestAnimationFrame(tick);
    })(0);
    // meter fills when visible
    new IntersectionObserver((es, o) => es.forEach(e => {
      if (!e.isIntersecting) return;
      document.getElementById('sync-fill').style.width = '92%';
      const pct = document.getElementById('sync-pct'), t0 = performance.now();
      (function count(now) {
        const p = Math.min(1, (now - t0) / 1800);
        pct.textContent = Math.round(92 * (1 - Math.pow(1 - p, 3))) + '%';
        if (p < 1) requestAnimationFrame(count);
      })(t0);
      o.disconnect();
    }), { threshold: .4 }).observe(document.getElementById('demo-sync'));
  }
})();

/* ---------- 7c. "Why different" illustrations ---------- */
const ILLUS = {
  /* Δ1: timeline between two logins — agent activity fills the gap */
  await(svg) {
    const Y = 78;
    symEl(svg, 'line', { x1: 24, y1: Y, x2: 316, y2: Y, stroke: 'rgba(235,240,255,.2)', 'stroke-width': 1, 'stroke-dasharray': '2 5' });
    for (const [x, l] of [[44, 'YOU LOG IN'], [296, 'YOU LOG IN']]) {
      symEl(svg, 'circle', { cx: x, cy: Y, r: 8, fill: 'none', stroke: 'rgba(235,240,255,.8)', 'stroke-width': 1.2 });
      symEl(svg, 'circle', { cx: x, cy: Y - 3, r: 2.2, fill: 'rgba(235,240,255,.8)' });
      symEl(svg, 'path', { d: `M${x - 3.5} ${Y + 4.5} Q${x} ${Y} ${x + 3.5} ${Y + 4.5}`, fill: 'none', stroke: 'rgba(235,240,255,.8)', 'stroke-width': 1.2 });
      symEl(svg, 'text', { x, y: Y + 24, 'text-anchor': 'middle', fill: 'rgba(235,240,255,.45)', 'font-size': 6.5, 'font-family': 'JetBrains Mono, monospace' }).textContent = l;
    }
    // agent activity ticks between logins, varying heights, glowing blue
    for (let i = 0; i < 26; i++) {
      const x = 66 + i * 8.6, h = 8 + Math.abs(Math.sin(i * 1.7)) * 22;
      symEl(svg, 'line', { x1: x, y1: Y - 6, x2: x, y2: Y - 6 - h, stroke: i % 6 === 3 ? '#5ce1e6' : '#264ef7', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: .5 + Math.abs(Math.sin(i * 2.3)) * .5, class: 'tick' });
    }
    symEl(svg, 'text', { x: 170, y: 26, 'text-anchor': 'middle', fill: '#5170ff', 'font-size': 7, 'font-family': 'JetBrains Mono, monospace', 'letter-spacing': '.14em' }).textContent = 'AGENT KEEPS EXECUTING';
  },
  /* Δ2: two funnels — high opens/low conversion vs lower opens/high conversion */
  converts(svg) {
    function funnel(x, wTop, wBot, cTop, cBot, l1, l2, win) {
      const y0 = 34, y1 = 96;
      symEl(svg, 'path', { d: `M${x - wTop / 2} ${y0} L${x + wTop / 2} ${y0} L${x + wBot / 2} ${y1} L${x - wBot / 2} ${y1} Z`,
        fill: win ? 'rgba(7,237,161,.14)' : 'rgba(235,240,255,.05)', stroke: win ? '#07eda1' : 'rgba(235,240,255,.35)', 'stroke-width': 1 });
      symEl(svg, 'rect', { x: x - wBot / 2, y: y1, width: wBot, height: 8, fill: win ? '#07eda1' : 'rgba(235,240,255,.3)' });
      symEl(svg, 'text', { x, y: 24, 'text-anchor': 'middle', fill: win ? '#07eda1' : 'rgba(235,240,255,.6)', 'font-size': 8.5, 'font-family': 'JetBrains Mono, monospace' }).textContent = l1;
      symEl(svg, 'text', { x, y: 118, 'text-anchor': 'middle', fill: win ? '#07eda1' : 'rgba(235,240,255,.6)', 'font-size': 8.5, 'font-family': 'JetBrains Mono, monospace' }).textContent = l2;
    }
    funnel(105, 120, 4, null, null, '60% OPENS', '0.3% CONVERT', false);
    funnel(245, 84, 26, null, null, '40% OPENS', '2.1% CONVERT', true);
    symEl(svg, 'text', { x: 245, y: 70, 'text-anchor': 'middle', fill: '#07eda1', 'font-size': 10, 'font-family': 'Space Grotesk, sans-serif', 'font-weight': 600 }).textContent = '7×';
  },
  /* Δ3: task stream splits — 80% AI lane, judgment routed to human, merges back */
  routing(svg) {
    symEl(svg, 'path', { d: 'M20 65 H120', stroke: 'rgba(235,240,255,.4)', 'stroke-width': 1.4, fill: 'none' });
    symEl(svg, 'path', { d: 'M120 65 C160 65 160 40 200 40 C240 40 240 65 280 65', stroke: '#264ef7', 'stroke-width': 1.6, fill: 'none' });
    symEl(svg, 'path', { d: 'M120 65 C160 65 160 96 200 96 C240 96 240 65 280 65', stroke: '#07edd8', 'stroke-width': 1.4, fill: 'none', 'stroke-dasharray': '4 3' });
    symEl(svg, 'path', { d: 'M280 65 H322', stroke: 'rgba(235,240,255,.4)', 'stroke-width': 1.4, fill: 'none' });
    // AI node
    symEl(svg, 'rect', { x: 184, y: 26, width: 32, height: 20, rx: 6, fill: 'rgba(38,78,247,.15)', stroke: '#264ef7', 'stroke-width': 1.1 });
    symEl(svg, 'text', { x: 200, y: 39, 'text-anchor': 'middle', fill: '#5170ff', 'font-size': 7.5, 'font-family': 'JetBrains Mono, monospace' }).textContent = 'AI 80%';
    // human node
    symEl(svg, 'circle', { cx: 200, cy: 96, r: 13, fill: 'rgba(7,237,216,.1)', stroke: '#07edd8', 'stroke-width': 1.2 });
    symEl(svg, 'circle', { cx: 200, cy: 92, r: 3, fill: '#07edd8' });
    symEl(svg, 'path', { d: 'M194 102 Q200 95 206 102', fill: 'none', stroke: '#07edd8', 'stroke-width': 1.4 });
    symEl(svg, 'text', { x: 200, y: 120, 'text-anchor': 'middle', fill: '#07edd8', 'font-size': 6.5, 'font-family': 'JetBrains Mono, monospace' }).textContent = 'HUMAN · JUDGMENT';
    symEl(svg, 'text', { x: 60, y: 55, 'text-anchor': 'middle', fill: 'rgba(235,240,255,.45)', 'font-size': 6.5, 'font-family': 'JetBrains Mono, monospace' }).textContent = 'TASKS IN';
    symEl(svg, 'text', { x: 305, y: 55, 'text-anchor': 'middle', fill: 'rgba(235,240,255,.45)', 'font-size': 6.5, 'font-family': 'JetBrains Mono, monospace' }).textContent = 'DONE';
  },
  /* Δ4: operator network — center node with glowing edges into 3 communities */
  network(svg) {
    const C = { x: 170, y: 68 };
    const clusters = [
      { x: 60, y: 36, c: '#5ce1e6', l: 'CREATORS' }, { x: 282, y: 34, c: '#38b6ff', l: 'MEDIA' },
      { x: 258, y: 106, c: '#07eda1', l: 'COMMUNITIES' },
    ];
    for (const cl of clusters) {
      symEl(svg, 'line', { x1: C.x, y1: C.y, x2: cl.x, y2: cl.y, stroke: cl.c, 'stroke-width': 1, opacity: .55 });
      symEl(svg, 'circle', { cx: cl.x, cy: cl.y, r: 9, fill: 'none', stroke: cl.c, 'stroke-width': 1.2 });
      // satellite members
      for (let i = 0; i < 5; i++) {
        const a = i * 1.256 + cl.x, r = 17 + (i % 2) * 7;
        const sx = cl.x + r * Math.cos(a), sy = cl.y + r * Math.sin(a) * .7;
        symEl(svg, 'line', { x1: cl.x, y1: cl.y, x2: sx, y2: sy, stroke: cl.c, 'stroke-width': .5, opacity: .35 });
        symEl(svg, 'circle', { cx: sx, cy: sy, r: 2, fill: cl.c, opacity: .8 });
      }
      symEl(svg, 'text', { x: cl.x, y: cl.y + 30, 'text-anchor': 'middle', fill: cl.c, 'font-size': 6, 'font-family': 'JetBrains Mono, monospace' }).textContent = cl.l;
    }
    symEl(svg, 'circle', { cx: C.x, cy: C.y, r: 15, fill: 'rgba(38,78,247,.15)', stroke: '#264ef7', 'stroke-width': 1.4 });
    symEl(svg, 'circle', { cx: C.x, cy: C.y - 4, r: 3.4, fill: '#fff' });
    symEl(svg, 'path', { d: `M${C.x - 7} ${C.y + 8} Q${C.x} ${C.y - 1} ${C.x + 7} ${C.y + 8}`, fill: 'none', stroke: '#fff', 'stroke-width': 1.6 });
    symEl(svg, 'text', { x: C.x, y: C.y + 30, 'text-anchor': 'middle', fill: '#5170ff', 'font-size': 6.5, 'font-family': 'JetBrains Mono, monospace' }).textContent = 'MEGAHIT OPERATOR';
  },
};
document.querySelectorAll('svg[data-illus]').forEach(svg => (ILLUS[svg.dataset.illus] || (() => {}))(svg));

/* ---------- 7d. Why Megahit — glass dashboard visuals ---------- */
(function advantages() {
  /* sparkline: compounding playbook curve with glow + area fill */
  const sp = document.getElementById('adv-spark');
  if (sp) {
    const ctx = sp.getContext('2d');
    let W, H, t0 = null;
    const pts = Array.from({ length: 40 }, (_, i) => {
      const t = i / 39;
      return Math.pow(t, 1.7) * .75 + Math.sin(i * 1.3) * .04 + .08; // compounding + jitter
    });
    const fit = () => { const r = sp.getBoundingClientRect(); W = sp.width = r.width; H = sp.height = 56; };
    fit(); new ResizeObserver(fit).observe(sp);
    function draw(prog) {
      ctx.clearRect(0, 0, W, H);
      const n = Math.max(2, Math.floor(pts.length * prog));
      const xy = i => [ (i / (pts.length - 1)) * W, H - 6 - pts[i] * (H - 12) ];
      // area
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let i = 0; i < n; i++) ctx.lineTo(...xy(i));
      ctx.lineTo(xy(n - 1)[0], H); ctx.closePath();
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(7,237,161,.28)'); g.addColorStop(1, 'rgba(7,237,161,0)');
      ctx.fillStyle = g; ctx.fill();
      // line
      ctx.beginPath();
      for (let i = 0; i < n; i++) i ? ctx.lineTo(...xy(i)) : ctx.moveTo(...xy(i));
      ctx.strokeStyle = '#07eda1'; ctx.lineWidth = 1.6;
      ctx.shadowColor = 'rgba(7,237,161,.8)'; ctx.shadowBlur = 8;
      ctx.stroke(); ctx.shadowBlur = 0;
      // tip dot
      const [tx, ty] = xy(n - 1);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(tx, ty, 2.4, 0, Math.PI * 2); ctx.fill();
    }
    new IntersectionObserver((es, o) => es.forEach(e => {
      if (!e.isIntersecting) return;
      if (RM) { draw(1); o.disconnect(); return; }
      (function anim(now) {
        if (!t0) t0 = now;
        const p = Math.min(1, (now - t0) / 1600);
        draw(1 - Math.pow(1 - p, 3));
        if (p < 1) requestAnimationFrame(anim);
      })(performance.now());
      o.disconnect();
    }), { threshold: .4 }).observe(sp);
  }
  /* mode toggle: Agent ↔ Agency, auto-cycles + clickable */
  const pill = document.getElementById('mode-pill');
  if (pill) {
    const spans = pill.querySelectorAll('span');
    const ai = document.getElementById('mix-ai'), hu = document.getElementById('mix-hu');
    const aiL = document.getElementById('mix-ai-l'), huL = document.getElementById('mix-hu-l');
    const note = document.getElementById('mode-note');
    let mode = 0;
    const apply = () => {
      spans.forEach((s, i) => s.classList.toggle('on', i === mode));
      const a = mode === 0 ? 80 : 45;
      ai.style.width = a + '%'; hu.style.width = (100 - a) + '%';
      aiL.textContent = a + '%'; huL.textContent = (100 - a) + '%';
      note.textContent = mode === 0 ? 'AI-led · you supervise' : 'Done for you';
    };
    const flip = () => { mode = 1 - mode; apply(); };
    pill.addEventListener('click', () => { flip(); clearInterval(timer); });
    let timer = RM ? null : setInterval(flip, 3800);
    apply();
  }
  /* planning gauge: arc sweeps M1 → M6 continuously */
  const ga = document.getElementById('adv-gauge');
  if (ga) {
    const cx = 75, cy = 80, R = 62;
    const arc = (a0, a1, r) => {
      const p = a => [cx + r * Math.cos(Math.PI + a * Math.PI), cy + r * Math.sin(Math.PI + a * Math.PI)];
      const [x0, y0] = p(a0), [x1, y1] = p(a1);
      return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    };
    symEl(ga, 'path', { d: arc(0, 1, R), fill: 'none', stroke: 'rgba(255,255,255,.09)', 'stroke-width': 7, 'stroke-linecap': 'round' });
    // month ticks
    for (let m = 0; m <= 6; m++) {
      const a = Math.PI + (m / 6) * Math.PI;
      symEl(ga, 'line', { x1: cx + (R - 9) * Math.cos(a), y1: cy + (R - 9) * Math.sin(a),
        x2: cx + (R - 14) * Math.cos(a), y2: cy + (R - 14) * Math.sin(a),
        stroke: 'rgba(255,255,255,.25)', 'stroke-width': 1 });
    }
    const prog = symEl(ga, 'path', { d: arc(0, .001, R), fill: 'none', stroke: 'url(#adv-gg)', 'stroke-width': 7, 'stroke-linecap': 'round' });
    const defs = symEl(ga, 'defs', {});
    const gg = document.createElementNS(SYM_NS, 'linearGradient');
    gg.setAttribute('id', 'adv-gg'); gg.setAttribute('x1', '0'); gg.setAttribute('x2', '1');
    [['0', '#264ef7'], ['.6', '#38b6ff'], ['1', '#5ce1e6']].forEach(([o, c]) => {
      const st = document.createElementNS(SYM_NS, 'stop');
      st.setAttribute('offset', o); st.setAttribute('stop-color', c); gg.appendChild(st);
    });
    defs.appendChild(gg);
    const dot = symEl(ga, 'circle', { r: 4.5, fill: '#fff' });
    dot.style.filter = 'drop-shadow(0 0 6px rgba(92,225,230,.9))';
    const monthLbl = document.getElementById('gauge-month');
    (function tick(now) {
      const cycle = RM ? .5 : (now % 9000) / 9000;             // M1→M6 over 9s, loop
      const a = Math.max(.02, cycle);
      prog.setAttribute('d', arc(0, a, R));
      const ang = Math.PI + a * Math.PI;
      dot.setAttribute('cx', cx + R * Math.cos(ang));
      dot.setAttribute('cy', cy + R * Math.sin(ang));
      if (monthLbl) monthLbl.textContent = `Month ${Math.min(6, 1 + Math.floor(a * 6))} of 6`;
      if (!RM) requestAnimationFrame(tick);
    })(0);
  }
})();

/* ---------- 8. Reveals ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) {
    e.target.classList.add('in');
    e.target.querySelectorAll('[data-count]').forEach(animateCounter);
    io.unobserve(e.target);
  }
}), { threshold: .18 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));
/* counters not inside a .reveal (e.g. hero chips) animate on load */
document.querySelectorAll('[data-count]').forEach(el => {
  if (!el.closest('.reveal')) animateCounter(el);
});

/* ---------- 9. Waitlist gate modal (variants A/B/C) ---------- */
const GATE = {
  A: { title: 'Claim Your 1000 Free Credits', sub: "Tell us a bit about yourself and we'll set up your account.",
       btn: 'Claim My Credits →', ok: "You're in — check your email for account setup instructions." },
  B: { title: 'Download the Growth Playbook', sub: "Tell us a bit about yourself and we'll send it straight to your inbox.",
       btn: 'Send Me the Playbook →', ok: 'Check your inbox — the playbook is on its way.' },
  C: { title: 'Get Early Access', sub: "Tell us a bit about yourself and we'll be in touch.",
       btn: 'Submit', ok: "You're on the list — we'll be in touch." },
};
(function modal() {
  const bd = document.createElement('div');
  bd.className = 'modal-backdrop';
  bd.innerHTML = `<div class="modal" role="dialog" aria-modal="true">
    <button class="close" aria-label="Close">✕</button>
    <h3></h3><p class="sub"></p>
    <form>
      <div><label>How shall we address you?</label><input name="name" required placeholder="Your name"></div>
      <div><label>Email address</label><input name="email" type="email" required placeholder="you@company.com"></div>
      <div><label>Which industry are you from?</label>
        <select name="industry" required>
          <option value="" disabled selected>Select your industry.</option>
          <option>SaaS</option><option>AI / Applied AI</option><option>DevTools</option>
          <option>Consumer App</option><option>Marketplace</option>
          <option>Agency / Professional Services</option><option>Other</option>
        </select></div>
      <button class="btn btn-primary" type="submit"></button>
    </form>
    <div class="confirm"><div class="ok">✓</div><p></p></div>
  </div>`;
  document.body.appendChild(bd);
  const m = bd.querySelector('.modal'), form = m.querySelector('form');
  let variant = 'A';
  window.openGate = v => {
    variant = GATE[v] ? v : 'C';
    m.classList.remove('done'); form.reset();
    m.querySelector('h3').textContent = GATE[variant].title;
    m.querySelector('.sub').textContent = GATE[variant].sub;
    m.querySelector('[type=submit]').textContent = GATE[variant].btn;
    bd.classList.add('open');
  };
  const close = () => bd.classList.remove('open');
  bd.querySelector('.close').addEventListener('click', close);
  bd.addEventListener('click', e => { if (e.target === bd) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    // local backup: single lead DB keyed by email — same person, one lead
    const db = JSON.parse(localStorage.getItem('megahit-leads') || '{}');
    db[data.email.toLowerCase()] = { ...(db[data.email.toLowerCase()] || {}), ...data,
      triggers: [...new Set([...(db[data.email.toLowerCase()]?.triggers || []), variant])],
      updated: new Date().toISOString() };
    localStorage.setItem('megahit-leads', JSON.stringify(db));

    const submitBtn = m.querySelector('[type=submit]');
    const errEl = m.querySelector('.form-error');
    if (errEl) errEl.remove();
    const btnLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, gate: variant }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload.success) throw new Error(payload.message || 'Request failed');
      m.querySelector('.confirm p').textContent = GATE[variant].ok;
      m.classList.add('done');
    } catch (err) {
      const p = document.createElement('p');
      p.className = 'form-error';
      p.style.cssText = 'color:#ff6b6b;margin:.5rem 0 0;font-size:.85rem';
      p.textContent = "Something went wrong — please try again or email us directly.";
      form.appendChild(p);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = btnLabel;
    }
  });
  document.querySelectorAll('[data-gate]').forEach(el =>
    el.addEventListener('click', e => { e.preventDefault(); openGate(el.dataset.gate); }));
})();

/* ---------- 10. Nav ---------- */
document.querySelector('.nav-toggle')?.addEventListener('click', () =>
  document.querySelector('nav.site-nav').classList.toggle('open'));

/* starfield mount (page heroes on subpages) */
initStars(document.getElementById('stars'));
