import { D, entriesIn, duaOfTheDay, randomEntry, ids } from '../core/data.js';
import { esc } from '../core/dom.js';
import { getFavs } from '../core/store.js';
import { duaCard } from '../components/duaCard.js';
import { catTile, emotionTile, empty, reviewNotice } from '../components/tiles.js';

const FEATURED = ['forgiveness', 'anxiety', 'distress-grief', 'rizq', 'protection-from-harm', 'healing', 'parents', 'guidance', 'gratitude', 'repentance', 'patience', 'family'];

export function home() {
  const dotd = duaOfTheDay();
  const rand = randomEntry(dotd.id);
  const cats = FEATURED.map((s) => D.catBySlug[s]).filter(Boolean);
  const quranic = D.pool.filter((e) => e.source_type === 'quran').slice(0, 40);
  const prophetic = D.pool.filter((e) => e.source_type === 'hadith');
  const pick = (arr, n, seed) => arr.map((e, i) => [e, (i * 7919 + seed) % arr.length]).sort((a, b) => a[1] - b[1]).slice(0, n).map((x) => x[0]);
  const seed = new Date().getDate();
  const saved = ids(getFavs()).slice(0, 3);
  const nm = D.names[(new Date().getDate() + new Date().getMonth() * 3) % D.names.length];
  const html = `
<section class="hero"><div class="wrap">
  <p class="bismillah" lang="ar" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
  <p class="salam">Assalamu Alaikum.</p>
  <h1>Whatever your heart is carrying, turn to Allah.</h1>
  <p class="tag">Find peace. Seek guidance. Remember Allah.</p>
  <form class="searchbar" role="search" id="hero-search"><label class="sr" for="hq">What is in your heart today?</label>
    <input id="hq" class="field" type="search" name="q" placeholder="What is in your heart today?" autocomplete="off"><button class="btn" type="submit">Search</button></form>
  <div class="actions"><a class="btn" href="#/explore">Explore Duas</a><a class="btn ghost" href="#/feelings">How Are You Feeling?</a></div>
</div></section>

<section class="section"><div class="wrap">
  <div class="section-head"><div><div class="eyebrow">Browse</div><h2>Find a dua by need</h2></div><a href="#/explore">All categories →</a></div>
  <div class="grid cols-4">${cats.map((c) => catTile(c, entriesIn(c.slug).length)).join('')}</div></div></section>

<section class="section alt"><div class="wrap">
  <div class="section-head"><div><div class="eyebrow">Feelings</div><h2>How are you feeling today?</h2></div><p>Choose what is closest. Each page gathers verses, duas and guidance for that state.</p></div>
  <div class="grid cols-4">${D.emotions.map(emotionTile).join('')}</div></div></section>

<section class="section"><div class="wrap">
  <div class="section-head"><div><div class="eyebrow">Today</div><h2>Dua of the Day</h2></div><p>Changes each day at midnight, on this device’s clock.</p></div>
  <div class="dotd"><div>${duaCard(dotd)}</div>
    <div class="stack"><div class="card"><div class="eyebrow">One Dua for Your Heart</div><p class="muted">Take a moment. Here is another dua, chosen at random.</p><div id="random-slot">${duaCard(rand)}</div><div class="row" style="margin-top:14px"><button type="button" class="btn ghost small" data-act="random">Discover Another Dua</button></div></div></div></div>
</div></section>

<section class="section alt"><div class="wrap">
  <div class="section-head"><div><div class="eyebrow">Remembrance</div><h2>Daily Adhkar</h2></div><a href="#/adhkar">Open the adhkar tracker →</a></div>
  <div class="grid cols-3">${D.adhkar.filter((g) => ['morning', 'evening', 'before-sleep', 'after-salah', 'waking', 'travelling'].includes(g.slug)).map((g) => `<a class="tile" href="#/adhkar/${esc(g.slug)}"><h3>${esc(g.title)}</h3><p>${esc(g.description)}</p><span class="count">${g.entries.length} ${g.entries.length === 1 ? 'item' : 'items'}</span></a>`).join('')}</div></div></section>

<section class="section"><div class="wrap">
  <div class="section-head"><div><div class="eyebrow">From the Quran</div><h2>Quranic duas</h2></div><a href="#/quranic">All Quranic duas →</a></div>
  <div class="grid cols-2">${pick(quranic, 2, seed).map((e) => duaCard(e)).join('')}</div></div></section>

<section class="section alt"><div class="wrap">
  <div class="section-head"><div><div class="eyebrow">From the Sunnah</div><h2>Prophetic duas</h2></div><a href="#/prophetic">All Prophetic duas →</a></div>
  <p class="muted">Only supplications found in Sahih al-Bukhari or Sahih Muslim, with confirmed references, are shown.</p>
  <div class="grid cols-2">${pick(prophetic, 2, seed + 3).map((e) => duaCard(e)).join('')}</div></div></section>

<section class="section"><div class="wrap">
  <div class="section-head"><div><div class="eyebrow">Your saved duas</div><h2>Most saved by you</h2></div><a href="#/collection">My Collection →</a></div>
  ${saved.length ? `<div class="grid cols-2">${saved.map((e) => duaCard(e)).join('')}</div>` : empty('You have not saved any duas yet. Tap ♡ on any dua to keep it here. Saved duas stay on this device; nothing is sent anywhere.', '<p><a class="btn small" href="#/explore">Explore duas</a></p>')}
</div></section>

<section class="section alt"><div class="wrap">
  <div class="section-head"><div><div class="eyebrow">Asma ul Husna</div><h2>The 99 Names of Allah</h2></div><a href="#/names">See all names →</a></div>
  <div class="card" style="text-align:center"><p class="ar" lang="ar" style="font-size:2.6rem;text-align:center;margin:0">${esc(nm.arabic)}</p><h3 style="margin:.2em 0">${esc(nm.transliteration)}</h3><p class="muted" style="margin:0">${esc(nm.english)} · ${esc(nm.roman_urdu)}</p><p class="note" style="margin-top:14px">${esc(D.namesMeta.disclosure)}</p></div>
  <div style="margin-top:18px">${reviewNotice()}</div></div></section>`;
  return {
    title: '', html,
    mount(root) {
      root.querySelector('#hero-search').addEventListener('submit', (e) => { e.preventDefault(); const q = new FormData(e.target).get('q').trim(); location.hash = q ? `#/search?q=${encodeURIComponent(q)}` : '#/search'; });
    },
  };
}
