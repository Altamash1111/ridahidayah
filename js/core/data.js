export const D = { ready: false };

const getJSON = async (name, optional = false) => {
  try {
    const r = await fetch(`data/${name}`, { cache: 'no-cache' });
    if (!r.ok) throw new Error(`${name}: ${r.status}`);
    return await r.json();
  } catch (e) { if (optional) return null; throw e; }
};

export async function loadData() {
  const [entries, taxonomy, emotions, adhkar, names, review, report] = await Promise.all([
    getJSON('entries.json'), getJSON('taxonomy.json'), getJSON('emotions.json'), getJSON('adhkar-groups.json'),
    getJSON('names.json'), getJSON('review-queue.json', true), getJSON('build-report.json', true),
  ]);
  // Only VERIFIED entries are ever published.
  D.entries = entries.filter((e) => e.verification_status === 'VERIFIED');
  D.byId = Object.fromEntries(D.entries.map((e) => [e.id, e]));
  D.tax = taxonomy;
  D.groups = taxonomy.groups;
  D.categories = taxonomy.categories;
  D.catBySlug = Object.fromEntries(taxonomy.categories.map((c) => [c.slug, c]));
  D.quranTopics = taxonomy.quran_topics;
  D.situations = taxonomy.situations;
  D.emotions = Array.isArray(emotions) ? emotions : emotions.emotions;
  D.emotionBySlug = Object.fromEntries(D.emotions.map((e) => [e.slug, e]));
  D.adhkar = adhkar;
  D.names = names.names; D.namesMeta = names.meta;
  D.review = review || [];
  D.report = report || {};
  D.duas = D.entries.filter((e) => e.kind === 'dua' || e.kind === 'dhikr');
  D.pool = D.entries.filter((e) => e.kind === 'dua');
  D.ready = true;
  return D;
}
export const entriesIn = (slug) => D.entries.filter((e) => (e.categories || []).includes(slug));
export const KIND_ORDER = { dua: 0, dhikr: 1, verse: 2, guidance: 3 };
export const sortKind = (a, b) => (KIND_ORDER[a.kind] ?? 9) - (KIND_ORDER[b.kind] ?? 9);
export const ids = (list) => (list || []).map((i) => D.byId[i]).filter(Boolean);

function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
export function duaOfTheDay(date = new Date()) {
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const sorted = [...D.pool].sort((a, b) => a.id.localeCompare(b.id));
  return sorted[hash(key) % sorted.length];
}
export function randomEntry(excludeId) {
  const pool = D.pool.filter((e) => e.id !== excludeId);
  return pool[Math.floor(Math.random() * pool.length)];
}
export function sourceLabel(e) {
  if (e.source_type === 'quran') {
    const r = e.quran_refs?.[0];
    return `Quran · ${e.surah_name || r?.surah_name || ''} ${e.verse_number || (r ? r.surah + ':' + r.ayah : '')}`.trim();
  }
  return `${e.hadith_collection || ''} · ${e.hadith_reference || ''}`.replace(/^ · | · $/g, '');
}
