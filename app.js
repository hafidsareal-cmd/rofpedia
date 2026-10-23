/**
 * rofpedia / app.js
 * Main controller — wires everything together
 * All public methods exposed on window.App for inline onclick handlers
 */

import * as API   from './api.js';
import * as UI    from './ui.js';
import { makeCard, makeSearchResult, makeScheduleDay, buildModalHTML } from './cards.js';

/* ── State ── */
const state = {
  heroItems : [],
  heroIdx   : 0,
  heroTimer : null,
  currentAnime    : null,   // { url, title, poster } for hero modal
  currentEpURL    : null,
  currentEpTitle  : null,
};

/* ══════════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════════ */
async function init() {
  bindNav();
  bindSearch();
  await checkAPI();
  await Promise.all([ loadHome(), loadGenres() ]);
}

/* ── API health indicator ── */
async function checkAPI() {
  const apiStatus = document.getElementById('apiStatus');
  const apiDot    = document.getElementById('apiDot');
  const apiText   = document.getElementById('apiStatusText');
  const result = await API.checkHealth();
  if (result.success) {
    apiDot.classList.add('online');
    apiStatus?.classList.add('online');
    if (apiText) { apiText.textContent = 'Online'; }
  } else {
    apiDot?.classList.add('offline');
    apiStatus?.classList.add('offline');
    if (apiText) { apiText.textContent = 'Offline'; }
    UI.showToast('⚠ Backend offline — jalankan: go run . di folder rofpedia/', true);
  }
}

/* ══════════════════════════════════════════════════════════════
   HOME LOAD
══════════════════════════════════════════════════════════════ */
async function loadHome() {
  UI.renderSkeletonRow('ongoingRow', 12);
  UI.renderSkeletonRow('completeRow', 12);

  const schedEl = document.getElementById('scheduleStrip');
  if (schedEl) schedEl.innerHTML = '<div style="padding:20px;color:var(--text-muted);font-size:13px">Memuat jadwal…</div>';

  const [homeRes, schedRes] = await Promise.all([
    API.getHome(),
    API.getSchedule(),
  ]);

  /* Ongoing + Complete */
  if (homeRes.success && homeRes.data) {
    const { ongoing = [], complete = [] } = homeRes.data;

    /* Hero */
    state.heroItems = ongoing.filter(a => a.poster).slice(0, 7);
    if (state.heroItems.length) {
      setHeroIdx(0);
      renderHeroDots();
      startHeroTimer();
    }

    renderRow('ongoingRow',  ongoing,  false);
    renderRow('completeRow', complete, false);
  } else {
    document.getElementById('ongoingRow').innerHTML  = UI.errorState();
    document.getElementById('completeRow').innerHTML = '';
    document.getElementById('heroTitle').textContent  = 'Backend offline';
    document.getElementById('heroDesc').textContent   = 'Jalankan: cd rofpedia && go run .';
  }

  /* Schedule */
  if (schedRes.success && Array.isArray(schedRes.data)) {
    renderSchedule(schedRes.data);
  }
}

/* ══════════════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════════════ */
function setHeroIdx(i) {
  state.heroIdx = i;
  const item = state.heroItems[i];
  if (!item) return;

  const bg    = document.getElementById('heroBg');
  const title = document.getElementById('heroTitle');
  const meta  = document.getElementById('heroMeta');
  const desc  = document.getElementById('heroDesc');

  if (bg)    bg.style.backgroundImage = `url('${item.poster}')`;
  if (title) title.textContent = item.title || '—';
  if (desc)  desc.textContent  = 'Klik "Tonton" untuk melihat episode terbaru.';
  if (meta) {
    meta.innerHTML = [
      item.episode      ? `<span class="score">${item.episode}</span>` : '',
      item.day_or_rating ? `<span>${item.day_or_rating}</span>`        : '',
      item.date         ? `<span style="color:var(--text-muted)">${item.date}</span>` : '',
    ].filter(Boolean).join('<span class="sep"></span>');
  }

  state.currentAnime = item;

  /* Update dots */
  document.querySelectorAll('.hero-dot').forEach((d, j) => {
    d.classList.toggle('active', j === i);
  });
}

function renderHeroDots() {
  const dotsEl = document.getElementById('heroDots');
  if (!dotsEl) return;
  dotsEl.innerHTML = state.heroItems.map((_, i) =>
    `<div class="hero-dot ${i === 0 ? 'active' : ''}"
          onclick="App.heroGoTo(${i})"></div>`
  ).join('');
}

