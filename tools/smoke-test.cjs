// Usage: python3 -m http.server 8123 & node tools/smoke-test.cjs
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8123/';
const fails = []; const ok = (c, m) => { if (!c) { fails.push(m); console.log('FAIL', m); } else console.log('ok  ', m); };
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto(BASE); await page.waitForSelector('.hero');
  const nav = await page.$$eval('.nav-links a', (a) => a.map((x) => x.getAttribute('href')));
  const routes = [...new Set(nav.concat(['#/about', '#/review', '#/adhkar/before-sleep', '#/adhkar/leaving-home', '#/quranic?topic=forgiveness', '#/prophetic?situation=sleep', '#/nope']))];
  for (const r of routes) { await page.goto(BASE + r); await page.waitForTimeout(150); const h = await page.$eval('main', (m) => m.innerText.length); ok(h > 30, `route ${r} renders`); }
  // every category + feeling + dua detail
  const data = await (await fetch(BASE + 'data/taxonomy.json')).json().catch(() => null);
  const tax = await page.evaluate(async () => (await fetch('data/taxonomy.json')).json());
  const emo = await page.evaluate(async () => (await fetch('data/emotions.json')).json());
  const ent = await page.evaluate(async () => (await fetch('data/entries.json')).json());
  for (const c of tax.categories) { await page.goto(BASE + '#/category/' + c.slug); const n = await page.$$eval('.dua', (x) => x.length); if (!n) ok(false, 'category ' + c.slug); }
  for (const m of (emo.emotions || emo)) { await page.goto(BASE + '#/feeling/' + m.slug); const n = await page.$$eval('.dua', (x) => x.length); ok(n > 0, 'feeling ' + m.slug + ' has ' + n); }
  for (const e of ent.filter((x) => x.verification_status === 'VERIFIED')) { await page.goto(BASE + '#/dua/' + e.id); const t = await page.$eval('main', (m) => m.innerText); if (!t.includes('Copy')) ok(false, 'dua page ' + e.id); }
  console.log('categories/duas checked');
  // hero search
  await page.goto(BASE); await page.fill('#hq', 'forgiveness'); await page.press('#hq', 'Enter'); await page.waitForSelector('.dua');
  ok((await page.$$eval('.dua', (x) => x.length)) > 0, 'hero search → results');
  for (const q of ['gham', 'maafi', 'sone se pehle', 'rizq', 'parents', 'ربنا', 'istighfar', 'anxeity', 'qarz', 'hopeless', 'afiyah']) {
    await page.goto(BASE + '#/search?q=' + encodeURIComponent(q)); await page.waitForTimeout(100);
    const n = await page.$$eval('.dua', (x) => x.length); const rv = await page.$$eval('.callout', (x) => x.length);
    ok(n > 0 || rv > 0, `search "${q}" → ${n} duas, ${rv} callouts`);
  }
  // favourites persistence
  await page.goto(BASE + '#/category/forgiveness'); await page.click('.dua [data-act="save"]');
  await page.reload(); await page.goto(BASE + '#/collection'); await page.waitForSelector('.dua');
  ok((await page.$$eval('.dua', (x) => x.length)) >= 1, 'favourite persists after reload');
  await page.click('.dua [data-act="save"]'); await page.waitForTimeout(150);
  ok((await page.$$eval('.empty', (x) => x.length)) === 1, 'unsave removes from collection');
  // copy
  await page.goto(BASE + '#/dua/h-istighfar'); await page.click('[data-act="copy"][data-part="en"]');
  ok((await page.evaluate(() => navigator.clipboard.readText())).includes('forgive'), 'copy English');
  // settings
  await page.click('.nav-links [data-act="settings"]'); await page.uncheck('[data-layer="en"]'); await page.uncheck('[data-layer="tr"]'); await page.click('[data-layer="ar"]');
  ok(await page.isChecked('[data-layer="ar"]'), 'last layer cannot be switched off');
  await page.check('[data-layer="ur"]'); await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  ok((await page.$$eval('.dua-ur', (x) => x.length)) >= 1 && (await page.$$eval('.dua-en', (x) => x.length)) === 0, 'layer toggles apply');
  await page.click('.nav-links [data-act="settings"]'); await page.click('[data-theme-set="night"]'); ok((await page.getAttribute('html', 'data-theme')) === 'night', 'night theme'); await page.click('[data-reset]'); await page.keyboard.press('Escape');
  // adhkar
  await page.goto(BASE + '#/adhkar/morning'); await page.click('[data-act="adhkar-plus"]'); await page.reload(); await page.waitForSelector('.counter');
  ok((await page.$eval('.counter .n', (n) => n.textContent)).trim().startsWith('1'), 'adhkar counter persists');
  // random + daily
  await page.goto(BASE); const before = await page.$eval('#random-slot [data-dua]', (e) => e.dataset.dua); await page.click('[data-act="random"]'); const after = await page.$eval('#random-slot [data-dua]', (e) => e.dataset.dua); ok(before !== after, 'random dua changes');
  // names
  await page.goto(BASE + '#/names'); await page.click('.name'); ok(!!(await page.$('.name-detail')), 'name detail opens'); await page.fill('#nq', 'rahman'); ok((await page.$$eval('.name:not([hidden])', (x) => x.length)) >= 1, 'names filter');
  // mobile
  const m = await browser.newContext({ viewport: { width: 375, height: 800 }, reducedMotion: 'reduce', isMobile: true, hasTouch: true }); const mp = await m.newPage();
  for (const r of ['#/', '#/explore', '#/feelings', '#/feeling/hopeless', '#/quranic', '#/prophetic', '#/adhkar', '#/names', '#/collection', '#/search?q=sad', '#/about', '#/review', '#/dua/q-2-201']) {
    await mp.goto(BASE + r); await mp.waitForTimeout(200);
    const o = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); ok(o <= 1, `mobile no overflow ${r} (${o})`);
  }
  await mp.goto(BASE); await mp.click('#menu-btn'); ok(await mp.isVisible('#drawer.open'), 'mobile menu opens'); await mp.click('#drawer a[href="#/feelings"]'); await mp.waitForSelector('.tile');
  await page.screenshot({ path: process.env.SHOTS ? process.env.SHOTS + '/x.png' : undefined }).catch(() => {});
  ok(errors.length === 0, 'no console/page errors ' + JSON.stringify(errors.slice(0, 5)));
  await browser.close(); console.log(fails.length ? `\n${fails.length} FAILED` : '\nALL PASSED'); process.exit(fails.length ? 1 : 0);
})();
