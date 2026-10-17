// Architecture player. Renders a tiered board from a data object (see data-memory.js) and
// steps through its stages: components that arrive, change, leave, or were deliberately not taken.
// Full mode follows the narrative steps on scroll; mini mode loops on its own.
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
  const BADGE = { added: '+', changed: '~', removed: '−', warn: '!', rejected: '×', soon: '…' };

  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const spec = (v) => v ? { label: v[0], sub: v[1] || '', state: v[2] || '' } : null;

  class ArchPlayer {
    constructor(root, data, opts = {}) {
      this.root = root;
      this.data = data;
      this.mini = !!opts.mini;
      this.showEdges = !!opts.edges;
      this.steps = opts.steps ? Array.from(opts.steps) : [];
      this.i = -1;
      this.prevEdges = new Set();
      this.timer = null;
      this.lockUntil = 0;
      this.build();
      this.go((this.mini || opts.once) && reduced.matches ? data.stages.length - 1 : 0);
      if (this.mini) this.autoplay();
      else this.bindScroll();
      if (opts.once && !reduced.matches) this.play();
    }

    build() {
      const d = this.data;
      const r = this.root;
      r.classList.add('arch');
      if (this.mini) r.classList.add('arch--mini');
      r.dataset.track = d.track;

      this.head = el('div', 'arch-head', '<span class="arch-part"></span><span class="arch-date"></span><span class="arch-title"></span>');
      r.appendChild(this.head);
      this.delta = el('p', 'arch-delta');
      r.appendChild(this.delta);

      const grid = el('div', 'arch-grid');
      grid.style.setProperty('--cols', d.cols);
      grid.style.setProperty('--rows', d.tiers.length);
      grid.setAttribute('aria-hidden', 'true');
      d.tiers.forEach((t, k) => {
        const band = el('div', 'arch-band'); band.style.gridRow = k + 1; grid.appendChild(band);
        const lab = el('span', 'arch-tier', t); lab.style.gridRow = k + 1; grid.appendChild(lab);
      });
      this.nodes = {};
      Object.entries(d.nodes).forEach(([id, p]) => {
        const n = el('div', 'node', '<span class="node-badge"></span><span class="node-label"></span><span class="node-sub"></span>');
        n.style.gridRow = p[0];
        n.style.gridColumn = `${p[1] + 1} / span ${p[2] || 1}`;
        grid.appendChild(n);
        this.nodes[id] = { el: n, row: p[0], col: p[1], span: p[2] || 1 };
      });
      this.svg = document.createElementNS(SVG, 'svg');
      this.svg.classList.add('arch-edges');
      const mid = `arrow-${d.track}-${Math.random().toString(36).slice(2, 7)}`;
      this.svg.innerHTML = `<defs><marker id="${mid}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 8 4 0 8z"/></marker></defs>`;
      this.markerId = mid;
      grid.appendChild(this.svg);
      this.grid = grid;
      r.appendChild(grid);

      this.live = el('p', 'arch-sr');
      this.live.setAttribute('aria-live', 'polite');
      r.appendChild(this.live);

      const foot = el('div', 'arch-foot');
      const controls = el('div', 'arch-controls');
      this.btnPrev = el('button', 'arch-btn', ICON.prev); this.btnPrev.type = 'button'; this.btnPrev.setAttribute('aria-label', 'Previous stage');
      this.btnPlay = el('button', 'arch-btn', ICON.play); this.btnPlay.type = 'button'; this.btnPlay.setAttribute('aria-label', 'Play the evolution');
      this.btnNext = el('button', 'arch-btn', ICON.next); this.btnNext.type = 'button'; this.btnNext.setAttribute('aria-label', 'Next stage');
      controls.append(this.btnPrev, this.btnPlay, this.btnNext);
      this.btnPrev.addEventListener('click', () => { this.stop(); this.jump(this.i - 1); });
      this.btnNext.addEventListener('click', () => { this.stop(); this.jump(this.i + 1); });
      this.btnPlay.addEventListener('click', () => (this.timer ? this.stop() : this.play()));

      this.dots = el('ol', 'arch-dots');
      d.stages.forEach((s, k) => {
        const li = el('li');
        const b = el('button');
        b.type = 'button';
        b.setAttribute('aria-label', `${s.date} — ${s.title}`);
        b.title = `${s.date} — ${s.title}`;
        if (s.soon) b.classList.add('is-soon');
        b.addEventListener('click', () => { this.stop(); this.jump(k); });
        li.appendChild(b);
        this.dots.appendChild(li);
      });
      foot.append(controls, this.dots);
      r.appendChild(foot);

      if (!this.mini) {
        const legend = el('ul', 'arch-legend',
          '<li><i class="k-add"></i>added</li><li><i class="k-chg"></i>changed</li><li><i class="k-del"></i>removed</li>' +
          '<li><i class="k-warn"></i>trade-off</li><li><i class="k-rej"></i>not taken</li><li><i></i>unchanged</li>');
        r.appendChild(legend);
      }

      if ('ResizeObserver' in window) new ResizeObserver(() => this.drawEdges(false)).observe(grid);
      r.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { this.stop(); this.jump(this.i + 1); }
        if (e.key === 'ArrowLeft') { this.stop(); this.jump(this.i - 1); }
      });
    }

    // Is another node visible in this stage occupying the same cell?
    cellTaken(id, stage) {
      const a = this.nodes[id];
      return Object.keys(stage.nodes).some((o) => {
        if (o === id) return false;
        const b = this.nodes[o];
        return b && b.row === a.row && b.col < a.col + a.span && a.col < b.col + b.span;
      });
    }

    go(k) {
      const d = this.data;
      k = Math.max(0, Math.min(d.stages.length - 1, k));
      if (k === this.i) return;
      this.i = k;
      const st = d.stages[k];
      const prev = k > 0 ? d.stages[k - 1] : null;
      const quiet = new Set(st.quiet || []);
      const delta = { add: 0, chg: 0, del: 0 };

      this.head.querySelector('.arch-part').textContent = st.part || '';
      this.head.querySelector('.arch-date').textContent = st.date;
      this.head.querySelector('.arch-title').textContent = st.title;

      Object.entries(this.nodes).forEach(([id, n]) => {
        const cur = spec(st.nodes[id]);
        const was = prev ? spec(prev.nodes[id]) : null;
        const cls = ['node'];
        let label = '', sub = '', badge = '';
        if (cur) {
          label = cur.label; sub = cur.sub;
          cls.push('is-on');
          if (cur.state) { cls.push(`is-${cur.state}`); badge = BADGE[cur.state]; }
          if (prev && !was && cur.state !== 'rejected') { cls.push('is-added'); badge = BADGE.added; delta.add++; }
          else if (was && was.label !== cur.label && !cur.state) { cls.push('is-changed'); badge = BADGE.changed; delta.chg++; }
          else if (!cur.state) { sub = ''; } // unchanged: label only, so the changes stand out
        } else if (was && !quiet.has(id) && was.state !== 'rejected' && !this.cellTaken(id, st)) {
          const ghost = st.ghosts && st.ghosts[id];
          label = ghost ? ghost[0] : was.label;
          sub = ghost ? (ghost[1] || '') : 'removed';
          cls.push('is-removed'); badge = BADGE.removed; delta.del++;
        } else if (was) {
          label = was.label; sub = ''; // keep text while it fades out
        }
        if (prev && was && !cur && this.cellTaken(id, st)) delta.del++;
        n.el.className = cls.join(' ');
        if (label) {
          n.el.querySelector('.node-label').textContent = label;
          n.el.querySelector('.node-sub').textContent = sub;
        }
        n.el.querySelector('.node-badge').textContent = badge;
      });

      this.dots.querySelectorAll('button').forEach((b, j) => {
        if (j === k) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      this.btnPrev.disabled = k === 0;
      this.btnNext.disabled = k === d.stages.length - 1;
      this.live.textContent = `${st.date}, ${st.title}`;
      this.steps.forEach((s, j) => s.classList.toggle('is-active', j === k));
      const parts = [];
      if (delta.add) parts.push(`<b class="d-add">+${delta.add} added</b>`);
      if (delta.chg) parts.push(`<b class="d-chg">~${delta.chg} changed</b>`);
      if (delta.del) parts.push(`<b class="d-del">−${delta.del} removed</b>`);
      this.delta.innerHTML = prev ? (parts.join(' ') || 'no structural change') : 'starting point';
      requestAnimationFrame(() => this.drawEdges(true));
    }

    drawEdges(animate) {
      if (this.i < 0 || !this.showEdges) return;
      const st = this.data.stages[this.i];
      const box = this.grid.getBoundingClientRect();
      const keep = this.svg.querySelector('defs');
      this.svg.replaceChildren(keep);
      const edges = (st.edges || []).filter(([a, b]) => st.nodes[a] && st.nodes[b] && this.nodes[a] && this.nodes[b]);
      const keys = new Set(edges.map(([a, b]) => `${a}>${b}`));
      edges.forEach(([a, b]) => {
        const ra = this.nodes[a].el.getBoundingClientRect();
        const rb = this.nodes[b].el.getBoundingClientRect();
        if (!ra.width || !rb.width) return;
        const off = keys.has(`${b}>${a}`) ? (a < b ? -5 : 5) : 0;
        let x1, y1, x2, y2, dpath;
        if (ra.bottom <= rb.top + 1 || rb.bottom <= ra.top + 1) {
          const down = ra.bottom <= rb.top + 1;
          x1 = ra.left + ra.width / 2 - box.left + off; x2 = rb.left + rb.width / 2 - box.left + off;
          y1 = (down ? ra.bottom : ra.top) - box.top; y2 = (down ? rb.top : rb.bottom) - box.top - (down ? 2 : -2);
          const my = (y1 + y2) / 2;
          dpath = `M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2}`;
        } else {
          const right = ra.right <= rb.left + 1;
          y1 = ra.top + ra.height / 2 - box.top + off; y2 = rb.top + rb.height / 2 - box.top + off;
          x1 = (right ? ra.right : ra.left) - box.left; x2 = (right ? rb.left : rb.right) - box.left - (right ? 2 : -2);
          const mx = (x1 + x2) / 2;
          dpath = `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
        }
        const p = document.createElementNS(SVG, 'path');
        p.setAttribute('d', dpath);
        p.setAttribute('marker-end', `url(#${this.markerId})`);
        this.svg.appendChild(p);
        const key = `${a}>${b}`;
        if (animate && !reduced.matches && !this.prevEdges.has(key)) {
          const len = p.getTotalLength();
          p.style.strokeDasharray = `${len}`;
          p.style.strokeDashoffset = `${len}`;
          p.getBoundingClientRect();
          p.classList.add('is-new');
          p.style.strokeDashoffset = '0';
          p.addEventListener('transitionend', () => { p.style.strokeDasharray = ''; }, { once: true });
        }
      });
      if (animate) this.prevEdges = keys;
    }

    // Narrative sync
    triggerLine() { return window.innerHeight * (narrow.matches ? 0.74 : 0.5); }

    bindScroll() {
      if (!this.steps.length) return;
      let ticking = false;
      const update = () => {
        ticking = false;
        if (Date.now() < this.lockUntil) return;
        const line = this.triggerLine();
        let k = 0;
        this.steps.forEach((s, j) => { if (s.getBoundingClientRect().top <= line) k = j; });
        this.go(k);
      };
      window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
      ['wheel', 'touchstart'].forEach((ev) => window.addEventListener(ev, () => this.stop(), { passive: true }));
      update();
    }

    jump(k) {
      k = Math.max(0, Math.min(this.data.stages.length - 1, k));
      this.go(k);
      if (this.mini || !this.steps[k]) return;
      this.lockUntil = Date.now() + 900;
      const y = window.scrollY + this.steps[k].getBoundingClientRect().top - this.triggerLine() + 24;
      window.scrollTo({ top: Math.max(0, y), behavior: reduced.matches ? 'auto' : 'smooth' });
    }

    play() {
      if (this.i >= this.data.stages.length - 1) this.jump(0);
      this.btnPlay.innerHTML = ICON.pause;
      this.btnPlay.setAttribute('aria-label', 'Pause');
      this.timer = setInterval(() => {
        if (this.i >= this.data.stages.length - 1) {
          if (this.mini) this.go(0); else this.stop();
          return;
        }
        this.jump(this.i + 1);
      }, this.mini ? 2800 : 4200);
    }

    stop() {
      if (!this.timer) return;
      clearInterval(this.timer);
      this.timer = null;
      this.btnPlay.innerHTML = ICON.play;
      this.btnPlay.setAttribute('aria-label', 'Play the evolution');
    }

    autoplay() {
      if (reduced.matches) return;
      this.play();
      this.root.addEventListener('mouseenter', () => this.stop());
      this.root.addEventListener('focusin', () => this.stop());
    }
  }

  window.ArchPlayer = ArchPlayer;
})();
