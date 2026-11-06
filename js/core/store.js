// localStorage wrapper: every access is guarded; falls back to memory when storage is blocked.
const mem = {};
const subs = new Set();
function read(key, fallback) {
  try { const v = localStorage.getItem(key); if (v != null) return JSON.parse(v); } catch (_) { /* blocked or corrupt */ }
  return key in mem ? mem[key] : fallback;
}
function write(key, value) {
  mem[key] = value;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* quota or blocked */ }
  subs.forEach((fn) => fn(key));
}
export const onChange = (fn) => { subs.add(fn); return () => subs.delete(fn); };

export const DEFAULT_SETTINGS = {
  layers: { ar: true, tr: true, en: true, ur: false },
  sizes: { ar: 2, tr: 1, tl: 1.0625 },
  theme: 'cream',
};
export function getSettings() {
  const s = read('rh.settings', {});
  return {
    layers: { ...DEFAULT_SETTINGS.layers, ...(s.layers || {}) },
    sizes: { ...DEFAULT_SETTINGS.sizes, ...(s.sizes || {}) },
    theme: s.theme || DEFAULT_SETTINGS.theme,
  };
}
export function setSettings(s) { write('rh.settings', s); }

export const getFavs = () => { const v = read('rh.favs', []); return Array.isArray(v) ? v : []; };
export const isFav = (id) => getFavs().includes(id);
export function toggleFav(id) {
  const f = getFavs();
  const i = f.indexOf(id);
  if (i >= 0) f.splice(i, 1); else f.unshift(id);
  write('rh.favs', f);
  return i < 0;
}
export const clearFavs = () => write('rh.favs', []);
export const setFavs = (arr) => write('rh.favs', [...new Set(arr)]);

export function getRecent() { const v = read('rh.recent', []); return Array.isArray(v) ? v : []; }
export function pushRecent(id) {
  const r = getRecent().filter((x) => x !== id); r.unshift(id); write('rh.recent', r.slice(0, 12));
}

const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const todayKey = today;
export function getAdhkar(date = today()) { const all = read('rh.adhkar', {}); return all[date] || {}; }
export function bumpAdhkar(id, max, delta = 1) {
  const all = read('rh.adhkar', {});
  const day = all[today()] || {};
  day[id] = Math.max(0, Math.min(max, (day[id] || 0) + delta));
  all[today()] = day;
  // keep only the last 30 days
  Object.keys(all).sort().slice(0, -30).forEach((k) => delete all[k]);
  write('rh.adhkar', all);
  return day[id];
}
export function resetAdhkarToday() { const all = read('rh.adhkar', {}); delete all[today()]; write('rh.adhkar', all); }
export function adhkarDaysActive() { const all = read('rh.adhkar', {}); return Object.keys(all).filter((k) => Object.values(all[k]).some((n) => n > 0)).length; }
