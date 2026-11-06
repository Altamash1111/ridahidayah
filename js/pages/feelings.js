import { D, ids } from '../core/data.js';
import { duaCard } from '../components/duaCard.js';
import { emotionTile, pageHead, reviewNotice } from '../components/tiles.js';
import { esc } from '../core/dom.js';

export function feelings() {
  return { title: 'How are you feeling?', html: pageHead('How are you feeling?', 'Choose what is closest to your heart right now. There is no wrong answer.', 'Feelings') +
    `<section class="section"><div class="wrap"><div class="grid cols-3">${D.emotions.map(emotionTile).join('')}</div>
    <div class="callout care" style="margin-top:32px"><p>These pages offer words of remembrance and comfort from the Quran and Sunnah. They are not a substitute for professional care. If you are struggling, please also speak with someone you trust.</p></div></div></section>` };
}

export function feeling({ params }) {
  const m = D.emotionBySlug[params.slug];
  if (!m) return null;
  const sec = (title, list, cls = 'cols-2') => list.length ? `<section class="section ${title.startsWith('Guidance') ? 'alt' : ''}"><div class="wrap"><h2>${title}</h2><div class="grid ${cls}">${list.map((e) => duaCard(e)).join('')}</div></div></section>` : '';
  const html = `<div class="wrap" style="padding-top:20px"><nav class="crumbs"><a href="#/feelings">Feelings</a> › ${esc(m.label)}</nav></div>` +
    pageHead(m.title, '', m.emoji + ' ' + m.label) +
    `<div class="wrap" style="padding-top:8px">${m.intro.map((p) => `<p style="font-size:1.1rem;max-width:62ch">${esc(p)}</p>`).join('')}
    <div class="callout ${m.crisis ? 'crisis' : 'care'}" role="note"><p>${esc(m.care_note)}</p></div>${reviewNotice()}</div>` +
    sec('Verses to read slowly', ids(m.verses)) + sec('Quranic duas for this moment', ids(m.quran_duas)) + sec('Prophetic duas', ids(m.prophetic_duas)) + sec('Guidance from the Sunnah', ids(m.guidance)) +
    (m.extra ? `<section class="section"><div class="wrap"><div class="callout"><p><strong>${esc(m.extra.title)}.</strong> ${esc(m.extra.text)}</p></div></div></section>` : '') +
    `<section class="section alt"><div class="wrap"><h3>Other feelings</h3><div class="row">${D.emotions.filter((x) => x.slug !== m.slug).map((x) => `<a class="chip" href="#/feeling/${esc(x.slug)}">${esc(x.emoji)} ${esc(x.label)}</a>`).join('')}</div></div></section>`;
  return { title: m.title, html };
}
