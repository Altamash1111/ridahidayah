import { esc, $, $$ } from '../core/dom.js';
import { getFavs, onChange } from '../core/store.js';
import { openSettings } from './settingsPanel.js';

const LINKS = [['/', 'Home'], ['/explore', 'Explore Duas'], ['/feelings', 'Feelings'], ['/quranic', 'Quranic Duas'], ['/prophetic', 'Prophetic Duas'], ['/adhkar', 'Daily Adhkar'], ['/names', '99 Names'], ['/collection', 'My Collection'], ['/search', 'Search']];
function isCurrent(path, href) { return href === '/' ? path === '/' : path === href || path.startsWith(href + '/'); }

export function renderNavbar(path = '/') {
  const el = document.getElementById('site-header');
  const n = getFavs().length;
  const items = LINKS.map(([h, l]) => `<a href="#${h}" ${isCurrent(path, h) ? 'aria-current="page"' : ''}>${l}${h === '/collection' && n ? ` <span class="badge">${n}</span>` : ''}</a>`);
  el.innerHTML = `<div class="wrap"><nav class="nav" aria-label="Main">
    <a class="brand" href="#/" aria-label="Rida Hidayah home"><b>RIDA HIDAYAH</b><span lang="ar">رِضَا هِدَايَة</span></a>
    <div class="nav-links">${items.join('')}<button type="button" class="navbtn" data-act="settings" aria-haspopup="dialog">Language &amp; Settings</button></div>
    <button type="button" class="menu-btn" id="menu-btn" aria-expanded="false" aria-controls="drawer" aria-label="Open menu">☰</button></nav></div>
    <div class="drawer" id="drawer">${items.join('')}<button type="button" data-act="settings">Language &amp; Settings</button></div>`;
  const btn = $('#menu-btn'), dr = $('#drawer');
  btn.addEventListener('click', () => { const o = dr.classList.toggle('open'); btn.setAttribute('aria-expanded', o); btn.textContent = o ? '✕' : '☰'; btn.setAttribute('aria-label', o ? 'Close menu' : 'Open menu'); });
  $$('#drawer a').forEach((a) => a.addEventListener('click', () => { dr.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.textContent = '☰'; }));
  $$('[data-act="settings"]', el).forEach((b) => b.addEventListener('click', () => { dr.classList.remove('open'); openSettings(); }));
}
export function watchFavCount(getPath) { onChange((k) => { if (k === 'rh.favs') renderNavbar(getPath()); }); }
