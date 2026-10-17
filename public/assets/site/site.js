// ezekias.dev — theme toggle and mobile menu. Shared by every page.
(() => {
  const root = document.documentElement;
  const KEY = 'theme';
  const read = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const write = (v) => { try { localStorage.setItem(KEY, v); } catch (e) { /* storage blocked */ } };

  const apply = (mode) => {
    if (mode === 'light' || mode === 'dark') root.setAttribute('data-theme', mode);
    else root.removeAttribute('data-theme');
  };
  apply(read());

  const label = (mode) => mode === 'dark' ? 'Theme: dark' : mode === 'light' ? 'Theme: light' : 'Theme: system';

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('[data-theme-toggle]');
    if (btn) {
      const order = ['auto', 'light', 'dark'];
      let mode = read() || 'auto';
      btn.setAttribute('aria-label', label(mode));
      btn.title = label(mode);
      btn.addEventListener('click', () => {
        mode = order[(order.indexOf(mode) + 1) % order.length];
        apply(mode);
        write(mode);
        btn.setAttribute('aria-label', label(mode));
        btn.title = label(mode);
      });
    }

    document.querySelectorAll('.has-sub').forEach((item) => {
      const toggle = item.querySelector('.sub-toggle');
      const set = (open) => { item.classList.toggle('open', open); toggle.setAttribute('aria-expanded', String(open)); };
      toggle.addEventListener('click', (e) => { e.stopPropagation(); set(!item.classList.contains('open')); });
      document.addEventListener('click', (e) => { if (!item.contains(e.target)) set(false); });
      item.addEventListener('keydown', (e) => { if (e.key === 'Escape') { set(false); toggle.focus(); } });
    });

    const menu = document.querySelector('[data-menu-toggle]');
    const nav = document.getElementById('site-nav');
    if (menu && nav) {
      menu.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        menu.setAttribute('aria-expanded', String(open));
      });
      nav.addEventListener('click', (e) => {
        if (e.target.closest('a')) { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }
      });
    }
  });
})();