function startHeroTimer() {
  clearInterval(state.heroTimer);
  state.heroTimer = setInterval(() => {
    setHeroIdx((state.heroIdx + 1) % state.heroItems.length);
  }, 6000);
}

/* ══════════════════════════════════════════════════════════════
   SCHEDULE
══════════════════════════════════════════════════════════════ */
function renderSchedule(days) {
  const el = document.getElementById('scheduleStrip');
  if (!el) return;
  const today = UI.todayIdx();
  const dayNames = ['senin','selasa','rabu','kamis','jumat','sabtu','minggu'];
  el.innerHTML = days.map(day => {
    const isToday = dayNames.some((d, i) => i === today && day.day?.toLowerCase().includes(d));
    return makeScheduleDay(day, isToday);
  }).join('');
}

/* ══════════════════════════════════════════════════════════════
   ROW RENDER
══════════════════════════════════════════════════════════════ */
function renderRow(id, items, append = false) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!items || !items.length) {
    if (!append) el.innerHTML = UI.emptyState();
    return;
  }
  const html = items.map(makeCard).join('');
  if (append) el.insertAdjacentHTML('beforeend', html);
  else        el.innerHTML = html;
}

/* ══════════════════════════════════════════════════════════════
   GENRES
══════════════════════════════════════════════════════════════ */
async function loadGenres() {
  const res = await API.getGenres();
  if (!res.success || !res.data?.length) return;

  const row     = document.getElementById('genreRow');
  const footerG = document.getElementById('footerGenres');

  res.data.slice(0, 18).forEach(g => {
    const chip = document.createElement('div');
    chip.className   = 'genre-chip';
    chip.textContent = g.name;
    chip.dataset.slug = g.slug;
    chip.addEventListener('click', () => filterGenre(chip, g.slug));
    row?.appendChild(chip);
  });

  if (footerG) {
    footerG.innerHTML = res.data.slice(0, 6).map(g =>
      `<li><a href="#" onclick="event.preventDefault();App.filterGenreBySlug('${g.slug}','${g.name}')">${g.name}</a></li>`
    ).join('');
  }
}

export async function filterGenreBySlug(slug, name) {
  const chip = document.querySelector(`.genre-chip[data-slug="${slug}"]`);
  if (chip) filterGenre(chip, slug, name);
  else {
    // fallback: just load genre without chip active
    await filterGenre(null, slug, name);
  }
}

async function filterGenre(chipEl, slug, label) {
  document.querySelectorAll('.genre-chip').forEach(c => c.classList.remove('active'));
  if (chipEl) chipEl.classList.add('active');

  if (!slug) {
    loadHome();
    return;
  }

  UI.renderSkeletonRow('ongoingRow', 10);
  document.getElementById('completeRow').innerHTML = '';

  const sectionTitle = document.querySelector('#sec-ongoing .section-title');
  if (sectionTitle) sectionTitle.innerHTML = `<span class="bar"></span>${label || slug}`;

  const res = await API.getGenreAnime(slug, 1);
  if (!res.success) {
    document.getElementById('ongoingRow').innerHTML = UI.errorState(res.error?.message);
    return;
  }

  const items = (res.data?.anime || []).map(a => ({
    title        : a.title,
    url          : a.url,
    poster       : a.poster,
    episode      : a.episode,
    day_or_rating: a.rating,
  }));
  renderRow('ongoingRow', items);

  // pagination
  const pg = res.data?.pagination;
  if (pg && pg.total_pages > 1) {
    renderGenrePagination(slug, pg.current_page, pg.total_pages);
  }
}

function renderGenrePagination(slug, current, total) {
  let container = document.getElementById('genrePagination');
  if (!container) {
    container = document.createElement('div');
    container.id = 'genrePagination';
    document.getElementById('sec-ongoing')?.appendChild(container);
  }
  container.innerHTML = UI.buildPagination(current, total, async (page) => {
    UI.renderSkeletonRow('ongoingRow', 10);
    const res = await API.getGenreAnime(slug, page);
    if (res.success) {
      renderRow('ongoingRow', res.data?.anime || []);
      renderGenrePagination(slug, res.data?.pagination?.current_page || page, total);
    }
  });
}

