/**
 * rofpedia / api.js
 * All HTTP calls to the Go backend at localhost:8080
 * Every function returns { success, data, error } matching ExtractionResult
 */

const API_BASE = 'http://localhost:8080/api';

/**
 * Core fetch wrapper with timeout + error normalisation
 * @param {string} path  - e.g. '/home'
 * @param {number} ms    - timeout in ms (default 30 000)
 */
async function apiGet(path, ms = 30_000) {
  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(API_BASE + path, { signal: ctrl.signal });
    clearTimeout(tid);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(tid);
    if (err.name === 'AbortError') {
      return { success: false, error: { code: 'TIMEOUT', message: 'Request timed out' } };
    }
    return { success: false, error: { code: 'NETWORK_ERROR', message: err.message } };
  }
}

/* ── Health check ── */
export async function checkHealth() {
  return apiGet('/health', 5_000);
}

/* ── Home feed (ongoing + complete) ── */
export async function getHome() {
  return apiGet('/home');
}

/* ── Release schedule ── */
export async function getSchedule() {
  return apiGet('/schedule');
}

/* ── Ongoing with pagination ── */
export async function getOngoing(page = 1) {
  return apiGet(`/ongoing?page=${page}`);
}

/* ── Complete with pagination ── */
export async function getComplete(page = 1) {
  return apiGet(`/complete?page=${page}`);
}

/* ── Search ── */
export async function searchAnime(query) {
  if (!query || !query.trim()) return { success: true, data: [] };
  return apiGet(`/search?q=${encodeURIComponent(query.trim())}`);
}

/* ── Anime detail page ── */
export async function getAnimeDetail(animeURL) {
  if (!animeURL) return { success: false, error: { code: 'MISSING_URL', message: 'No URL provided' } };
  return apiGet(`/anime?url=${encodeURIComponent(animeURL)}`);
}

/**
 * Episode detail — streams + downloads
 * @param {string}  epURL        - full otakudesu episode URL
 * @param {boolean} resolveStream - if true, backend unpacks JS and extracts direct URL (slower)
 */
export async function getEpisodeDetail(epURL, resolveStream = false) {
  if (!epURL) return { success: false, error: { code: 'MISSING_URL', message: 'No URL provided' } };
  const resolve = resolveStream ? 1 : 0;
  return apiGet(`/episode?url=${encodeURIComponent(epURL)}&resolve=${resolve}`, 60_000);
}

/* ── Genre list ── */
export async function getGenres() {
  return apiGet('/genres');
}

/* ── Anime by genre ── */
export async function getGenreAnime(slug, page = 1) {
  if (!slug) return { success: false, error: { code: 'MISSING_SLUG', message: 'No slug provided' } };
  return apiGet(`/genre?slug=${encodeURIComponent(slug)}&page=${page}`);
}

/* ── A-Z anime directory ── */
export async function getAZ() {
  return apiGet('/az');
}
