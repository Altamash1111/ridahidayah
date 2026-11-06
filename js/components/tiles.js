import { esc } from '../core/dom.js';
export const catTile = (c, n) => `<a class="tile" href="#/category/${esc(c.slug)}"><h3>${esc(c.title)}</h3><p>${esc(c.description || '')}</p><span class="count">${n} ${n === 1 ? 'entry' : 'entries'}</span></a>`;
export const emotionTile = (m) => `<a class="tile" href="#/feeling/${esc(m.slug)}"><span class="emoji" aria-hidden="true">${esc(m.emoji)}</span><h3>${esc(m.label)}</h3><p>${esc(m.title)}</p></a>`;
export const empty = (msg, cta = '') => `<div class="empty"><p>${msg}</p>${cta}</div>`;
export const pageHead = (title, lead = '', eyebrow = '') => `<section class="page-head"><div class="wrap">${eyebrow ? `<div class="eyebrow">${esc(eyebrow)}</div>` : ''}<h1>${esc(title)}</h1>${lead ? `<p>${esc(lead)}</p>` : ''}</div></section>`;
export const reviewNotice = () => `<p class="note">All English, Roman Urdu and transliteration texts are drafts awaiting scholar review. Arabic text is checked against standard datasets and references have been independently confirmed. <a href="#/about">How we verify</a>.</p>`;
