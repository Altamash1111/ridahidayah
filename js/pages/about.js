import { esc, copyText, toast } from '../core/dom.js';
import { D } from '../core/data.js';
import { pageHead } from '../components/tiles.js';

export function about({ path }) {
  const r = D.report || {};
  const html = pageHead('About Rida Hidayah', 'A quiet place to turn to Allah. Built so that nothing is published unless it can be checked.', 'About') +
    `<section class="section"><div class="wrap" style="max-width:820px">
    <h2>What this site is</h2><p>Rida Hidayah (رِضَا هِدَايَة) gathers authentic Quranic and Prophetic supplications, remembrance and guidance, with Arabic, transliteration, English and Roman Urdu, organised by need and by feeling.</p>
    <h2>How we verify</h2><ol class="steps">
      <li><strong>Arabic text.</strong> Quranic text is matched to the Tanzil Uthmani text. Hadith text is matched to the Sahih al-Bukhari and Sahih Muslim datasets. Where wording differs between narrations we say so on the entry.</li>
      <li><strong>References.</strong> Surah:ayah and hadith numbers are confirmed independently against published sources, not only the dataset.</li>
      <li><strong>Grading.</strong> Prophetic duas are published only from the two Sahih collections. Supplications from other collections are held in the <a href="#/review">review list</a> until their grading is confirmed.</li>
      <li><strong>Translations.</strong> English, Roman Urdu and transliteration are currently <em>drafts</em> awaiting scholar review. Each dua says so.</li>
      <li><strong>Audio.</strong> Quranic recitation is by Mishary Alafasy via a public audio network. Prophetic duas have no verified recording, so no audio is offered. We do not use synthetic voices.</li></ol>
    <p><strong>Right now:</strong> ${r.verified ?? D.entries.length} of ${r.total ?? D.entries.length} entries are published (${D.entries.filter((e) => e.source_type === 'quran').length} Quranic, ${D.entries.filter((e) => e.source_type === 'hadith').length} Prophetic). ${D.review.filter((x) => x.status === 'REQUIRES REVIEW').length} items await review.</p>
    <h2>Scholar review</h2><p>The next step is human review by a qualified scholar of every translation and of the 99 Names list. Until then, please treat the English and Roman Urdu as drafts and consult a teacher for anything that matters.</p>
    <h2>Privacy</h2><p>No accounts, no tracking. Your saved duas, settings and adhkar progress are stored only in this browser.</p>
    <h2>Care</h2><p>This site offers remembrance and comfort. It is not medical or mental-health advice. In India, Tele-MANAS (14416) and the emergency number 112 are available if you are in crisis.</p>
    <h2 id="report">Report a correction</h2>
    <p>Spotted a wrong word, reference or translation? Describe it below. This is a static site with no server, so the form prepares a report you can copy and send to the site maintainer.</p>
    <form id="report-form" class="stack"><label>Dua or page<input class="field" name="where" placeholder="e.g. Sayyid al-Istighfar, or a link" required></label>
    <label>What is wrong, and what should it be?<textarea class="field" name="what" required></textarea></label>
    <label>Source or evidence (optional)<input class="field" name="src" placeholder="Book, edition, page or link"></label>
    <div class="row"><button class="btn" type="submit">Prepare report</button></div><pre id="report-out" class="note" style="white-space:pre-wrap" hidden></pre></form></div></section>`;
  return { title: 'About', html,
    mount(root) {
      if (path.endsWith('/report')) root.querySelector('#report').scrollIntoView();
      root.querySelector('#report-form').addEventListener('submit', async (e) => {
        e.preventDefault(); const f = new FormData(e.target);
        const t = `Rida Hidayah correction report\nPage: ${f.get('where')}\nIssue: ${f.get('what')}\nSource: ${f.get('src') || '—'}\nDate: ${new Date().toISOString().slice(0, 10)}`;
        const o = root.querySelector('#report-out'); o.hidden = false; o.textContent = t;
        toast((await copyText(t)) ? 'Report copied. Send it to the site maintainer.' : 'Report prepared below. Please copy it.');
      });
    } };
}
