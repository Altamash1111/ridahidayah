#!/usr/bin/env node
/**
 * Rida Hidayah — content build & verification tool.
 *
 * Reads hand-authored files in /content, checks every Arabic text against primary datasets
 * (Quran: Tanzil Uthmani text; Hadith: Sunnah.com-derived Bukhari & Muslim text), replaces the
 * authored Arabic with the dataset's exact wording (so diacritics come from the source, not from us),
 * derives verification status, and writes the published JSON into /data.
 *
 * Usage:
 *   QURAN_JSON=/path/to/quran-json HADITH_JSON=/path/to/hadith-json node tools/build-data.mjs
 *
 * The datasets are NOT shipped with the site; only the checked output in /data is.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QURAN_DIR = process.env.QURAN_JSON || '/home/claude/risan/quran-json';
const HADITH_DIR = process.env.HADITH_JSON || '/home/claude/ahmedbaset/hadith-json';
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const exists = (p) => fs.existsSync(p);

// ---------- datasets ----------
const quran = read(path.join(QURAN_DIR, 'data/tanzil/uthmani.json'));
const chapters = read(path.join(QURAN_DIR, 'data/tanzil/chapters.json')).chapters;
const ayahCounts = read(path.join(QURAN_DIR, 'data/audio/everyayah.json')).ayah_count;
const HADITH_FILES = {
  bukhari: path.join(HADITH_DIR, 'db/by_book/the_9_books/bukhari.json'),
  muslim: path.join(HADITH_DIR, 'db/by_book/the_9_books/muslim.json'),
};
const COLLECTION_NAMES = { bukhari: 'Sahih al-Bukhari', muslim: 'Sahih Muslim' };

// ---------- Arabic skeleton matching ----------
// Letters only; drops diacritics, punctuation, alef/waw/ya/hamza (spelling varies between Uthmani and
// standard orthography). Matching is word-boundary aligned so a short phrase cannot match mid-word.
const KEEP = /[بتثجحخدذرزسشصضطظعغفقكلمنه]/;
function skeleton(s) {
  s = s.normalize('NFC').replace(/[ةۃۀ]/g, 'ه').replace(/ک/g, 'ك');
  let out = '';
  for (const ch of s) if (KEEP.test(ch)) out += ch;
  return out;
}
function buildIndex(text) {
  const tokens = text.split(/\s+/).filter(Boolean);
  let skel = '';
  const map = [];
  tokens.forEach((t, i) => {
    for (const ch of skeleton(t)) { skel += ch; map.push(i); }
  });
  return { tokens, skel, map };
}
function snap(index, phrase) {
  const ps = skeleton(phrase);
  if (ps.length < 3) return null;
  let from = 0;
  while (true) {
    const pos = index.skel.indexOf(ps, from);
    if (pos < 0) return null;
    const end = pos + ps.length - 1;
    const startOk = pos === 0 || index.map[pos - 1] !== index.map[pos];
    const endOk = end === index.skel.length - 1 || index.map[end + 1] !== index.map[end];
    if (startOk && endOk) {
      const a = index.map[pos], b = index.map[end];
      return { text: index.tokens.slice(a, b + 1).join(' '), skeletonLength: ps.length };
    }
    from = pos + 1;
  }
}

// ---------- Quran helpers ----------
const ayahText = (s, a) => quran[String(s)]?.find((v) => v.verse === a)?.text ?? null;
const globalAyah = (s, a) => ayahCounts.slice(0, s - 1).reduce((x, y) => x + y, 0) + a;
const parseRef = (r) => { const [s, a] = r.split(':').map(Number); return { surah: s, ayah: a }; };
const AUDIO_BASE = 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/';

// ---------- Hadith index (lazy) ----------
const hadithIndexes = {};
const hadithChapters = {};
function hadithIndex(collection) {
  if (!hadithIndexes[collection]) {
    const d = read(HADITH_FILES[collection]);
    hadithIndexes[collection] = d.hadiths.map((h) => ({ id: h.id, index: buildIndex(h.arabic), h }));
    hadithChapters[collection] = Object.fromEntries(d.chapters.map((c) => [c.id, c.english]));
  }
  return hadithIndexes[collection];
}
function findInHadith(collection, phrase) {
  for (const h of hadithIndex(collection)) {
    const r = snap(h.index, phrase);
    if (r) return { ...r, datasetId: h.id, hadith: h.h };
  }
  return null;
}
// Reference-check queue: one row per cited (collection, number), for independent confirmation of the number.
const refQueue = {};
function queueRef(collection, number, entryId, found) {
  const key = `${collection}:${number}`;
  const row = (refQueue[key] ||= { key, collection, number, entry_ids: [], dataset_book: null, dataset_narrator: null, english_start: null, arabic_start: null });
  if (!row.entry_ids.includes(entryId)) row.entry_ids.push(entryId);
  if (found && !row.english_start) {
    row.dataset_book = hadithChapters[collection]?.[found.hadith.chapterId] ?? null;
    row.dataset_narrator = found.hadith.english.narrator;
    row.english_start = found.hadith.english.text.replace(/\s+/g, ' ').slice(0, 260);
    row.arabic_start = found.snippet ?? null;
  }
}

// ---------- inputs ----------
const CONTENT_FILES = ['quran-duas.json', 'quran-verses.json', 'hadith-duas.json', 'guidance.json'];
const raw = CONTENT_FILES.flatMap((f) => read(path.join(ROOT, 'content', f)));
const refChecksPath = path.join(ROOT, 'content/reference-checks.json');
const refChecks = exists(refChecksPath) ? read(refChecksPath) : {};
const unwrap = (d, key) => (Array.isArray(d) ? d : d[key]);
const taxonomy = read(path.join(ROOT, 'data/taxonomy.json'));
const categories = taxonomy.categories;
const emotions = unwrap(read(path.join(ROOT, 'data/emotions.json')), 'emotions');
const adhkarGroups = unwrap(read(path.join(ROOT, 'data/adhkar-groups.json')), 'groups');
const categorySlugs = new Set(categories.map((c) => c.slug));
const topicSlugs = new Set(taxonomy.quran_topics.map((t) => t.slug));
const situationSlugs = new Set(taxonomy.situations.map((t) => t.slug));

const problems = [];
const warn = (id, msg) => problems.push({ id, level: 'warn', msg });
const fail = (id, msg) => problems.push({ id, level: 'error', msg });
const seen = new Set();

const emotionsByEntry = {};
for (const e of emotions) {
  for (const key of ['quran_verses', 'quran_duas', 'prophetic_duas', 'guidance']) {
    for (const id of e[key] || []) (emotionsByEntry[id] ||= new Set()).add(e.slug);
  }
}
const adhkarByEntry = {};
for (const g of adhkarGroups) for (const id of g.entries) (adhkarByEntry[id] ||= []).push(g.slug);

const refKey = (r) => `${r.collection}:${r.number}`;
const refStatus = (r) => refChecks[refKey(r)]?.status || 'unchecked';

// ---------- process ----------
const out = [];
for (const e of raw) {
  if (seen.has(e.id)) fail(e.id, 'duplicate id');
  seen.add(e.id);
  for (const k of ['title', 'transliteration', 'english_translation', 'roman_urdu_translation', 'explanation'])
    if (!e[k]) fail(e.id, `missing ${k}`);
  for (const c of e.categories || []) if (!categorySlugs.has(c)) fail(e.id, `unknown category ${c}`);
  for (const t of e.quran_topics || []) if (!topicSlugs.has(t)) fail(e.id, `unknown quran topic ${t}`);
  const situations = e.situations || (e.situation ? [e.situation] : []);
  for (const s of situations) if (!situationSlugs.has(s)) fail(e.id, `unknown situation ${s}`);

  const parts = Array.isArray(e.arabic) ? e.arabic : [e.arabic];
  const isQuran = Array.isArray(e.quran_refs) && e.quran_refs.length > 0;
  const entry = { ...e };
  delete entry.situation;
  entry.situations = situations;
  entry.source_type = isQuran ? 'quran' : 'hadith';
  const verification = { text: 'unchecked', reference: 'unchecked', notes: [] };

  if (isQuran) {
    const refs = e.quran_refs.map(parseRef);
    const joined = refs.map((r) => ayahText(r.surah, r.ayah)).join(' ');
    if (refs.some((r) => !ayahText(r.surah, r.ayah))) fail(e.id, 'quran ref not found in dataset');
    const idx = buildIndex(joined);
    const snapped = parts.map((p) => snap(idx, p));
    if (snapped.every(Boolean)) {
      entry.arabic_parts = snapped.map((s) => s.text);
      entry.arabic = entry.arabic_parts.join('\n');
      verification.text = 'matched-quran-dataset';
      const covered = snapped.reduce((n, s) => n + s.skeletonLength, 0);
      entry.audio_partial = covered < idx.skel.length - 2;
      // Count-of-words sanity check against the authored text
      const authoredWords = parts.join(' ').trim().split(/\s+/).length;
      const snappedWords = entry.arabic_parts.join(' ').split(/\s+/).length;
      if (Math.abs(authoredWords - snappedWords) > 1) verification.notes.push(`word count differs (authored ${authoredWords}, dataset ${snappedWords})`);
    } else {
      verification.text = 'NOT-FOUND-in-quran-dataset';
      fail(e.id, 'Arabic text not found in Quran dataset for the cited reference');
    }
    verification.reference = 'surah:ayah checked against dataset';
    entry.quran_refs = refs.map((r) => ({
      surah: r.surah, ayah: r.ayah,
      surah_name: chapters[r.surah - 1].transliteration, surah_name_ar: chapters[r.surah - 1].name,
    }));
    const first = entry.quran_refs[0], last = entry.quran_refs.at(-1);
    entry.surah_name = first.surah_name;
    entry.verse_number = first.surah === last.surah && first.ayah !== last.ayah
      ? `${first.surah}:${first.ayah}-${last.ayah}` : `${first.surah}:${first.ayah}`;
    entry.audio_urls = refs.map((r) => `${AUDIO_BASE}${globalAyah(r.surah, r.ayah)}.mp3`);
    entry.audio_source = 'Mishary Rashid Alafasy via the Islamic Network audio CDN (cdn.islamic.network)';
    entry.authenticity_grade = null;
    entry.grading_source = null;
  } else {
    const refs = e.hadith_refs || [];
    if (!refs.length) fail(e.id, 'hadith entry without hadith_refs');
    const found = {};
    let snappedParts = null;
    for (const r of refs) {
      if (!HADITH_FILES[r.collection]) { fail(e.id, `unsupported collection ${r.collection}`); continue; }
      const res = parts.map((p) => findInHadith(r.collection, p));
      found[r.collection] = res.every(Boolean);
      if (res.every(Boolean) && !snappedParts) snappedParts = res.map((x) => x.text);
      if (res[0]) res[0].snippet = res[0].text;
      queueRef(r.collection, r.number, e.id, res[0] || null);
    }
    if (snappedParts) {
      entry.arabic_parts = snappedParts;
      entry.arabic = snappedParts.join('\n');
      verification.text = 'matched-hadith-dataset:' + Object.entries(found).filter(([, v]) => v).map(([k]) => k).join('+');
      const missing = Object.entries(found).filter(([, v]) => !v).map(([k]) => k);
      if (missing.length) verification.notes.push(`wording not found in ${missing.join(', ')} (may be a different wording in that collection)`);
    } else {
      verification.text = 'NOT-FOUND-in-hadith-dataset';
      fail(e.id, 'Arabic text not found in the cited hadith collection(s)');
    }
    const statuses = refs.map(refStatus);
    verification.reference = statuses.every((s) => s === 'confirmed') ? 'confirmed'
      : statuses.some((s) => s === 'mismatch') ? 'MISMATCH' : 'unconfirmed';
    entry.hadith_refs = refs.map((r) => ({
      ...r, collection_name: COLLECTION_NAMES[r.collection], status: refStatus(r),
    }));
    entry.hadith_collection = entry.hadith_refs.map((r) => r.collection_name).join(' / ');
    entry.hadith_reference = entry.hadith_refs.map((r) => r.number).join(' / ');
    const allSahihayn = refs.every((r) => r.collection === 'bukhari' || r.collection === 'muslim');
    entry.authenticity_grade = allSahihayn ? 'Sahih' : null;
    entry.grading_source = allSahihayn
      ? 'Reported in Sahih al-Bukhari and/or Sahih Muslim, the two collections whose compilers set authenticity as a condition of inclusion.'
      : null;
  }

  // supporting hadith (on Quranic entries): shown only when text and number are both confirmed
  if (e.supporting_hadith) {
    entry.supporting_hadith = e.supporting_hadith.map((s) => {
      const hit = findInHadith(s.collection, s.check_text);
      const textFound = !!hit;
      if (hit) hit.snippet = hit.text;
      queueRef(s.collection, s.number, e.id, hit);
      const status = refStatus(s);
      return {
        collection: s.collection, collection_name: COLLECTION_NAMES[s.collection], number: s.number,
        text_found: textFound, status, shown: textFound && status === 'confirmed',
      };
    });
    for (const s of entry.supporting_hadith) if (!s.text_found) warn(e.id, `supporting hadith ${s.collection}:${s.number} wording not found`);
  }

  // verification status
  let status = 'REQUIRES_REVIEW';
  const textOk = verification.text.startsWith('matched');
  if (isQuran) status = textOk ? 'VERIFIED' : 'REQUIRES_REVIEW';
  else status = textOk && verification.reference === 'confirmed' && entry.authenticity_grade === 'Sahih' ? 'VERIFIED' : 'REQUIRES_REVIEW';
  entry.verification_status = status;
  entry.verification = verification;
  entry.translation_status = 'draft';
  entry.scholar_review = 'pending';
  entry.emotions = [...(emotionsByEntry[e.id] || [])];
  entry.adhkar = adhkarByEntry[e.id] || [];
  entry.audio_url = entry.audio_urls?.[0] ?? null;
  delete entry.check_text;
  out.push(entry);
}

// taxonomy cross-checks
const ids = new Set(out.map((o) => o.id));
for (const [slug, set] of Object.entries(Object.fromEntries(emotions.map((e) => [e.slug, e]))))
  for (const k of ['quran_verses', 'quran_duas', 'prophetic_duas', 'guidance'])
    for (const id of set[k] || []) if (!ids.has(id)) fail(`emotion:${slug}`, `unknown entry ${id} in ${k}`);
for (const g of adhkarGroups) for (const id of g.entries) if (!ids.has(id)) fail(`adhkar:${g.slug}`, `unknown entry ${id}`);

// ---------- write ----------
fs.writeFileSync(path.join(ROOT, 'data/entries.json'), JSON.stringify(out, null, 1));
fs.writeFileSync(path.join(ROOT, 'content/reference-queue.json'), JSON.stringify(Object.values(refQueue), null, 1));
const summary = {
  generated: new Date().toISOString(),
  total: out.length,
  verified: out.filter((o) => o.verification_status === 'VERIFIED').length,
  requires_review: out.filter((o) => o.verification_status === 'REQUIRES_REVIEW').map((o) => ({
    id: o.id, text: o.verification.text, reference: o.verification.reference,
  })),
  problems,
};
// review queue: metadata only, never published as dua text
fs.writeFileSync(path.join(ROOT, 'data/review-queue.json'), JSON.stringify(JSON.parse(fs.readFileSync(path.join(ROOT, 'content/review-queue.json'), 'utf8')), null, 1));
fs.writeFileSync(path.join(ROOT, 'data/build-report.json'), JSON.stringify(summary, null, 1));

console.log(`entries: ${summary.total}  VERIFIED: ${summary.verified}  REQUIRES_REVIEW: ${summary.requires_review.length}`);
const errs = problems.filter((p) => p.level === 'error');
const warns = problems.filter((p) => p.level === 'warn');
errs.forEach((p) => console.log('ERROR', p.id, '-', p.msg));
warns.forEach((p) => console.log('warn ', p.id, '-', p.msg));
out.filter((o) => o.verification.notes.length).forEach((o) => console.log('note ', o.id, '-', o.verification.notes.join('; ')));
if (process.argv.includes('--strict') && errs.length) process.exit(1);
