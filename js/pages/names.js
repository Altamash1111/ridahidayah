import { D } from '../core/data.js';
import { pageHead } from '../components/tiles.js';
import { esc } from '../core/dom.js';
import { normLatin, normAr } from '../core/search.js';

export function names() {
  const m = D.namesMeta;
  const html = pageHead('The 99 Names of Allah', 'Asma ul Husna — “To Allah belong the most beautiful names, so call upon Him by them.” (Quran 7:180)', 'Asma ul Husna') +
    `<section class="section"><div class="wrap">
    <div class="callout"><p>${esc(m.disclosure)}</p></div>
    <details class="more" style="margin-bottom:20px"><summary>Review notes on this list (${m.review_notes?.length || 0})</summary><div class="body"><ul>${(m.review_notes || []).map((n) => `<li>${esc(n)}</li>`).join('')}</ul></div></details>
    <div class="filters"><label class="sr" for="nq">Filter names</label><input id="nq" type="search" class="field" placeholder="Filter by name or meaning, e.g. Rahman, mercy" style="max-width:420px"></div>
    <div class="names-grid" id="names-grid">${D.names.map((n) => `<button type="button" class="name" data-n="${n.number}" aria-expanded="false" data-q="${esc(normLatin([n.transliteration, n.english, n.roman_urdu].join(' ')) + ' ' + normAr(n.arabic))}"><span class="num">${n.number}</span><span class="ar" lang="ar">${esc(n.arabic)}</span><span class="tl">${esc(n.transliteration)}</span><span class="en">${esc(n.english)}</span></button>`).join('')}</div>
    <p class="empty" id="nq-empty" hidden>No name matches that.</p></div></section>`;
  return {
    title: '99 Names', html,
    mount(root) {
      const grid = root.querySelector('#names-grid');
      const close = () => { grid.querySelector('.name-detail')?.remove(); grid.querySelectorAll('.name[aria-expanded="true"]').forEach((b) => b.setAttribute('aria-expanded', 'false')); };
      grid.addEventListener('click', (e) => {
        const b = e.target.closest('.name'); if (!b) return;
        const was = b.getAttribute('aria-expanded') === 'true'; close(); if (was) return;
        const n = D.names[+b.dataset.n - 1];
        b.setAttribute('aria-expanded', 'true');
        const refs = (n.quran_refs || []).map((r) => `${r.surah}:${r.ayah}`).join(', ');
        const d = document.createElement('div'); d.className = 'card name-detail';
        d.innerHTML = `<h3>${n.number}. ${esc(n.transliteration)} — ${esc(n.english)}</h3><p class="ar" lang="ar" style="font-size:2.2rem;text-align:center">${esc(n.arabic)}</p><p><strong>Roman Urdu:</strong> ${esc(n.roman_urdu)}</p><p>${esc(n.explanation)}</p><p class="note">${refs ? 'Appears in the Quran at ' + esc(refs) + '.' : 'No Quran reference is given for this exact form; see the review notes.'} Draft translation, pending scholar review.</p>`;
        // insert after the last tile in the same visual row is complex; place after the button
        b.after(d); d.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
      root.querySelector('#nq').addEventListener('input', (e) => {
        close(); const q = normLatin(e.target.value), qa = normAr(e.target.value); let any = false;
        grid.querySelectorAll('.name').forEach((b) => { const hit = !q || b.dataset.q.includes(q) || (qa && b.dataset.q.includes(qa)); b.hidden = !hit; any ||= hit; });
        root.querySelector('#nq-empty').hidden = any;
      });
    },
  };
}
