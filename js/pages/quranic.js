import { D, sortKind } from '../core/data.js';
import { duaCard } from '../components/duaCard.js';
import { pageHead, reviewNotice } from '../components/tiles.js';
import { esc } from '../core/dom.js';

export function quranic({ query }) {
  const topic = query.topic || '';
  const all = D.entries.filter((e) => e.source_type === 'quran');
  const duas = all.filter((e) => e.kind === 'dua' && (!topic || (e.quran_topics || []).includes(topic)));
  const extra = all.filter((e) => e.kind !== 'dua' && (!topic || (e.quran_topics || []).includes(topic))).sort(sortKind);
  const chips = [`<a class="chip ${!topic ? 'on' : ''}" href="#/quranic">All</a>`, ...D.quranTopics.map((t) => `<a class="chip ${topic === t.slug ? 'on' : ''}" href="#/quranic?topic=${esc(t.slug)}" title="${esc(t.description)}">${esc(t.title)}</a>`)].join('');
  const html = pageHead('Quranic Duas', 'Supplications that Allah Himself recorded in the Quran. The Arabic is checked letter for letter against a standard Quran dataset and each surah and ayah reference is verified.', 'From the Quran') +
    `<section class="section"><div class="wrap">${reviewNotice()}<div style="height:18px"></div><div class="filters" role="group" aria-label="Filter by topic">${chips}</div>
    <p class="results-meta">${duas.length} ${duas.length === 1 ? 'dua' : 'duas'}${topic ? ' in “' + esc(D.quranTopics.find((t) => t.slug === topic)?.title || topic) + '”' : ''}</p>
    <div class="grid cols-2">${duas.map((e) => duaCard(e)).join('') || '<div class="empty">No Quranic duas for this topic.</div>'}</div>
    ${extra.length ? `<h2 style="margin-top:48px">Verses for remembrance and reflection</h2><p class="muted">Not duas in form, but widely recited for protection, comfort and peace.</p><div class="grid cols-2">${extra.map((e) => duaCard(e)).join('')}</div>` : ''}</div></section>`;
  return { title: 'Quranic Duas', html };
}
