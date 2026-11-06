import { search } from '../core/search.js';
import { duaCard } from '../components/duaCard.js';
import { emotionTile, catTile, pageHead } from '../components/tiles.js';
import { entriesIn } from '../core/data.js';
import { esc } from '../core/dom.js';

export function searchPage({ query }) {
  const q = (query.q || '').trim();
  const form = `<form class="searchbar" role="search" id="sf"><label class="sr" for="sq">Search duas</label><input id="sq" class="field" type="search" name="q" value="${esc(q)}" placeholder="Search in English, Arabic, transliteration or Roman Urdu" autocomplete="off"><button class="btn" type="submit">Search</button></form>`;
  let body = '';
  if (!q) {
    body = `<div class="empty"><p>Try “forgiveness”, “gham”, “rizq”, “sone se pehle”, “parents”, or paste Arabic words.</p><div class="row" style="justify-content:center">${['anxiety', 'maafi', 'rizq', 'sleep', 'parents', 'ربنا'].map((s) => `<a class="chip" href="#/search?q=${encodeURIComponent(s)}">${esc(s)}</a>`).join('')}</div></div>`;
  } else {
    const r = search(q);
    const n = r.entries.length + r.names.length + r.cats.length + r.emos.length;
    body = `<p class="results-meta">${r.entries.length} ${r.entries.length === 1 ? 'dua' : 'duas'} for “${esc(q)}”</p>`;
    if (r.emos.length) body += `<h2>Feelings</h2><div class="grid cols-4" style="margin-bottom:28px">${r.emos.slice(0, 4).map((x) => emotionTile(x.m)).join('')}</div>`;
    if (r.cats.length) body += `<h2>Categories</h2><div class="grid cols-4" style="margin-bottom:28px">${r.cats.slice(0, 4).map((x) => catTile(x.c, entriesIn(x.c.slug).length)).join('')}</div>`;
    if (r.names.length) body += `<h2>Names of Allah</h2><div class="row" style="margin-bottom:28px">${r.names.slice(0, 8).map((x) => `<a class="chip" href="#/names">${x.n.number}. ${esc(x.n.transliteration)} — ${esc(x.n.english)}</a>`).join('')}</div>`;
    if (r.entries.length) body += `<h2>Duas and verses</h2><div class="grid cols-2">${r.entries.slice(0, 30).map((x) => duaCard(x.e)).join('')}</div>${r.entries.length > 30 ? `<p class="muted">Showing the best 30 of ${r.entries.length}. Narrow your search to see others.</p>` : ''}`;
    if (r.review.length) body += `<div class="callout" style="margin-top:28px"><p><strong>Awaiting review (not shown):</strong></p><ul>${r.review.map((x) => `<li>${esc(x.title)} <span class="muted">— ${esc(x.claimed_source)}</span></li>`).join('')}</ul><p>These are commonly cited, but their text, reference or grading has not been confirmed yet. See the <a href="#/review">review list</a>.</p></div>`;
    if (!n && !r.review.length) body += `<div class="empty"><p>Nothing matched “${esc(q)}”. Try a simpler word, or browse <a href="#/explore">categories</a> or <a href="#/feelings">feelings</a>.</p></div>`;
  }
  return { title: q ? `Search: ${q}` : 'Search', html: pageHead('Search', '', '') + `<section class="section" style="padding-top:8px"><div class="wrap">${form}<div style="height:28px"></div>${body}</div></section>`,
    mount(root) { root.querySelector('#sf').addEventListener('submit', (e) => { e.preventDefault(); const v = new FormData(e.target).get('q').trim(); location.hash = v ? `#/search?q=${encodeURIComponent(v)}` : '#/search'; }); root.querySelector('#sq').focus({ preventScroll: true }); } };
}
