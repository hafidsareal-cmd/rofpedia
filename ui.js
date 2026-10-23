/**
 * rofpedia / ui.js
 * UI utilities: skeleton, toast, spinner, scroll helpers, DOM shortcuts
 */

/* ── DOM shorthand ── */
export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ── Fallback poster ── */
export const IMG_FALLBACK =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc1IiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTc1IiBoZWlnaHQ9IjI1MCIgZmlsbD0iIzExMWYxNyIvPjx0ZXh0IHg9Ijg3LjUiIHk9IjEyNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjQwIiBmaWxsPSIjMmEzZDMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj7wn47qPC90ZXh0Pjwvc3ZnPg==';

/* ── Skeleton rows ── */
export function renderSkeletonRow(containerId, count = 12) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = Array.from({ length: count }).map(() => `
    <div class="skel-card">
      <div class="skeleton skel-poster"></div>
      <div class="skeleton skel-line"></div>
      <div class="skeleton skel-line short"></div>
    </div>`).join('');
}

export function renderSkeletonGrid(containerId, count = 12) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = Array.from({ length: count }).map(() => `
    <div class="skel-card" style="width:100%">
      <div class="skeleton skel-poster"></div>
      <div class="skeleton skel-line"></div>
      <div class="skeleton skel-line short"></div>
    </div>`).join('');
}

/* ── Spinner ── */
export function renderSpinner(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '<div class="page-loader"><div class="spinner"></div></div>';
}

/* ── Toast ── */
let toastTimer;
export function showToast(msg, isError = false) {
  const el = document.getElementById('toast');
  if (!el) return;
  clearTimeout(toastTimer);
  el.textContent = msg;
  el.className = 'toast show' + (isError ? ' error' : '');
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3200);
}

/* ── Row scroll ── */
export function scrollRow(id, dx) {
  const el = document.getElementById(id);
  if (el) el.scrollBy({ left: dx, behavior: 'smooth' });
}

/* ── Truncate ── */
export function truncate(str, max) {
  if (!str) return '';
  return str.length <= max ? str : str.slice(0, max) + '…';
}

/* ── Episode label from title ── */
export function epLabel(title, idx) {
  if (!title) return `${idx + 1}`;
  const m = title.match(/(\d+)(?:\s*(?:v\d+|special|ova|movie))?$/i);
  return m ? m[0] : title.split(' ').slice(-1)[0] || `${idx + 1}`;
}

/* ── Empty state ── */
export function emptyState(msg = 'Tidak ada data.') {
  return `<div style="padding:32px 20px;color:var(--text-muted);font-size:13px;text-align:center">${msg}</div>`;
}

/* ── Error state ── */
export function errorState(msg = 'Gagal memuat data.') {
  return `<div style="padding:32px 20px;color:#ff5252;font-size:13px;text-align:center">
    ⚠ ${msg}<br>
    <span style="color:var(--text-muted);font-size:11px;margin-top:6px;display:block">
      Pastikan backend Go berjalan: <code>cd rofpedia && go run .</code>
    </span>
  </div>`;
}

/* ── Safe image ── */
export function safeImg(src) {
  return src && src.startsWith('http') ? src : IMG_FALLBACK;
}

/* ── Debounce ── */
export function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* ── Format score ── */
export function fmtScore(score) {
  if (!score || score === 'N/A' || score === '0') return '';
  const n = parseFloat(score);
  return isNaN(n) ? score : `★ ${n.toFixed(2)}`;
}

/* ── Today's day index (Mon=0 … Sun=6) ── */
export function todayIdx() {
  return (new Date().getDay() + 6) % 7;
}

/* ── Build pagination HTML ── */
export function buildPagination(current, total, onPage) {
  if (total <= 1) return '';
  const pages = [];

  // prev
  pages.push(`<button class="page-btn" ${current <= 1 ? 'disabled' : ''} data-p="${current - 1}">‹</button>`);

  // page numbers (window of 5 around current)
  const start = Math.max(1, current - 2);
  const end   = Math.min(total, current + 2);
  if (start > 1) pages.push(`<button class="page-btn" data-p="1">1</button>${start > 2 ? '<span style="color:var(--text-muted);padding:0 4px">…</span>' : ''}`);
  for (let i = start; i <= end; i++) {
    pages.push(`<button class="page-btn ${i === current ? 'active' : ''}" data-p="${i}">${i}</button>`);
  }
  if (end < total) pages.push(`${end < total - 1 ? '<span style="color:var(--text-muted);padding:0 4px">…</span>' : ''}<button class="page-btn" data-p="${total}">${total}</button>`);

  // next
  pages.push(`<button class="page-btn" ${current >= total ? 'disabled' : ''} data-p="${current + 1}">›</button>`);

  const html = `<div class="pagination">${pages.join('')}</div>`;

  // wire events after render (call after innerHTML set)
  setTimeout(() => {
    $$('.page-btn[data-p]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!btn.disabled) onPage(parseInt(btn.dataset.p));
      });
    });
  }, 0);

  return html;
}

/* ── Watched list (localStorage) ── */
export const watchedList = {
  key: 'rofpedia_watched',
  get() {
    try { return JSON.parse(localStorage.getItem(this.key) || '[]'); } catch { return []; }
  },
  add(url) {
    const list = this.get();
    if (!list.includes(url)) { list.push(url); localStorage.setItem(this.key, JSON.stringify(list)); }
  },
  has(url) { return this.get().includes(url); }
};

/* ── My List (localStorage) ── */
export const myList = {
  key: 'rofpedia_mylist',
  get() {
    try { return JSON.parse(localStorage.getItem(this.key) || '[]'); } catch { return []; }
  },
  add(item) {
    const list = this.get();
    if (!list.find(x => x.url === item.url)) {
      list.unshift(item);
      localStorage.setItem(this.key, JSON.stringify(list));
    }
  },
  remove(url) {
    const list = this.get().filter(x => x.url !== url);
    localStorage.setItem(this.key, JSON.stringify(list));
  },
  has(url) { return !!this.get().find(x => x.url === url); }
};
