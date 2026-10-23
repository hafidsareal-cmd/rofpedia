/**
 * rofpedia / cards.js
 * HTML string builders for anime cards, search results, schedule items
 * Pure functions — no side effects, no DOM mutation
 */

import { safeImg, IMG_FALLBACK, truncate, epLabel, fmtScore, watchedList } from './ui.js';

/* ══════════════════════════════════════════════════════════════
   ANIME CARD  (used in horizontal rows and grids)
══════════════════════════════════════════════════════════════ */
export function makeCard(item) {
  const title   = item.title   || '—';
  const poster  = safeImg(item.poster);
  const ep      = item.episode || '';
  const badge   = item.day_or_rating || item.rating || '';
  const score   = fmtScore(item.score || item.rating || '');
  const animeURL = encodeURIComponent(item.url || '');
  const encTitle = encodeURIComponent(title);

  return `
<div class="anime-card" data-url="${animeURL}" data-title="${encTitle}"
     onclick="App.openAnimeDetail('${animeURL}','${encTitle}')">
  <div class="card-poster">
    <img src="${poster}" alt="${esc(title)}" loading="lazy"
         onerror="this.src='${IMG_FALLBACK}'">
    <div class="card-overlay"></div>
    ${badge ? `<span class="card-badge-top">${esc(badge)}</span>` : ''}
    ${ep    ? `<span class="card-badge-ep">${esc(ep)}</span>`    : ''}
    ${score ? `<span class="card-rating">${esc(score)}</span>`   : ''}
  </div>
  <div class="card-info">
    <div class="card-title" title="${esc(title)}">${esc(title)}</div>
    <div class="card-sub">
      ${ep    ? `<span>${esc(ep)}</span><span class="dot"></span>` : ''}
      ${badge ? `<span class="score">${esc(badge)}</span>`         : ''}
    </div>
  </div>
  <div class="card-hover">
    <img class="card-hover-img" src="${poster}" alt="${esc(title)}"
         onerror="this.src='${IMG_FALLBACK}'">
    <div class="card-hover-body">
      <div class="card-hover-title">${esc(truncate(title, 48))}</div>
      <div class="card-hover-tags">
        ${badge ? `<span class="card-hover-tag">${esc(badge)}</span>` : ''}
        ${ep    ? `<span class="card-hover-tag">${esc(ep)}</span>`    : ''}
      </div>
      <div class="card-hover-desc">Klik untuk melihat semua episode dan info detail.</div>
      <div class="card-hover-actions">
        <button class="ch-btn ch-btn-watch"
          onclick="event.stopPropagation();App.openAnimeDetail('${animeURL}','${encTitle}')">
          ▶ Tonton
        </button>
        <button class="ch-btn ch-btn-list"
          onclick="event.stopPropagation();App.addToMyList(decodeURIComponent('${animeURL}'),'${encTitle}','${poster}')">
          + List
        </button>
      </div>
    </div>
  </div>
</div>`;
}

/* ══════════════════════════════════════════════════════════════
   SEARCH RESULT ROW
══════════════════════════════════════════════════════════════ */
export function makeSearchResult(item) {
  const title  = item.title  || '—';
  const poster = safeImg(item.poster);
  const status = item.status || '';
  const rating = item.rating || '';
  const animeURL = encodeURIComponent(item.url || '');
  const encTitle = encodeURIComponent(title);

  return `
<div class="search-result-item"
     onclick="App.openAnimeDetail('${animeURL}','${encTitle}');App.closeSearch()">
  <img class="search-result-poster" src="${poster}" alt="${esc(title)}"
       onerror="this.src='${IMG_FALLBACK}'">
  <div class="search-result-info">
    <div class="search-result-title">${esc(title)}</div>
    <div class="search-result-meta">
      ${status ? esc(status) : ''}
      ${rating ? ` · ${esc(rating)}` : ''}
    </div>
  </div>
</div>`;
}

