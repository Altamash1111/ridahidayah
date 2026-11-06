// Lexical search over entries, categories, feelings and the 99 names.
// Architecture: providers share one interface so a semantic provider can be registered later
// without touching the UI:  { name, search(query, ctx) -> [{ type, id, score }] }
import { D } from './data.js';

const AR_MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
export const normAr = (s) => String(s || '').replace(AR_MARKS, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي');
export const normLatin = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’'`ʿʾ‘]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const hasArabic = (s) => /[؀-ۿ]/.test(s);

// Everyday words (English + Roman Urdu) mapped to the vocabulary used in the content.
const SYN = {
  sad: ['grief', 'sorrow', 'distress', 'gham', 'udaas', 'hardship'], udaas: ['sad', 'grief', 'gham'], gham: ['sad', 'grief', 'sorrow', 'distress'],
  anxiety: ['anxious', 'worry', 'fear', 'pareshani', 'hamm', 'distress'], anxious: ['anxiety', 'worry', 'distress'], worried: ['anxiety', 'worry', 'distress'], tension: ['anxiety', 'distress', 'worry'], pareshani: ['anxiety', 'distress', 'worry', 'hardship'], pareshan: ['anxiety', 'distress'],
  stress: ['anxiety', 'distress', 'overthinking', 'hardship'], depressed: ['sad', 'hopeless', 'distress'], depression: ['sad', 'hopeless', 'distress'],
  fear: ['scared', 'protection', 'khauf', 'dar'], scared: ['fear', 'protection', 'khauf'], dar: ['fear', 'scared'], khauf: ['fear', 'scared'],
  angry: ['anger', 'gussa', 'ghussa'], gussa: ['anger', 'angry'], ghussa: ['anger', 'angry'],
  lonely: ['alone', 'akela', 'akelapan'], alone: ['lonely'], akela: ['lonely', 'alone'],
  forgive: ['forgiveness', 'maafi', 'istighfar', 'repentance', 'mercy'], forgiveness: ['forgive', 'maafi', 'istighfar'], maafi: ['forgiveness', 'forgive', 'istighfar'], gunah: ['sin', 'forgiveness', 'repentance'], sin: ['forgiveness', 'repentance', 'gunah'], tauba: ['repentance', 'forgiveness'], guilt: ['guilty', 'forgiveness', 'repentance'],
  rizq: ['provision', 'wealth', 'sustenance', 'halal'], rozi: ['rizq', 'provision'], money: ['rizq', 'provision', 'debt'], debt: ['qarz', 'rizq'], qarz: ['debt'], job: ['rizq', 'provision', 'success'],
  health: ['healing', 'illness', 'sehat', 'shifa'], sick: ['healing', 'illness', 'shifa'], illness: ['healing', 'shifa', 'sehat'], shifa: ['healing', 'illness', 'sick'], dard: ['pain', 'healing'], pain: ['dard', 'healing'], bimar: ['sick', 'illness', 'healing'],
  sleep: ['sone', 'bed', 'night', 'neend'], sone: ['sleep'], neend: ['sleep'], raat: ['night', 'sleep', 'evening'],
  morning: ['subah', 'sabah'], subah: ['morning'], evening: ['shaam', 'masa'], shaam: ['evening'],
  parents: ['walidain', 'mother', 'father', 'maa', 'baap', 'family'], mother: ['parents', 'maa'], father: ['parents', 'baap'], maa: ['parents', 'mother'], family: ['aulad', 'children', 'parents', 'spouse'], children: ['aulad', 'family', 'offspring'], aulad: ['children', 'family'], marriage: ['nikah', 'spouse', 'family'], nikah: ['marriage'],
  guidance: ['hidayat', 'guide', 'straight path', 'sirat'], hidayat: ['guidance', 'guide'], path: ['guidance', 'sirat'], lost: ['guidance', 'direction', 'confused'], confused: ['lost', 'guidance', 'istikhara'], decision: ['istikhara', 'guidance'],
  protection: ['hifazat', 'refuge', 'safety', 'evil'], hifazat: ['protection', 'refuge'], evil: ['protection', 'refuge', 'harm'], nazar: ['evil eye', 'protection'], shaitan: ['satan', 'protection', 'refuge'],
  patience: ['sabr', 'steadfastness'], sabr: ['patience', 'steadfastness'], exhausted: ['tired', 'patience', 'hardship'], tired: ['exhausted', 'patience'],
  thanks: ['gratitude', 'shukr', 'grateful'], thank: ['gratitude', 'shukr'], shukr: ['gratitude', 'thanks'], grateful: ['gratitude', 'shukr'],
  heaven: ['jannah', 'paradise'], paradise: ['jannah'], jannah: ['paradise'], hell: ['hellfire', 'fire', 'jahannam'], jahannam: ['hellfire'], death: ['akhirah', 'grave', 'hereafter'],
  travel: ['safar', 'journey'], safar: ['travel', 'journey'], knowledge: ['ilm', 'study', 'student'], ilm: ['knowledge'], study: ['knowledge', 'ilm'], exam: ['knowledge', 'success', 'ease'],
  hopeless: ['despair', 'hope', 'mercy'], despair: ['hopeless', 'hope', 'mercy'], hope: ['mercy', 'hopeless'], peace: ['sakoon', 'tranquility', 'mental peace'], sakoon: ['peace', 'tranquility'],
  heartbroken: ['grief', 'sorrow', 'sad', 'distress'], breakup: ['heartbroken', 'sad'], overthinking: ['anxiety', 'worry', 'waswasa'], waswasa: ['overthinking', 'whisper', 'protection'],
};

const fields = (e) => {
  const cats = (e.categories || []).map((c) => D.catBySlug[c]?.title || c).join(' ');
  const emos = D.emotions.filter((m) => [...(m.verses || []), ...(m.quran_duas || []), ...(m.prophetic_duas || []), ...(m.guidance || [])].includes(e.id)).map((m) => m.label + ' ' + m.title).join(' ');
  return {
    title: normLatin(e.title), kw: normLatin((e.keywords || []).join(' ')), cats: normLatin(cats + ' ' + emos),
    tl: normLatin(e.transliteration), en: normLatin(e.english_translation), ur: normLatin(e.roman_urdu_translation),
    ex: normLatin([e.explanation, e.context, e.narrator, e.surah_name, e.hadith_collection].join(' ')),
    ar: normAr([].concat(e.arabic_parts || e.arabic || []).join(' ')),
  };
};
const W = { title: 6, kw: 5, cats: 4, tl: 3, en: 2, ur: 2, ex: 1 };

let index = null;
function build() {
  index = {
    entries: D.entries.map((e) => ({ e, f: fields(e) })),
    names: D.names.map((n) => ({ n, f: { tl: normLatin(n.transliteration), en: normLatin(n.english), ur: normLatin(n.roman_urdu), ar: normAr(n.arabic), ex: normLatin(n.explanation) } })),
    cats: D.categories.map((c) => ({ c, f: normLatin(c.title + ' ' + c.description) })),
    emos: D.emotions.map((m) => ({ m, f: normLatin([m.label, m.title, ...(m.keywords || [])].join(' ')) })),
  };
}

function lev1(a, b) { // true when edit distance <= 1 (a swap of two neighbouring letters also counts)
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let k = 0;
  while (k < a.length && k < b.length && a[k] === b[k]) k++;
  if (a.length === b.length) {
    if (a.slice(k + 1) === b.slice(k + 1)) return true; // substitution
    return a[k] === b[k + 1] && a[k + 1] === b[k] && a.slice(k + 2) === b.slice(k + 2); // transposition
  }
  const [long, short] = a.length > b.length ? [a, b] : [b, a];
  return long.slice(k + 1) === short.slice(k); // insertion or deletion
}
function tokenScore(tok, text) {
  if (!text) return 0;
  if (text.includes(tok)) {
    return new RegExp('(^| )' + tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(text) ? 1 : 0.6;
  }
  if (tok.length >= 5) { for (const w of text.split(' ')) if (w.length >= 4 && lev1(tok, w)) return 0.45; }
  return 0;
}
function expand(tokens) {
  const out = new Map();
  tokens.forEach((t) => { out.set(t, 1); (SYN[t] || []).forEach((s) => { const n = normLatin(s); if (n && !out.has(n)) out.set(n, 0.5); }); });
  return out;
}

export const providers = [];
export function registerProvider(p) { providers.push(p); }

export function lexicalSearch(query) {
  if (!index) build();
  const q = String(query || '').trim();
  const empty = { entries: [], names: [], cats: [], emos: [], review: [] };
  if (!q) return empty;
  const arabic = hasArabic(q);
  const res = { ...empty };
  if (arabic) {
    const nq = normAr(q).replace(/[^؀-ۿ\s]/g, '').trim();
    if (!nq) return empty;
    res.entries = index.entries.filter(({ f }) => f.ar.includes(nq)).map(({ e, f }) => ({ e, score: 10 + (f.ar.startsWith(nq) ? 2 : 0) })).sort((a, b) => b.score - a.score);
    res.names = index.names.filter(({ f }) => f.ar.includes(nq)).map(({ n }) => ({ n, score: 10 }));
    return res;
  }
  const tokens = normLatin(q).split(' ').filter(Boolean);
  if (!tokens.length) return empty;
  const ex = expand(tokens);
  const plain = [...ex.entries()];
  res.entries = index.entries.map(({ e, f }) => {
    let total = 0, matched = 0;
    for (const [tok, w] of plain) {
      let best = 0;
      for (const k in W) best = Math.max(best, tokenScore(tok, f[k]) * W[k] * w);
      if (w === 1) { if (best > 0) matched++; }
      total += best;
    }
    const need = Math.max(1, Math.ceil(tokens.length * 0.6));
    if (matched < need && total < 6) return null;
    if (e.kind === 'guidance') total *= 0.8;
    return { e, score: total + matched * 2 };
  }).filter(Boolean).sort((a, b) => b.score - a.score);
  res.names = index.names.map(({ n, f }) => {
    let s = 0; for (const t of tokens) s += Math.max(tokenScore(t, f.tl) * 5, tokenScore(t, f.en) * 4, tokenScore(t, f.ur) * 3, tokenScore(t, f.ex));
    return s >= 3 ? { n, score: s } : null;
  }).filter(Boolean).sort((a, b) => b.score - a.score);
  const catScore = (text) => tokens.reduce((s, t) => s + (tokenScore(t, text) > 0 ? 1 : 0), 0) + [...ex.keys()].filter((k) => !tokens.includes(k) && text.includes(k)).length * 0.3;
  res.cats = index.cats.map(({ c, f }) => ({ c, score: catScore(f) })).filter((x) => x.score >= 1).sort((a, b) => b.score - a.score);
  res.emos = index.emos.map(({ m, f }) => ({ m, score: catScore(f) })).filter((x) => x.score >= 1).sort((a, b) => b.score - a.score);
  // Items that exist in the review queue but are not published
  res.review = D.review.filter((r) => r.status !== 'EXCLUDED').filter((r) => {
    const hay = normLatin([r.title, ...(r.keywords || [])].join(' '));
    return tokens.some((t) => t.length > 2 && hay.includes(t)) || [...ex.keys()].some((k) => k.length > 3 && hay.includes(k));
  });
  return res;
}

export function search(query) {
  const base = lexicalSearch(query);
  // Future semantic providers can add scored ids here.
  for (const p of providers) {
    try { (p.search(query, { D }) || []).forEach((hit) => { const e = D.byId[hit.id]; if (e && !base.entries.some((x) => x.e.id === e.id)) base.entries.push({ e, score: hit.score }); }); } catch (_) { /* provider failure never breaks search */ }
  }
  return base;
}
