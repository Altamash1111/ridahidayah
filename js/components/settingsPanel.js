import { esc, $, $$ } from '../core/dom.js';
import { getSettings, setSettings, DEFAULT_SETTINGS } from '../core/store.js';

export function applySettings() {
  const s = getSettings(), r = document.documentElement;
  r.dataset.theme = s.theme;
  r.style.setProperty('--fs-ar', s.sizes.ar + 'rem');
  r.style.setProperty('--fs-tr', s.sizes.tr + 'rem');
  r.style.setProperty('--fs-tl', s.sizes.tl + 'rem');
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.content = { cream: '#F7F3EA', sand: '#E8DFCE', night: '#1D211C' }[s.theme];
}

let lastFocus = null;
export function closeSettings() { const r = document.getElementById('overlay-root'); r.innerHTML = ''; document.removeEventListener('keydown', onKey); lastFocus?.focus?.(); }
function onKey(e) { if (e.key === 'Escape') closeSettings(); }

export function openSettings() {
  lastFocus = document.activeElement;
  const s = getSettings();
  const layer = (k, l) => `<label class="opt"><input type="checkbox" data-layer="${k}" ${s.layers[k] ? 'checked' : ''}> ${l}</label>`;
  const size = (k, l, min, max, step) => `<label>${l} <output>${s.sizes[k]}</output>rem<input type="range" data-size="${k}" min="${min}" max="${max}" step="${step}" value="${s.sizes[k]}"></label>`;
  const theme = (k, l) => `<button type="button" class="chip" data-theme-set="${k}" aria-pressed="${s.theme === k}">${l}</button>`;
  const root = document.createElement('div');
  document.getElementById('overlay-root').replaceChildren(root);
  root.innerHTML = `<div class="modal-back" data-close><div class="panel" role="dialog" aria-modal="true" aria-labelledby="set-title">
    <div class="row" style="justify-content:space-between"><h2 id="set-title">Settings</h2><button type="button" class="icon-btn" data-close aria-label="Close settings">✕</button></div>
    <fieldset><legend>Languages shown on each dua</legend>
      <label class="opt"><input type="checkbox" data-layer="ar" ${s.layers.ar ? 'checked' : ''}> Arabic</label>
      ${layer('tr', 'Transliteration')}${layer('en', 'English')}${layer('ur', 'Roman Urdu')}
      <p class="note" id="layer-msg">At least one layer must stay on.</p></fieldset>
    <fieldset><legend>Text size</legend>${size('ar', 'Arabic', 1.4, 3.2, 0.1)}${size('tr', 'Transliteration', 0.85, 1.5, 0.05)}${size('tl', 'Translation', 0.9, 1.6, 0.05)}</fieldset>
    <fieldset><legend>Theme</legend><div class="seg">${theme('cream', 'Cream')}${theme('sand', 'Sand')}${theme('night', 'Night')}</div></fieldset>
    <div class="row"><button type="button" class="btn ghost small" data-reset>Reset to defaults</button><button type="button" class="btn small" data-close>Done</button></div>
    <p class="note" style="margin-top:14px">The site interface is in English. These switches choose which text layers appear on every dua. Settings are saved on this device only.</p></div></div>`;
  document.addEventListener('keydown', onKey);
  $('.panel button[data-close]', root)?.focus();
  const rerender = () => { applySettings(); window.dispatchEvent(new Event('rh:settings')); };
  root.addEventListener('click', (e) => { const c = e.target.closest('[data-close]'); if (c && (c === e.target || c.tagName === 'BUTTON')) closeSettings(); });
  root.addEventListener('change', (e) => {
    const t = e.target, cur = getSettings();
    if (t.dataset.layer) {
      const next = { ...cur.layers, [t.dataset.layer]: t.checked };
      if (!Object.values(next).some(Boolean)) { t.checked = true; $('#layer-msg').textContent = 'At least one layer must stay on.'; $('#layer-msg').style.color = 'var(--danger)'; return; }
      setSettings({ ...cur, layers: next }); rerender();
    }
  });
  root.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.size) { const cur = getSettings(); t.parentElement.querySelector('output').textContent = t.value; setSettings({ ...cur, sizes: { ...cur.sizes, [t.dataset.size]: parseFloat(t.value) } }); rerender(); }
  });
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-theme-set]');
    if (b) { const cur = getSettings(); setSettings({ ...cur, theme: b.dataset.themeSet }); $$('[data-theme-set]', root).forEach((x) => x.setAttribute('aria-pressed', x === b)); rerender(); }
    if (e.target.closest('[data-reset]')) { setSettings(structuredClone(DEFAULT_SETTINGS)); rerender(); openSettings(); }
  });
}
