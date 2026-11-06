# Content review process

## Published only when
1. Arabic matches the Tanzil Uthmani Quran text or the Sahih al-Bukhari / Sahih Muslim dataset (consonant-skeleton match, shown as-is from the dataset).
2. The surah:ayah or hadith number is independently confirmed (`content/reference-checks.json`, with evidence URLs).
3. Hadith duas come only from the two Sahih collections.

## Not yet done (needs a human)
- **Scholar review of every English, Roman Urdu and transliteration text.** All are marked `translation_status: draft`, `scholar_review: pending`.
- **99 Names list** (`data/names.json` → `meta.review_notes`): list membership and some Quran references are flagged.
- Wording notes on h-zulm, h-khatiah, h-aslamtu and q-2-201's Muslim 2690 reference (wording differs from dataset; hidden or noted).

## Review queue (`content/review-queue.json`)
Items from Abu Dawud, Tirmidhi, Ibn Majah, Ahmad etc. Each needs: exact Arabic, reference, grading by a named scholar. Then move into `content/hadith-duas.json` and rebuild. EXCLUDED items stay out.

## Corrections
The About page has a form that prepares a report text (no server). Hook it to email or an issue tracker when one exists.
