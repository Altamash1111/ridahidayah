import { D, entriesIn, sortKind } from '../core/data.js';
import { duaCard } from '../components/duaCard.js';
import { pageHead, empty, reviewNotice } from '../components/tiles.js';
import { esc } from '../core/dom.js';

export function category({ params }) {
  const c = D.catBySlug[params.slug];
  if (!c) return null;
  const list = entriesIn(c.slug).sort(sortKind);
  const queued = D.review.filter((r) => r.status !== 'EXCLUDED' && (r.categories || []).includes(c.slug));
  const group = D.groups.find((g) => g.slug === c.group);
  const html = `<div class="wrap" style="padding-top:20px"><nav class="crumbs" aria-label="Breadcrumb"><a href="#/explore">Explore Duas</a> › ${esc(group?.title || '')} › ${esc(c.title)}</nav></div>` + pageHead(c.title, c.description) +
    `<section class="section"><div class="wrap">${reviewNotice()}<div style="height:20px"></div>
    ${list.length ? `<p class="results-meta">${list.length} verified ${list.length === 1 ? 'entry' : 'entries'}</p><div class="grid cols-2">${list.map((e) => duaCard(e)).join('')}</div>` : empty('No verified entries in this category yet.')}
    ${queued.length ? `<div class="callout" style="margin-top:28px"><p><strong>Awaiting review (not shown).</strong> ${queued.length} more ${queued.length === 1 ? 'supplication is' : 'supplications are'} commonly cited for this topic but ${queued.length === 1 ? 'has' : 'have'} not yet had source and grading confirmed. <a href="#/review">See the review list</a>.</p></div>` : ''}
    </div></section>`;
  return { title: c.title, html };
}
