import { D, entriesIn, sourceLabel } from '../core/data.js';
import { duaCard } from '../components/duaCard.js';
import { esc } from '../core/dom.js';
import { pushRecent } from '../core/store.js';

export function duaPage({ params }) {
  const e = D.byId[params.id];
  if (!e) return null;
  pushRecent(e.id);
  const rel = new Map();
  (e.categories || []).forEach((c) => entriesIn(c).forEach((x) => { if (x.id !== e.id && x.kind !== 'guidance') rel.set(x.id, x); }));
  const related = [...rel.values()].slice(0, 4);
  const cats = (e.categories || []).map((c) => D.catBySlug[c]).filter(Boolean);
  return { title: e.title, html: `<div class="wrap" style="padding:20px 20px 0"><nav class="crumbs"><a href="#/explore">Explore</a> › ${esc(e.title)}</nav>
  <div style="max-width:820px;margin:0 auto">${duaCard(e, { full: true, headingLevel: 1 })}
  <p style="margin-top:16px" class="row">${cats.map((c) => `<a class="chip" href="#/category/${esc(c.slug)}">${esc(c.title)}</a>`).join('')}</p></div></div>
  ${related.length ? `<section class="section"><div class="wrap"><h2>Related</h2><div class="grid cols-2">${related.map((x) => duaCard(x)).join('')}</div></div></section>` : ''}` };
}