/* ══════════════════════════════════════════════════════════════
   SCHEDULE DAY CARD
══════════════════════════════════════════════════════════════ */
export function makeScheduleDay(day, isToday) {
  const items = (day.anime || []).slice(0, 6).map(a => `
    <div class="sched-anime-item"
         onclick="App.openAnimeDetail('${encodeURIComponent(a.url)}','${encodeURIComponent(a.title)}')"
         title="${esc(a.title)}">
      ${esc(a.title)}
    </div>`).join('');

  return `
<div class="schedule-day ${isToday ? 'today' : ''}">
  <div class="sched-day-label">
    ${esc(day.day)}${isToday ? ' — Hari ini' : ''}
  </div>
  ${items || '<div class="sched-anime-item" style="color:var(--text-muted)">—</div>'}
</div>`;
}

/* ══════════════════════════════════════════════════════════════
   EPISODE BUTTON
══════════════════════════════════════════════════════════════ */
export function makeEpBtn(ep, idx, watched = false) {
  const label    = epLabel(ep.title, idx);
  const encURL   = encodeURIComponent(ep.url);
  const encTitle = encodeURIComponent(ep.title || `Episode ${idx + 1}`);

  return `
<button class="ep-btn ${watched ? 'watched' : ''}"
        title="${esc(ep.title || '')}"
        onclick="App.openPlayer('${encURL}','${encTitle}')">
  ${esc(label)}
</button>`;
}

/* ══════════════════════════════════════════════════════════════
   MODAL DETAIL
══════════════════════════════════════════════════════════════ */
export function buildModalHTML(d) {
  const poster = safeImg(d.poster);
  const title  = d.title || '—';
  const score  = fmtScore(d.score);
  const isOn   = /ongoing|airing/i.test(d.status || '');

  const genres = (d.genres || []).map(g =>
    `<span class="modal-genre-tag">${esc(g)}</span>`).join('');

  const eps = (d.episodes || []);
  const epBtns = eps.map((ep, i) => makeEpBtn(ep, i, watchedList.has(ep.url))).join('');

  const infoItems = [
    ['Tipe',       d.type],
    ['Status',     d.status],
    ['Episode',    d.total_episodes],
    ['Durasi',     d.duration],
    ['Studio',     d.studio],
    ['Rilis',      d.release_date],
    ['Produser',   d.producer],
    ['Score',      score],
  ].filter(([, v]) => v).map(([label, val]) => `
    <div class="modal-info-item">
      <div class="modal-info-label">${label}</div>
      <div class="modal-info-value">${esc(val)}</div>
    </div>`).join('');

  return `
<div class="modal-cover">
  <img id="modalCoverImg" src="${poster}" alt="${esc(title)}"
       onerror="this.src='${IMG_FALLBACK}'">
  <button class="modal-close" onclick="App.closeModal()">✕</button>
</div>
<div class="modal-body">
  <h2 class="modal-title">${esc(title)}</h2>
  ${d.japanese ? `<div class="modal-jp-title">${esc(d.japanese)}</div>` : ''}
  <div class="modal-meta">
    ${score ? `<span class="score">${esc(score)}</span><span class="sep">·</span>` : ''}
    ${d.type   ? `<span>${esc(d.type)}</span><span class="sep">·</span>` : ''}
    ${d.total_episodes ? `<span>${esc(d.total_episodes)} Episode</span><span class="sep">·</span>` : ''}
    ${d.status ? `<span class="${isOn ? 'status-on' : 'status-off'}">${esc(d.status)}</span>` : ''}
  </div>
  <div class="modal-actions">
    ${eps.length ? `
      <button class="btn btn-green btn-lg"
        onclick="App.openPlayer('${encodeURIComponent(eps[eps.length - 1].url)}','${encodeURIComponent(eps[eps.length - 1].title)}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
        Tonton Eps Terbaru
      </button>` : ''}
    <button class="btn btn-ghost"
      onclick="App.toggleMyList('${encodeURIComponent(d.poster||'')}')">
      + My List
    </button>
  </div>
  <div class="modal-genres">${genres}</div>
  ${infoItems ? `<div class="modal-info-grid">${infoItems}</div>` : ''}
  ${d.synopsis ? `<p class="modal-synopsis">${esc(d.synopsis)}</p>` : ''}
  ${eps.length ? `
    <div class="modal-section-label">${eps.length} Episode</div>
    <div class="ep-grid">${epBtns}</div>` : ''}
</div>`;
}

/* ── escape HTML ── */
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
