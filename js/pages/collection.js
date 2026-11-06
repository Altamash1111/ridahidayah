import { D, ids } from '../core/data.js';
import { duaCard } from '../components/duaCard.js';
import { pageHead, empty } from '../components/tiles.js';
import { getFavs, getRecent, clearFavs, setFavs, adhkarDaysActive } from '../core/store.js';
import { toast, esc } from '../core/dom.js';

export function collection() {
  const saved = ids(getFavs()), recent = ids(getRecent()).filter((e) => !getFavs().includes(e.id)).slice(0, 4);
  const html = pageHead('My Collection', 'Your saved duas. They live only in this browser on this device; nothing is uploaded.', 'Saved') +
    `<section class="section"><div class="wrap">
    <div class="row" style="margin-bottom:20px"><span class="muted">${saved.length} saved · ${adhkarDaysActive()} adhkar days</span>
      <button type="button" class="btn ghost small" data-act="export" ${saved.length ? '' : 'disabled'}>Export</button>
      <label class="btn ghost small" style="cursor:pointer">Import<input type="file" accept="application/json" id="imp" hidden></label>
      <button type="button" class="btn ghost small" data-act="clear-favs" ${saved.length ? '' : 'disabled'}>Clear all</button></div>
    ${saved.length ? `<div class="grid cols-2">${saved.map((e) => duaCard(e)).join('')}</div>` : empty('Nothing saved yet. Tap ♡ on any dua to add it here.', '<p><a class="btn small" href="#/explore">Explore duas</a> <a class="btn ghost small" href="#/feelings">How are you feeling?</a></p>')}
    ${recent.length ? `<h2 style="margin-top:48px">Recently opened</h2><div class="grid cols-2">${recent.map((e) => duaCard(e)).join('')}</div>` : ''}</div></section>`;
  return {
    title: 'My Collection', html,
    mount(root) {
      root.querySelector('[data-act="export"]')?.addEventListener('click', () => {
        const blob = new Blob([JSON.stringify({ app: 'rida-hidayah', saved: getFavs() }, null, 1)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'rida-hidayah-saved.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500);
      });
      root.querySelector('[data-act="clear-favs"]')?.addEventListener('click', () => { if (confirm('Remove all saved duas from this device?')) { clearFavs(); window.dispatchEvent(new HashChangeEvent('hashchange')); } });
      root.querySelector('#imp').addEventListener('change', async (e) => {
        try {
          const f = e.target.files[0]; if (!f) return;
          const j = JSON.parse(await f.text()); const list = (j.saved || []).filter((id) => D.byId[id]);
          if (!list.length) throw new Error('none');
          setFavs([...getFavs(), ...list]); toast(`Imported ${list.length} saved duas.`); window.dispatchEvent(new HashChangeEvent('hashchange'));
        } catch (_) { toast('That file could not be read as a Rida Hidayah export.'); }
      });
    },
  };
}