/* ══════════════════════════════════════════════════════════════
   ANIME DETAIL MODAL
══════════════════════════════════════════════════════════════ */
export async function openAnimeDetail(encodedURL, encodedTitle) {
  const animeURL = decodeURIComponent(encodedURL);
  const title    = decodeURIComponent(encodedTitle);

  /* open modal with loading state */
  const modal = document.getElementById('modal');
  if (!modal) return;
  modal.innerHTML = `
    <div style="padding:48px 28px;text-align:center">
      <div class="spinner" style="margin:0 auto 16px"></div>
      <div style="color:var(--text-muted);font-size:14px">Memuat ${title}…</div>
    </div>`;
  document.getElementById('modalOverlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';

  const res = await API.getAnimeDetail(animeURL);

  if (!res.success) {
    modal.innerHTML = `
      <div style="padding:32px 28px">
        <button class="modal-close" onclick="App.closeModal()" style="position:static;margin-bottom:16px">✕</button>
        ${UI.errorState(res.error?.message || 'Gagal memuat detail')}
      </div>`;
    return;
  }

  modal.innerHTML = buildModalHTML(res.data);

  /* remember for My List toggle */
  state.currentAnime = {
    url   : animeURL,
    title : res.data.title || title,
    poster: res.data.poster || '',
  };
}

export function closeModal() {
  document.getElementById('modalOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

export function toggleMyList(encPoster) {
  if (!state.currentAnime) return;
  const { url, title, poster } = state.currentAnime;
  if (UI.myList.has(url)) {
    UI.myList.remove(url);
    UI.showToast(`Dihapus dari My List: "${title}"`);
  } else {
    UI.myList.add({ url, title, poster: decodeURIComponent(encPoster) || poster });
    UI.showToast(`Ditambahkan ke My List: "${title}"`);
  }
}

export function addToMyList(animeURL, encTitle, encPoster) {
  const title  = decodeURIComponent(encTitle);
  const poster = decodeURIComponent(encPoster);
  if (UI.myList.has(animeURL)) {
    UI.showToast(`"${title}" sudah di My List`);
    return;
  }
  UI.myList.add({ url: animeURL, title, poster });
  UI.showToast(`"${title}" ditambahkan ke My List`);
}

/* ══════════════════════════════════════════════════════════════
   PLAYER
══════════════════════════════════════════════════════════════ */
export async function openPlayer(encodedURL, encodedTitle) {
  const epURL    = decodeURIComponent(encodedURL);
  const epTitle  = decodeURIComponent(encodedTitle);

  state.currentEpURL   = epURL;
  state.currentEpTitle = epTitle;

  /* Mark episode as watched */
  UI.watchedList.add(epURL);

  const overlay = document.getElementById('playerOverlay');
  const frame   = document.getElementById('playerFrame');
  const titleEl = document.getElementById('playerTitle');
  const qualEl  = document.getElementById('playerQuality');
  const dlPanel = document.getElementById('dlPanel');

  if (titleEl) titleEl.textContent = epTitle;
  if (qualEl)  qualEl.innerHTML    = '<span style="color:var(--text-muted);font-size:12px">Memuat mirror…</span>';
  if (dlPanel) dlPanel.classList.remove('open');
  if (frame)   frame.src = 'about:blank';
  overlay?.classList.add('open');

  const res = await API.getEpisodeDetail(epURL, false);

  if (!res.success) {
    if (titleEl) titleEl.textContent = `Error: ${res.error?.message}`;
    if (qualEl)  qualEl.innerHTML    = UI.errorState(res.error?.message);
    return;
  }

  const d = res.data;
  if (titleEl) titleEl.textContent = d.title || epTitle;

  /* Load default stream into iframe */
  if (d.default_stream && frame) {
    frame.src = d.default_stream;
  }

  /* Mirror quality buttons */
  const mirrors   = d.mirrors   || [];
  const downloads = d.downloads || [];

  let qHTML = '';
  mirrors.forEach((m, i) => {
    const encEmbed  = encodeURIComponent(m.embed_url  || '');
    const encDirect = encodeURIComponent(m.direct_url || '');
    qHTML += `<button class="quality-btn${i === 0 ? ' active' : ''}"
       onclick="App.switchMirror(this,'${encEmbed}','${encDirect}')">
       ${m.name || 'Mirror'} ${m.quality || ''}
     </button>`;
  });

  if (downloads.length) {
    qHTML += `<button class="quality-btn" onclick="App.toggleDownloads()">⬇ Download</button>`;
  }

  if (qualEl) qualEl.innerHTML = qHTML || '<span style="color:var(--text-muted);font-size:12px">Tidak ada mirror tersedia.</span>';

  /* Download panel */
  if (dlPanel && downloads.length) {
    dlPanel.innerHTML = downloads.map(q => `
      <div class="dl-quality">
        <div class="dl-quality-label">${q.quality || '?'} ${q.size ? `(${q.size})` : ''}</div>
        <div class="dl-servers">
          ${(q.servers || []).map(s => `
            <a class="dl-server-btn" href="${s.redirect_url}" target="_blank" rel="noopener">
              ↓ ${s.name}
            </a>`).join('')}
        </div>
      </div>`).join('');
  }

  /* Nav buttons */
  const prevBtn = document.getElementById('playerPrev');
  const nextBtn = document.getElementById('playerNext');
  if (prevBtn) {
    prevBtn.style.display  = d.prev_url ? '' : 'none';
    prevBtn.onclick = () => openPlayer(encodeURIComponent(d.prev_url), 'Episode Sebelumnya');
  }
  if (nextBtn) {
    nextBtn.style.display  = d.next_url ? '' : 'none';
    nextBtn.onclick = () => openPlayer(encodeURIComponent(d.next_url), 'Episode Berikutnya');
  }
}

export function switchMirror(btn, encEmbed, encDirect) {
  document.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const frame = document.getElementById('playerFrame');
  if (!frame) return;
  const direct = decodeURIComponent(encDirect);
  const embed  = decodeURIComponent(encEmbed);
  frame.src = direct || embed || 'about:blank';
}

export function toggleDownloads() {
  document.getElementById('dlPanel')?.classList.toggle('open');
}

export function closePlayer() {
  document.getElementById('playerOverlay')?.classList.remove('open');
  const frame = document.getElementById('playerFrame');
  if (frame) frame.src = 'about:blank';
}

/* ══════════════════════════════════════════════════════════════
   SEARCH
══════════════════════════════════════════════════════════════ */
function bindSearch() {
  const input = document.getElementById('searchInput');
  const panel = document.getElementById('searchPanel');
  if (!input || !panel) return;

  const doSearch = UI.debounce(async (q) => {
    if (!q) { panel.classList.remove('open'); return; }
    panel.innerHTML = '<div class="search-empty"><div class="spinner" style="width:24px;height:24px;margin:0 auto"></div></div>';
    panel.classList.add('open');

    const res = await API.searchAnime(q);
    const results = res.data || [];
    if (!results.length) {
      panel.innerHTML = `<div class="search-empty">Tidak ditemukan: "${q}"</div>`;
    } else {
      panel.innerHTML = results.map(makeSearchResult).join('');
    }
  }, 480);

  input.addEventListener('input', e => doSearch(e.target.value.trim()));

  document.addEventListener('click', e => {
    if (!e.target.closest('#searchPanel') && !e.target.closest('.search-bar')) {
      panel.classList.remove('open');
    }
  });
}

export function closeSearch() {
  document.getElementById('searchPanel')?.classList.remove('open');
  const input = document.getElementById('searchInput');
  if (input) input.value = '';
}

/* ══════════════════════════════════════════════════════════════
   NAV
══════════════════════════════════════════════════════════════ */
function bindNav() {
  window.addEventListener('scroll', () => {
    document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
}

/* ══════════════════════════════════════════════════════════════
   SECTION HELPERS (exposed to nav links)
══════════════════════════════════════════════════════════════ */
export function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export function heroGoTo(i) {
  clearInterval(state.heroTimer);
  setHeroIdx(i);
  startHeroTimer();
}

export function openHeroModal() {
  if (state.currentAnime?.url) {
    openAnimeDetail(
      encodeURIComponent(state.currentAnime.url),
      encodeURIComponent(state.currentAnime.title || '')
    );
  }
}

export function scrollRow(id, dx) { UI.scrollRow(id, dx); }

/* ══════════════════════════════════════════════════════════════
   EXPOSE on window.App  (for onclick= in HTML)
══════════════════════════════════════════════════════════════ */
window.App = {
  openAnimeDetail,
  closeModal,
  openPlayer,
  switchMirror,
  toggleDownloads,
  closePlayer,
  closeSearch,
  addToMyList,
  toggleMyList,
  heroGoTo,
  openHeroModal,
  scrollRow,
  scrollToSection,
  filterGenreBySlug,
};

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', init);
