#!/usr/bin/env node
/**
 * Dev utility for reviewers: find where a phrase (or a content entry's Arabic) occurs in the
 * Sahih al-Bukhari / Sahih Muslim datasets, and show the closest hadith when there is no exact match.
 *
 *   node tools/find-hadith.mjs --entry h-istighfar
 *   node tools/find-hadith.mjs --collection muslim "اللهم إني أعوذ بك من"
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HADITH_DIR = process.env.HADITH_JSON || '/home/claude/ahmedbaset/hadith-json';
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const KEEP = /[بتثجحخدذرزسشصضطظعغفقكلمنه]/;
const skel = (s) => [...s.normalize('NFC').replace(/[ةۃۀ]/g, 'ه')].filter((c) => KEEP.test(c)).join('');
const files = {
  bukhari: path.join(HADITH_DIR, 'db/by_book/the_9_books/bukhari.json'),
  muslim: path.join(HADITH_DIR, 'db/by_book/the_9_books/muslim.json'),
};

const args = process.argv.slice(2);
let collections = ['bukhari', 'muslim'];
let phrases = [];
if (args[0] === '--entry') {
  const all = ['quran-duas', 'quran-verses', 'hadith-duas', 'guidance'].flatMap((f) => read(path.join(ROOT, 'content', f + '.json')));
  const e = all.find((x) => x.id === args[1]);
  if (!e) { console.error('no such entry'); process.exit(1); }
  phrases = Array.isArray(e.arabic) ? e.arabic : [e.arabic];
  collections = (e.hadith_refs || []).map((r) => r.collection);
} else {
  if (args[0] === '--collection') { collections = [args[1]]; args.splice(0, 2); }
  phrases = [args.join(' ')];
}

for (const col of collections) {
  const d = read(files[col]);
  const chapters = Object.fromEntries(d.chapters.map((c) => [c.id, c.english]));
  console.log(`\n=== ${col} ===`);
  for (const phrase of phrases) {
    const words = phrase.trim().split(/\s+/);
    const chunks = [];
    for (let i = 0; i + 2 < words.length + 1; i += 2) chunks.push(skel(words.slice(i, i + 3).join(' ')));
    const scored = d.hadiths.map((h) => {
      const s = skel(h.arabic);
      return { h, hits: chunks.filter((c) => c.length > 4 && s.includes(c)).length, exact: s.includes(skel(phrase)) };
    }).filter((x) => x.hits > 0).sort((a, b) => b.hits - a.hits).slice(0, 2);
    console.log(`phrase: ${phrase.slice(0, 70)}…  (${chunks.length} chunks)`);
    for (const x of scored) {
      console.log(` - dataset id ${x.h.id} | ${chapters[x.h.chapterId]} | exact:${x.exact} | chunks matched ${x.hits}/${chunks.length}`);
      if (!x.exact) console.log('   ' + x.h.arabic.replace(/\s+/g, ' ').slice(0, 900));
    }
    if (!scored.length) console.log(' (no similar hadith found)');
  }
}
