import { D } from '../core/data.js';
import { esc } from '../core/dom.js';
import { pageHead } from '../components/tiles.js';

export function review() {
  const rows = D.review.map((r) => `<tr><td><strong>${esc(r.title)}</strong></td><td>${esc(r.claimed_source)}</td><td><span class="badge">${esc(r.status)}</span></td><td>${esc(r.reason)}</td></tr>`).join('');
  return { title: 'Awaiting review', html: pageHead('Awaiting review', 'Supplications that circulate widely but are not published here yet, with the reason. Nothing on this list is presented as authentic.', 'Transparency') +
    `<section class="section"><div class="wrap"><div class="review-wrap"><table class="review-table"><thead><tr><th>Item</th><th>Commonly cited to</th><th>Status</th><th>Reason</th></tr></thead><tbody>${rows || '<tr><td colspan="4">Nothing is waiting.</td></tr>'}</tbody></table></div>
    <p class="note" style="margin-top:20px">REQUIRES REVIEW: text, reference or grading still to be confirmed. EXCLUDED: scholars regard it as weak, so it is not published.</p></div></section>` };
}
export function notFound() {
  return { title: 'Not found', html: pageHead('Page not found', 'That page does not exist or has moved.') + `<section class="section"><div class="wrap"><a class="btn" href="#/">Back to home</a> <a class="btn ghost" href="#/search">Search</a></div></section>` };
}
