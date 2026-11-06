import { D, sortKind } from '../core/data.js';
import { duaCard } from '../components/duaCard.js';
import { pageHead, reviewNotice } from '../components/tiles.js';
import { esc } from '../core/dom.js';

export function prophetic({ query }) {
  const sit = query.situation || '';
  const hs = D.entries.filter((e) => e.source_type === 'hadith');
  const list = hs.filter((e) => (e.kind === 'dua' || e.kind === 'dhikr') && (!sit || (e.situations || []).includes(sit)));
  const guide = hs.filter((e) => e.kind === 'guidance' && (!sit || (e.situations || []).includes(sit))).sort(sortKind);
  const chips = [`<a class="chip ${!sit ? 'on' : ''}" href="#/prophetic">All</a>`, ...D.situations.map((t) => `<a class="chip ${sit === t.slug ? 'on' : ''}" href="#/prophetic?situation=${esc(t.slug)}" title="${esc(t.description)}">${esc(t.title)}</a>`)].join('');
  const queued = D.review.filter((r) => r.status === 'REQUIRES REVIEW').length;
  const html = pageHead('Prophetic Duas', 'Supplications taught by the Prophet ﷺ. Only narrations found in Sahih al-Bukhari or Sahih Muslim, with the Arabic matched to a standard dataset and the reference independently confirmed, are published.', 'From the Sunnah') +
    `<section class="section"><div class="wrap">${reviewNotice()}
    <div class="callout" style="margin-top:16px"><p><strong>Why some familiar duas are missing.</strong> ${queued} commonly shared supplications come from other collections and are held in the <a href="#/review">review list</a> until their grading has been confirmed. We would rather leave something out than publish it unverified.</p></div>
    <div class="filters" role="group" aria-label="Filter by situation">${chips}</div>
    <p class="results-meta">${list.length} ${list.length === 1 ? 'supplication' : 'supplications'}</p>
    <div class="grid cols-2">${list.map((e) => duaCard(e)).join('') || '<div class="empty">Nothing verified for this situation yet.</div>'}</div>
    ${guide.length ? `<h2 style="margin-top:48px">Guidance from the Prophet ﷺ</h2><div class="grid cols-2">${guide.map((e) => duaCard(e)).join('')}</div>` : ''}</div></section>`;
  return { title: 'Prophetic Duas', html };
}
