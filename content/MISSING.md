# Unverified data — do not fabricate

Everything in this file is information the site *wants* but which could **not** be
verified from a public source as of **2026-08-13**. Nothing here has been invented to
fill the gap. Each item lists where it surfaces in the UI, how the code currently
behaves, and exactly what to do once the real value is known.

The rule this codebase follows: **an empty state is always preferable to a plausible
invention.** Do not close any item below by guessing.

---

## 1. Email address — `TODO_EMAIL`

**Status:** No email address is published for Majesta Renovations inc.

**In the code:** `content/site-data.json` → `unverified.email` is the literal string
`"TODO_EMAIL"`. It is read through `TODO_EMAIL` / `hasRealEmail()` in
[`src/lib/site.ts`](../src/lib/site.ts).

**In the UI:** the Contact section renders an amber `TODO` chip in place of the email
row instead of a `mailto:` link. `JSON-LD` omits the `email` property entirely rather
than emitting a placeholder. The contact form still collects the *visitor's* email —
that is unaffected.

**To close:** replace `unverified.email` with the real address. Every consumer keys off
`hasRealEmail()`, so the chip disappears, the `mailto:` link appears and the JSON-LD
property is emitted automatically. No component changes needed.

---

## 2. Business hours

**Status:** Unknown. No opening hours are published.

**In the code:** `unverified.hours` is `null`.

**In the UI:** the hours block in the Contact column is **omitted**, and a `TODO` chip
is rendered in its place so the gap is visible rather than silent. The
`openingHoursSpecification` property is omitted from the `GeneralContractor` JSON-LD —
an incorrect one would actively mislead someone deciding when to call. The verified
`responseTime` of 1–2 hours is shown instead, because that *is* sourced.

**To close:** set `unverified.hours` to an array of
`{ "days": ["Monday", ...], "opens": "07:00", "closes": "17:00" }` objects and extend
`buildOpeningHours()` in [`src/lib/structured-data.ts`](../src/lib/structured-data.ts).

---

## 3. Review text and reviewer names

**Status:** The **rating itself is real** — 5.0 from 23 reviews (Google / Duddus). The
individual review *bodies* and *reviewer names* were not available.

**In the code:** `testimonials` in `site-data.json` holds three entries flagged
`"__PLACEHOLDER__": true`, with `quote`, `author`, `location` and `date` all `null`.

**In the UI:** the testimonials carousel is **fully built and functional** — keyboard
navigation, autoplay with `prefers-reduced-motion` support, dot navigation, star
ratings. Because every seeded entry is a placeholder, each slide renders the empty
state: *"Reviews loading — paste real Google reviews here."* The aggregate 5.0 / 23
figure **is** shown, because it is verified.

> **Never ship invented quotes as real customer reviews.** Beyond being dishonest, in
> Quebec this is exposure under the *Consumer Protection Act* and the Competition
> Bureau's rules on testimonials.

**To close:** for each real review, replace the placeholder object with:

```json
{
  "id": "google-2026-03-marie",
  "rating": 5,
  "author": "Real Name From Google",
  "location": "Saint-Laurent",
  "date": "2026-03-14",
  "quote": {
    "fr": "Le texte exact de l'avis.",
    "en": "The exact review text."
  }
}
```

and **delete the `__PLACEHOLDER__` key**. That single deletion is what flips the slide
from the empty state to a real testimonial. If a review exists in only one language,
put the original text in that locale and leave the other `null` — the carousel falls
back to the available language and labels it, rather than machine-translating a quote
attributed to a named person.

---

## 4. Logo

**Status:** No existing logo or brand mark was found.

**What was done:** an original wordmark was drawn as vector — see
[`public/logo/`](../public/logo/). It is a geometric-sans "MAJESTA / RENOVATIONS"
lockup with a single accent rule, plus a standalone `M` mark for the favicon set.

**To close:** if the company has real brand assets, replace the files in
`public/logo/` keeping the same filenames and viewBox proportions, then re-run
`npm run images` to regenerate the favicon PNGs.

---

## 5. Project photography

**Status:** No real project photos exist. There was no prior website to pull from.

**What was done:** every file in `public/images/` is an **originally generated vector
illustration**, rasterised to WebP at the correct aspect ratio. They are deliberately
illustrative rather than photorealistic so that nobody mistakes them for photographs of
work Majesta actually completed. Full inventory in
[`public/images/CREDITS.md`](../public/images/CREDITS.md).

**To close:** see the "Swapping in real photography" section of the
[README](../README.md). Keep the filenames and aspect ratios and no code changes are
required; update the `alt` text in `site-data.json` to describe the real photo in both
locales.

---

## 6. Founded year, team members, social links

**Status:** All unknown.

**In the code:** `unverified.foundedYear`, `unverified.team`, `unverified.social`.

**In the UI:** the About section is written **only** from verifiable facts — RBQ
licensed (5870-0170-01), based in Saint-Laurent, serving five Montreal regions, rated
5.0 across 23 reviews. There is deliberately **no** "X years in business", **no** team
bios, **no** project counter and **no** social icon row. The animated stat counters show
only the three sourced numbers: the rating, the review count, and the 13 licensed
service categories.

**To close:** populate the fields. The footer social row and an About "since YYYY" line
are already conditioned on these values being non-empty.

---

## Verification log

| Field | Source | Verified |
| --- | --- | --- |
| Name, legal name, address | Company record | 2026-08-13 |
| Phone `(438) 886-1787` | Company record | 2026-08-13 |
| RBQ licence `5870-0170-01` | RBQ listing | 2026-08-13 |
| Rating 5.0 / 23 reviews | Google / Duddus | 2026-08-13 |
| Response time 1–2 hours | Company record | 2026-08-13 |
| 13 service categories | RBQ listing | 2026-08-13 |
| 5 service areas | Company record | 2026-08-13 |

Re-verify the RBQ licence before each production deploy — licences lapse, and an
expired number displayed as current is a real problem. Update
`license.verified` in `site-data.json` when you do.
