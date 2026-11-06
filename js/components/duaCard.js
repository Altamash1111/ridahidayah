import { esc } from '../core/dom.js';
import { getSettings, isFav } from '../core/store.js';
import { sourceLabel } from '../core/data.js';
import { playingId } from '../core/audio.js';

const KIND = { dua: 'Dua', dhikr: 'Dhikr', verse: 'Verse', guidance: 'Guidance' };
const arabicOf = (e) => [].concat(e.arabic_parts?.length ? e.arabic_parts : e.arabic || []).join(' ');
export const arabicText = arabicOf;

export function plainText(e, parts = ['ar', 'tr', 'en', 'ur']) {
  const out = [];
  if (parts.includes('ar')) out.push(arabicOf(e));
  if (parts.includes('tr') && e.transliteration) out.push(e.transliteration);
  if (parts.includes('en') && e.english_translation) out.push(e.english_translation);
  if (parts.includes('ur') && e.roman_urdu_translation) out.push(e.roman_urdu_translation);
  out.push(`— ${sourceLabel(e)} (Rida Hidayah)`);
  return out.join('\n\n');
}

export function duaCard(e, { full = false, headingLevel = 3 } = {}) {
  const s = getSettings();
  const L = s.layers;
  const fav = isFav(e.id);
  const playing = playingId() === e.id;
  const hasAudio = !!(e.audio_urls?.length || e.audio_url);
  const H = `h${headingLevel}`;
  const grade = e.source_type === 'hadith' && e.authenticity_grade ? `<span class="badge sahih" title="${esc(e.grading_source || '')}">${esc(e.authenticity_grade)}</span>` : '';
  const rep = e.repetition ? `<p class="note">Reported repetition: ${esc(e.repetition)}${e.repetition_note ? ' — ' + esc(e.repetition_note) : ''}</p>` : '';
  const support = (e.supporting_hadith || []).filter((h) => h.shown);
  const more = [];
  if (e.explanation) more.push(`<p>${esc(e.explanation)}</p>`);
  if (e.context) more.push(`<p><strong>Context.</strong> ${esc(e.context)}</p>`);
  if (e.narrator) more.push(`<p><strong>Narrated by</strong> ${esc(e.narrator)}.</p>`);
  if (support.length) more.push(`<p><strong>Also reported in</strong> ${support.map((h) => `${esc(h.collection_name)} ${esc(h.number)}`).join('; ')}.</p>`);
  if (e.wording_note) more.push(`<p class="note">${esc(e.wording_note)}</p>`);
  if (e.grading_source) more.push(`<p class="note">${esc(e.grading_source)}</p>`);
  more.push(`<p class="note">Translations and transliteration are drafts awaiting scholar review. Please verify against the source before relying on them.</p>`);
  if (e.source_type === 'quran' && e.audio_source) more.push(`<p class="note">Recitation: ${esc(e.audio_source)}.</p>`);
  const copyBtns = [['ar', 'Arabic'], ['tr', 'Transliteration'], ['en', 'English'], ['ur', 'Roman Urdu'], ['all', 'All']]
    .filter(([k]) => k === 'all' || k === 'ar' || (k === 'tr' && e.transliteration) || (k === 'en' && e.english_translation) || (k === 'ur' && e.roman_urdu_translation))
    .map(([k, l]) => `<button type="button" data-act="copy" data-part="${k}" data-id="${esc(e.id)}" aria-label="Copy ${l}">${l}</button>`).join('');
  return `<article class="card dua" data-dua="${esc(e.id)}" id="dua-${esc(e.id)}">
  <div class="dua-head"><div><div class="badges"><span class="badge ${esc(e.source_type)}">${e.source_type === 'quran' ? 'Quran' : 'Hadith'}</span><span class="badge">${KIND[e.kind] || ''}</span>${grade}</div>
  <${H}><a href="#/dua/${encodeURIComponent(e.id)}">${esc(e.title)}</a></${H}></div>
  <button type="button" class="icon-btn" data-act="save" data-id="${esc(e.id)}" aria-pressed="${fav}" aria-label="${fav ? 'Remove from' : 'Save to'} My Collection">${fav ? '♥' : '♡'}<span>${fav ? 'Saved' : 'Save'}</span></button></div>
  ${L.ar ? `<p class="dua-ar ar" lang="ar" dir="rtl">${esc(arabicOf(e))}</p>` : ''}
  ${L.tr && e.transliteration ? `<p class="dua-tr"><span class="layer-label">Transliteration</span>${esc(e.transliteration)}</p>` : ''}
  ${L.en && e.english_translation ? `<p class="dua-en"><span class="layer-label">English</span>${esc(e.english_translation)}</p>` : ''}
  ${L.ur && e.roman_urdu_translation ? `<p class="dua-ur"><span class="layer-label">Roman Urdu</span>${esc(e.roman_urdu_translation)}</p>` : ''}
  <p class="dua-src">${esc(sourceLabel(e))}</p>
  ${rep}
  <div class="dua-actions">
    ${hasAudio
      ? `<button type="button" class="icon-btn" data-act="listen" data-id="${esc(e.id)}" aria-pressed="${playing}">${playing ? '■ Stop' : '▶ Listen'}</button>`
      : `<button type="button" class="icon-btn na" data-act="noaudio" aria-disabled="true" title="No verified recording is available for this Prophetic dua yet.">🔇 Audio not available</button>`}
    <button type="button" class="icon-btn" data-act="share" data-id="${esc(e.id)}">↗ Share</button>
  </div>
  <div class="copy-row"><span>Copy:</span>${copyBtns}</div>
  ${full ? `<div class="stack">${more.join('')}</div>` : `<details class="more"><summary>Meaning, context and source notes</summary><div class="body">${more.join('')}</div></details>`}
</article>`;
}

export const cardList = (list, opts) => list.length ? list.map((e) => duaCard(e, opts)).join('') : '';
