import { D, entriesIn } from '../core/data.js';
import { catTile, pageHead } from '../components/tiles.js';

export function explore() {
  const html = pageHead('Explore Duas', 'Browse by what you need to ask Allah for. Every category lists only verified Quranic and Prophetic texts.', 'Categories') + `<section class="section"><div class="wrap">
  <div class="filters" role="group" aria-label="Filter categories"><label class="sr" for="cf">Filter categories</label><input id="cf" class="field" type="search" placeholder="Filter categories, e.g. rizq, parents, healing" style="max-width:420px"></div>
  ${D.groups.map((g) => { const cs = D.categories.filter((c) => c.group === g.slug); return `<div class="group" data-group><h2>${g.title}</h2><p class="muted">${g.description}</p><div class="grid cols-3" style="margin-bottom:34px">${cs.map((c) => `<div data-cat="${(c.title + ' ' + c.description + ' ' + c.slug).toLowerCase()}">${catTile(c, entriesIn(c.slug).length)}</div>`).join('')}</div></div>`; }).join('')}
  <p class="empty" id="cf-empty" hidden>No category matches. Try the <a href="#/search">full search</a>.</p></div></section>`;
  return {
    title: 'Explore Duas', html,
    mount(root) {
      const f = root.querySelector('#cf');
      f.addEventListener('input', () => {
        const q = f.value.trim().toLowerCase(); let any = false;
        root.querySelectorAll('[data-cat]').forEach((n) => { const hit = !q || n.dataset.cat.includes(q); n.hidden = !hit; any ||= hit; });
        root.querySelectorAll('[data-group]').forEach((g) => { g.hidden = ![...g.querySelectorAll('[data-cat]')].some((n) => !n.hidden); });
        root.querySelector('#cf-empty').hidden = any;
      });
    },
  };
}
