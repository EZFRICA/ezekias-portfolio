// Flow player drawn as a chip die: functional blocks with pads, orthogonal traces between them,
// and a signal pulse that runs along the trace to the active block, one step at a time.
// map: { w, h, zones: [[label, x, y, w, h]], nodes: { id: [x, y, w, h, label, sub] } }
// scenario: { steps: [{ at, say, token, stop }] }; narrative steps on the page carry data-step.
(() => {
  const SVG = 'http://www.w3.org/2000/svg';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = window.matchMedia('(max-width: 900px)');
  const ICON = {
    prev: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    next: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 3v10l8-5z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 3h2.5v10H4.5zM9 3h2.5v10H9z" fill="currentColor"/></svg>',
  };
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const s = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(SVG, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    if (parent) parent.appendChild(n);
    return n;
  };
  let uid = 0;

  class FlowPlayer {
    constructor(root, map, scenario, opts = {}) {
      this.root = root; this.map = map; this.sc = scenario;
      this.steps = opts.steps ? Array.from(opts.steps) : [];
      this.full = !!opts.full;
      this.i = -1; this.timer = null; this.lockUntil = 0; this.raf = 0;
      this.id = `die${++uid}`;
      this.build();
      this.go(0);
      this.bindScroll();
      if (opts.once) this.playWhenVisible();
    }

    // Orthogonal route between two blocks, leaving from the facing sides.
    route(a, b) {
      const [ax, ay, aw, ah] = this.map.nodes[a];
      const [bx, by, bw, bh] = this.map.nodes[b];
      const acx = ax + aw / 2, acy = ay + ah / 2, bcx = bx + bw / 2, bcy = by + bh / 2;
      const dx = bcx - acx, dy = bcy - acy;
      const overlapX = ax < bx + bw && bx < ax + aw;
      if (overlapX && Math.abs(dy) > 0) {
        const x = Math.max(ax, bx) + (Math.min(ax + aw, bx + bw) - Math.max(ax, bx)) / 2;
        const y1 = dy > 0 ? ay + ah : ay, y2 = dy > 0 ? by : by + bh;
        return `M${x} ${y1} V${y2}`;
      }
      const x1 = dx > 0 ? ax + aw : ax, x2 = dx > 0 ? bx : bx + bw;
      const mx = x1 + (x2 - x1) / 2;
      return `M${x1} ${acy} H${mx} V${bcy} H${x2}`;
    }

    build() {
      const m = this.map, r = this.root;
      r.classList.add('flow');
      if (this.full) r.classList.add('flow--full');
      this.head = el('div', 'flow-head', '<span class="k"></span><span class="t"></span>');
      r.appendChild(this.head);

      const wrap = el('div', 'flow-mapwrap');
      const box = el('div', 'flow-map');
      box.style.aspectRatio = `${m.w} / ${m.h}`;
      box.style.setProperty('--ar', m.w / m.h);
      const svg = s('svg', { viewBox: `-6 -6 ${m.w + 12} ${m.h + 12}`, class: 'die', 'aria-hidden': 'true' });
      svg.innerHTML = `
        <defs>
          <pattern id="${this.id}-grid" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.7" class="die-dot"/></pattern>
          <filter id="${this.id}-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>`;
      s('rect', { x: -6, y: -6, width: m.w + 12, height: m.h + 12, rx: 10, class: 'die-substrate' }, svg);
      s('rect', { x: -6, y: -6, width: m.w + 12, height: m.h + 12, rx: 10, fill: `url(#${this.id}-grid)` }, svg);
      m.zones.forEach(([label, x, y, w, h]) => {
        s('rect', { x, y, width: w, height: h, rx: 6, class: 'die-zone' }, svg);
        const t = s('text', { x: x + 10, y: y + 16, class: 'die-zone-label' }, svg); t.textContent = label;
      });

      // every hop of the scenario, drawn once as a faint trace
      this.traces = s('g', { class: 'die-traces' }, svg);
      this.hops = [];
      const steps = this.sc.steps;
      for (let j = 1; j < steps.length; j++) {
        const a = steps[j - 1].at, b = steps[j].at;
        if (a === b) { this.hops.push(null); continue; }
        const p = s('path', { d: this.route(a, b), class: 'die-trace' }, this.traces);
        this.hops.push(p);
      }

      this.nodes = {};
      Object.entries(m.nodes).forEach(([id, [x, y, w, h, label, sub]]) => {
        const g = s('g', { class: 'die-block' }, svg);
        // pads along the top and bottom edges, like a functional block on silicon
        const pads = Math.max(2, Math.floor(w / 34));
        for (let k = 0; k < pads; k++) {
          const px = x + (w / (pads + 1)) * (k + 1) - 2;
          s('rect', { x: px, y: y - 3, width: 4, height: 3, class: 'die-pad' }, g);
          s('rect', { x: px, y: y + h, width: 4, height: 3, class: 'die-pad' }, g);
        }
        s('rect', { x, y, width: w, height: h, rx: 3, class: 'die-body' }, g);
        const t = s('text', { x: x + 10, y: sub ? y + h / 2 - 2 : y + h / 2 + 4, class: 'die-label' }, g); t.textContent = label;
        if (sub) { const u = s('text', { x: x + 10, y: y + h / 2 + 12, class: 'die-sub' }, g); u.textContent = sub; }
        this.nodes[id] = g;
      });

      this.pulse = s('circle', { r: 4.5, class: 'die-pulse', filter: `url(#${this.id}-glow)` }, svg);
      this.tag = s('g', { class: 'die-tag' }, svg);
      this.tagBox = s('rect', { rx: 9, height: 18 }, this.tag);
      this.tagText = s('text', {}, this.tag);
      this.glow = `url(#${this.id}-glow)`;
      this.svg = svg;
      box.appendChild(svg);
      wrap.appendChild(box);
      r.appendChild(wrap);
      this.wrap = wrap;
      if (this.full) {
        this.cap = el('div', 'flow-caption');
        this.cap.setAttribute('aria-hidden', 'true');
        r.appendChild(this.cap);
      }

      this.live = el('p', 'arch-sr'); this.live.setAttribute('aria-live', 'polite'); r.appendChild(this.live);
      const foot = el('div', 'flow-foot');
      const controls = el('div', 'arch-controls');
      const mk = (icon, label, fn) => { const b = el('button', 'arch-btn', icon); b.type = 'button'; b.setAttribute('aria-label', label); b.addEventListener('click', fn); return b; };
      this.btnPrev = mk(ICON.prev, 'Previous step', () => { this.stop(); this.jump(this.i - 1); });
      this.btnPlay = mk(ICON.play, 'Play the flow', () => (this.timer ? this.stop() : this.play()));
      this.btnNext = mk(ICON.next, 'Next step', () => { this.stop(); this.jump(this.i + 1); });
      controls.append(this.btnPrev, this.btnPlay, this.btnNext);
      this.count = el('span', 'flow-count');
      foot.append(controls, this.count);
      r.appendChild(foot);
    }

    placeTag(id, text) {
      if (!text) { this.tag.style.opacity = 0; return; }
      const [x, y, w] = this.map.nodes[id];
      this.tagText.textContent = text;
      const tw = Math.min(this.tagText.getComputedTextLength() + 16, 260);
      let tx = x + w - tw + 6;
      tx = Math.max(-2, Math.min(this.map.w - tw + 2, tx));
      const ty = Math.max(-4, y - 24);
      this.tagBox.setAttribute('x', tx); this.tagBox.setAttribute('y', ty); this.tagBox.setAttribute('width', tw);
      this.tagText.setAttribute('x', tx + 8); this.tagText.setAttribute('y', ty + 12.5);
      this.tag.style.opacity = 1;
    }

    // On narrow screens the die scrolls sideways: keep the active block in view.
    follow(id) {
      const w = this.wrap;
      if (!w || w.scrollWidth <= w.clientWidth + 2) return;
      const [x, , bw] = this.map.nodes[id];
      const scale = w.scrollWidth / (this.map.w + 12);
      const target = (x + 6 + bw / 2) * scale - w.clientWidth / 2;
      w.scrollTo({ left: Math.max(0, target), behavior: reduced.matches ? 'auto' : 'smooth' });
    }

    runPulse(path, done) {
      cancelAnimationFrame(this.raf);
      if (!path || reduced.matches) { done(); return; }
      const len = path.getTotalLength();
      const t0 = performance.now(), dur = Math.min(900, 250 + len * 1.6);
      this.pulse.style.opacity = 1;
      const tick = (now) => {
        const t = Math.min(1, (now - t0) / dur);
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const pt = path.getPointAtLength(e * len);
        this.pulse.setAttribute('cx', pt.x); this.pulse.setAttribute('cy', pt.y);
        if (t < 1) this.raf = requestAnimationFrame(tick);
        else { this.pulse.style.opacity = 0; done(); }
      };
      this.raf = requestAnimationFrame(tick);
    }

    go(k) {
      const steps = this.sc.steps;
      k = Math.max(0, Math.min(steps.length - 1, k));
      if (k === this.i) return;
      const forward = k === this.i + 1;
      this.i = k;
      const st = steps[k];
      const seen = new Set(steps.slice(0, k).map((x) => x.at));
      this.hops.forEach((p, j) => {
        if (!p) return;
        p.classList.toggle('is-done', j < k - 1);
        p.classList.toggle('is-live', j === k - 1);
      });
      const arrive = () => {
        Object.entries(this.nodes).forEach(([id, g]) => {
          const here = id === st.at;
          g.classList.toggle('is-here', here);
          g.classList.toggle('is-stop', here && !!st.stop);
          g.classList.toggle('is-seen', !here && seen.has(id));
          g.querySelector('.die-body').setAttribute('filter', here ? this.glow : 'none');
        });
        this.placeTag(st.at, st.token);
        this.follow(st.at);
      };
      Object.values(this.nodes).forEach((g) => g.classList.remove('is-here'));
      this.tag.style.opacity = 0;
      if (forward && k > 0) this.runPulse(this.hops[k - 1], arrive); else arrive();

      this.head.querySelector('.k').textContent = `Step ${k + 1} of ${steps.length}`;
      this.head.querySelector('.t').textContent = st.say;
      this.count.textContent = `${k + 1} / ${steps.length}`;
      this.btnPrev.disabled = k === 0;
      this.btnNext.disabled = k === steps.length - 1;
      this.live.textContent = st.say;
      this.steps.forEach((x, j) => x.classList.toggle('is-active', j === k));
      if (this.cap && this.steps[k]) this.cap.innerHTML = this.steps[k].innerHTML;
    }

    triggerLine() { return window.innerHeight * (narrow.matches ? 0.78 : 0.5); }

    bindScroll() {
      if (!this.steps.length) return;
      let ticking = false;
      const update = () => {
        ticking = false;
        if (Date.now() < this.lockUntil) return;
        const line = this.triggerLine();
        let k = 0;
        this.steps.forEach((x, j) => { if (x.getBoundingClientRect().top <= line) k = j; });
        this.go(k);
      };
      window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
      ['wheel', 'touchstart'].forEach((ev) => window.addEventListener(ev, () => this.stop(), { passive: true }));
      update();
    }

    playWhenVisible() {
      if (reduced.matches || !('IntersectionObserver' in window)) return;
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { io.disconnect(); this.play(); }
      }, { threshold: 0.5 });
      io.observe(this.root);
    }

    jump(k) {
      k = Math.max(0, Math.min(this.sc.steps.length - 1, k));
      this.go(k);
      if (!this.steps[k]) return;
      this.lockUntil = Date.now() + 900;
      const y = window.scrollY + this.steps[k].getBoundingClientRect().top - this.triggerLine() + 24;
      window.scrollTo({ top: Math.max(0, y), behavior: reduced.matches ? 'auto' : 'smooth' });
    }

    play() {
      if (this.i >= this.sc.steps.length - 1) { this.i = -1; this.go(0); }
      this.btnPlay.innerHTML = ICON.pause; this.btnPlay.setAttribute('aria-label', 'Pause');
      this.timer = setInterval(() => {
        if (this.i >= this.sc.steps.length - 1) { this.stop(); return; }
        this.jump(this.i + 1);
      }, 2600);
    }

    stop() {
      if (!this.timer) return;
      clearInterval(this.timer); this.timer = null;
      this.btnPlay.innerHTML = ICON.play; this.btnPlay.setAttribute('aria-label', 'Play the flow');
    }
  }

  window.FlowPlayer = FlowPlayer;
})();
