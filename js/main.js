import { loadData, D, duaOfTheDay, randomEntry } from './core/data.js';
import { route, resolve, setNotFound } from './core/router.js';
import { esc, toast, copyText, $ } from './core/dom.js';
import { toggleFav, onChange } from './core/store.js';
import * as audio from './core/audio.js';
import { renderNavbar, watchFavCount } from './components/navbar.js';
import { renderFooter } from './components/footer.js';
import { applySettings, openSettings } from './components/settingsPanel.js';
import { duaCard, plainText } from './components/duaCard.js';
import { home } from './pages/home.js';
import { explore } from './pages/explore.js';
import { category } from './pages/category.js';
import { feelings, feeling } from './pages/feelings.js';
import { quranic } from './pages/quranic.js';
import { prophetic } from './pages/prophetic.js';
import { adhkar } from './pages/adhkar.js';
import { names } from './pages/names.js';
import { collection } from './pages/collection.js';
import { searchPage } from './pages/search.js';
import { duaPage } from './pages/dua.js';
import { about } from './pages/about.js';
import { review, notFound } from './pages/review.js';

applySettings();
let mainRef = document.getElementById('main');
const main = mainRef;
let current = '/';

route('/', home); route('/explore', explore); route('/category/:slug', category);
route('/feelings', feelings); route('/feeling/:slug', feeling);
route('/quranic', quranic); route('/prophetic', prophetic);
route('/adhkar', adhkar); route('/adhkar/:slug', adhkar);
route('/names', names); route('/collection', collection); route('/search', searchPage);
route('/dua/:id', duaPage); route('/about', about); route('/about/report', about); route('/review', review);
setNotFound(notFound);

function render(keepScroll = false) {
  if (!D.ready) return; // data still loading; the initial render follows load
  const { handler, params, query, path } = resolve();
  current = path;
  const y = window.scrollY;
  let page;
  try { page = handler({ params, query, path }) || notFound(); } catch (err) { console.error(err); page = { title: 'Something went wrong', html: `<section class="section"><div class="wrap"><h1>Something went wrong</h1><p>Please go <a href="#/">home</a> and try again.</p></div></section>` }; }
  // clone the main node so page-level listeners never accumulate
  const fresh = mainRef.cloneNode(false);
  fresh.innerHTML = page.html;
  mainRef.replaceWith(fresh); mainRef = fresh;
  document.title = (page.title ? page.title + ' · ' : '') + 'Rida Hidayah';
  renderNavbar(path);
  page.mount?.(fresh);
  if (keepScroll) window.scrollTo(0, y); else if (!(path.endsWith('/report'))) { window.scrollTo(0, 0); fresh.focus({ preventScroll: true }); }
}

document.addEventListener('click', async (ev) => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act, entry = D.byId?.[b.dataset.id];
  if (act === 'save' && entry) { const on = toggleFav(entry.id); toast(on ? 'Saved to My Collection' : 'Removed from My Collection'); refreshCard(entry.id); }
  else if (act === 'copy' && entry) { const part = b.dataset.part; const ok = await copyText(plainText(entry, part === 'all' ? ['ar', 'tr', 'en', 'ur'] : [part])); toast(ok ? 'Copied' : 'Could not copy on this browser'); }
  else if (act === 'share' && entry) {
    const url = location.href.split('#')[0] + '#/dua/' + encodeURIComponent(entry.id);
    const text = plainText(entry, ['ar', 'en']);
    if (navigator.share) { try { await navigator.share({ title: entry.title, text, url }); return; } catch (e) { if (e.name === 'AbortError') return; } }
    toast((await copyText(text + '\n' + url)) ? 'Link and text copied' : 'Could not share on this browser');
  }
  else if (act === 'listen' && entry) audio.toggle(entry);
  else if (act === 'noaudio') toast('No verified recording is available for this Prophetic dua yet.');
  else if (act === 'random') { const slot = $('#random-slot'); if (slot) { const cur = slot.querySelector('[data-dua]')?.dataset.dua; slot.innerHTML = duaCard(randomEntry(cur)); } }
});
function refreshCard(id) {
  document.querySelectorAll(`[data-dua="${CSS.escape(id)}"]`).forEach((el) => { const open = el.querySelector('details')?.open; const t = document.createElement('div'); t.innerHTML = duaCard(D.byId[id], { full: !el.querySelector('details') }); const n = t.firstElementChild; if (open) n.querySelector('details').open = true; el.replaceWith(n); });
  if (current === '/collection') render(true);
}
audio.onAudio(() => document.querySelectorAll('[data-act="listen"]').forEach((b) => { const on = audio.playingId() === b.dataset.id; b.setAttribute('aria-pressed', on); b.textContent = on ? '■ Stop' : '▶ Listen'; }));
window.addEventListener('rh:settings', () => render(true));
window.addEventListener('hashchange', () => { audio.stop(); render(); });

(async () => {
  try {
    await loadData();
  } catch (e) {
    console.error(e);
    main.innerHTML = `<section class="section"><div class="wrap"><h1>Could not load the dua library</h1><p>Rida Hidayah loads its data files from the <code>data/</code> folder. If you opened index.html directly from disk, serve the folder instead, for example with <code>python3 -m http.server</code> and open http://localhost:8000.</p></div></section>`;
    return;
  }
  renderFooter(); watchFavCount(() => current);
  render();
})();
