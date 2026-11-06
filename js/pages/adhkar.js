import { D, ids } from '../core/data.js';
import { duaCard } from '../components/duaCard.js';
import { pageHead, reviewNotice } from '../components/tiles.js';
import { esc } from '../core/dom.js';
import { getAdhkar, bumpAdhkar, resetAdhkarToday, adhkarDaysActive } from '../core/store.js';

export const target = (e) => { const m = String(e.repetition || '').match(/\d+/); return m ? Math.max(1, parseInt(m[0], 10)) : 1; };

function body(group) {
  const list = ids(group.entries);
  const counts = getAdhkar();
  const total = list.reduce((s, e) => s + target(e), 0);
  const done = list.reduce((s, e) => s + Math.min(counts[e.id] || 0, target(e)), 0);
  const pct = total ? Math.round((done / total) * 100) : 0;
  const items = list.map((e) => { const t = target(e), n = Math.min(counts[e.id] || 0, t); return `<div class="adhkar-item" data-item="${esc(e.id)}">${duaCard(e)}
    <div class="counter ${n >= t ? 'done' : ''}"><button type="button" class="btn small" data-act="adhkar-plus" data-id="${esc(e.id)}" ${n >= t ? 'disabled' : ''}>${t > 1 ? 'Count +1' : 'Mark as done'}</button><span class="n" aria-live="polite">${n} / ${t}</span><button type="button" class="chip" data-act="adhkar-minus" data-id="${esc(e.id)}" ${n <= 0 ? 'disabled' : ''}>Undo</button></div></div>`; }).join('');
  return `<div class="card" style="margin-bottom:20px"><div class="row" style="justify-content:space-between"><strong>${esc(group.title)} — today</strong><span class="muted">${done} of ${total} done</span></div><div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Progress today"><i style="width:${pct}%"></i></div>
  <p class="note" style="margin-top:10px">Your progress is saved only on this device and resets each day. There are no streaks to lose and no leaderboards. Days you have practised: ${adhkarDaysActive()}.</p></div>
  ${group.pending_note ? `<div class="callout"><p>${esc(group.pending_note)} <a href="#/review">Review list</a></p></div>` : ''}
  ${list.length ? `<div class="grid cols-2">${items}</div>` : '<div class="empty">No verified items in this group yet.</div>'}
  <div style="margin-top:24px"><button type="button" class="btn ghost small" data-act="adhkar-reset">Reset today’s progress</button></div>`;
}

export function adhkar({ params }) {
  const slug = params.slug || 'morning';
  const group = D.adhkar.find((g) => g.slug === slug);
  if (!group) return null;
  const tabs = D.adhkar.map((g) => `<a class="chip ${g.slug === slug ? 'on' : ''}" href="#/adhkar/${esc(g.slug)}" ${g.slug === slug ? 'aria-current="page"' : ''}>${esc(g.title.replace(/ adhkar$/i, ''))}</a>`).join('');
  const html = pageHead('Daily Adhkar', 'Remembrance for the moments of your day. Tap to count as you recite; progress stays on your device.', 'Remembrance') +
    `<section class="section"><div class="wrap">${reviewNotice()}<div class="tabs" style="margin-top:18px" role="navigation" aria-label="Adhkar groups">${tabs}</div><p class="muted">${esc(group.description)}</p><div id="adhkar-body">${body(group)}</div></div></section>`;
  return {
    title: group.title, html,
    mount(root) {
      const rerender = () => { root.querySelector('#adhkar-body').innerHTML = body(group); };
      root.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act^="adhkar-"]'); if (!b) return;
        const act = b.dataset.act;
        if (act === 'adhkar-reset') { if (confirm('Reset today’s adhkar progress?')) { resetAdhkarToday(); rerender(); } return; }
        const entry = D.byId[b.dataset.id];
        bumpAdhkar(entry.id, target(entry), act === 'adhkar-plus' ? 1 : -1);
        const y = window.scrollY; rerender(); window.scrollTo(0, y);
      });
    },
  };
}
