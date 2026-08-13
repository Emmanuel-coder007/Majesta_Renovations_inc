# Majesta Renovations inc — website

Bilingual (FR/EN) marketing site for **Majesta Renovations inc**, an
RBQ-licensed residential and commercial renovation contractor based in
Saint-Laurent, Montreal.

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion ·
next-intl · React Hook Form + Zod · EmailJS.

---

## Before anything else — read this

Two things about this build are not what they'd normally be, and both are
intentional:

1. **Every photo on this site is a generated illustration, not a real
   project photo.** There was no existing Majesta website or photo library to
   pull from. See [public/images/CREDITS.md](public/images/CREDITS.md) and
   §5 below for how to swap them for the real thing.
2. **Several pieces of company data could not be verified** — email address,
   business hours, individual review text, founded year, team. Each shows a
   visible `TODO` in the UI instead of a guess. Full list, and exactly what to
   change to close each one, in [content/MISSING.md](content/MISSING.md).

Everything else — the company name, phone, address, RBQ licence number, the
5.0★/23-review rating, the 13 service categories, and the 5 service areas —
is the verified record, sourced 2026-08-13, and is read from
[content/site-data.json](content/site-data.json) rather than hardcoded
anywhere.

---

## Setup

```bash
npm install
npm run images   # generates public/images/*.webp — already committed, but
                  # re-run any time scripts/generate-images.mjs changes
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000> — it redirects to `/fr` (French is the default
locale; see "Why French is the default" below).

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical origin used for metadata, Open Graph, hreflang, sitemap.xml and robots.txt. Defaults to `http://localhost:3000`. |
| `NEXT_PUBLIC_EMAILJS_SERVICE_ID` | For email delivery | See [EMAILJS_SETUP.md](EMAILJS_SETUP.md). |
| `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID` | For email delivery | Same. |
| `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY` | For email delivery | Same. |
| `LEADS_DIR` | Optional | Where `/api/contact` writes its fallback lead log. Defaults to `./data`. Set to `/tmp/leads` on Vercel — see "Deploying to Vercel" below. |

The form works without the EmailJS variables set — see "Contact form &
leads" below.

### Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build (also type-checks and lints) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run images` | Regenerate every file in `public/images/` from `scripts/generate-images.mjs` |

---

## Project structure

```
content/
  site-data.json      verified company record + presentation data (single source of truth)
  MISSING.md           everything that could not be verified, and how to close each gap
  image-blur.json      generated LQIP data for next/image — do not hand-edit
messages/
  fr.json, en.json     all UI copy, 198 keys each, kept in 1:1 parity
scripts/
  generate-images.mjs  builds every file in public/images/ (see §5)
src/
  app/[locale]/         the actual pages — layout, home page, error/not-found, OG image
  app/api/contact/      server-side lead fallback (§4)
  components/sections/  one file per homepage section
  components/layout/    header, footer, language toggle
  components/ui/        buttons, form fields, reveal/scroll animation, stars, counters
  i18n/                 next-intl routing, navigation, request config
  lib/                  site.ts (typed data access), contact-schema.ts (Zod),
                         structured-data.ts (JSON-LD), metadata.ts
public/
  images/                generated illustrations + CREDITS.md
  icons/, logo/          favicons and the wordmark
```

`src/lib/site.ts` is the one place that reads `content/site-data.json`. It
also runs a small guard at module load — `assertServiceCatalogMatchesVerifiedList()`
— that fails the build if the 13-service presentation list and the verified
`services` array in the JSON ever drift apart. That's deliberate: it's the
kind of drift that's easy to introduce by editing one and not the other, and
easy to miss in review.

---

## 1. Bilingual routing (FR/EN)

Every route is prefixed: `/fr/...` and `/en/...`. There is no unprefixed
route — `localePrefix: 'always'` in
[`src/i18n/routing.ts`](src/i18n/routing.ts) — so the language in the URL is
never ambiguous to a visitor, a search engine, or a link shared in a text
message.

**French is the default locale**, not English. This isn't a coin flip: Quebec's
*Charter of the French Language* (Bill 96 amendments) requires commercial
websites serving Quebec to have French at least as prominent as any other
language, and Majesta operates entirely within Quebec. `/` redirects to
`/fr`, and `x-default` in the hreflang alternates points at `/fr`.

The FR/EN toggle in the header (`src/components/layout/language-toggle.tsx`)
switches locale on the **current path**, not back to the homepage — so
switching language mid-scroll on any page keeps you where you were.

Adding copy: every string lives in `messages/fr.json` and `messages/en.json`
with identical key structure. There's no automated CI check wired up for key
parity, but you can re-run the check used during this build:

```bash
node -e "
const fr=require('./messages/fr.json'), en=require('./messages/en.json');
const flat=(o,p='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'&&!Array.isArray(v)?flat(v,p+k+'.'):[p+k]);
const f=new Set(flat(fr)), e=new Set(flat(en));
console.log('missing in en:', [...f].filter(k=>!e.has(k)));
console.log('missing in fr:', [...e].filter(k=>!f.has(k)));
"
```

---

## 2. Design system

Tokens live in [`src/app/globals.css`](src/app/globals.css) under
Tailwind v4's `@theme` — dark charcoal/near-black base (`--color-ink*`), warm
off-white contrast sections (`--color-bone*`), one accent (`--color-accent`,
safety orange). Change the accent hex in one place and every button, focus
ring, icon chip and rating star follows.

Type: **Archivo** for display/headings, **Inter** for body — both via
`next/font/google`, self-hosted at build time (no runtime Google Fonts
request, no layout shift from a late font swap).

Motion: Framer Motion, with `useReducedMotion()` checked in every animated
component (`Hero`, `Reveal`, `Counter`, header drawer, lightbox, testimonial
carousel). When reduced motion is requested, animated components render the
final state directly rather than a shortened version of the animation —
parallax and autoplay are disabled outright, not just sped up.

---

## 3. Content model

[`content/site-data.json`](content/site-data.json) is one big typed object,
loaded through [`src/lib/site.ts`](src/lib/site.ts). Two layers:

- **Verified record** (`name`, `phone`, `address`, `license`, `rating`,
  `responseTime`, `services`, `serviceAreas`) — sourced 2026-08-13, must not
  be edited without re-verifying against the source.
- **Presentation layer** (`serviceCatalog`, `serviceAreaDetail`, `process`,
  `gallery`, `beforeAfter`, `testimonials`, `budgetRanges`,
  `contactMethods`) — built on top of the verified record, safe to restyle
  or reorder freely.

Localised strings are `{ en: "...", fr: "..." }` objects, read with
`t(value, locale)` from `src/lib/site.ts`.

---

## 4. Contact form & leads

Fields: name, email, phone, project postal code, service (populated from the
13 licensed categories), budget range, preferred contact method, project
description, preferred language. Validated client-side with React Hook Form +
Zod (`src/lib/contact-schema.ts`) — Canadian phone format, Quebec postal code
format, honeypot, length limits — and **re-validated server-side** with the
same schema, because client validation is UX, not a security boundary.

**Delivery has two independent paths, both attempted on every submit:**

1. **EmailJS**, straight from the browser, if the three
   `NEXT_PUBLIC_EMAILJS_*` variables are set — see
   [EMAILJS_SETUP.md](EMAILJS_SETUP.md).
2. **`POST /api/contact`**, always, regardless of whether EmailJS succeeded.
   It re-validates, checks a per-IP rate limit (3/minute), and appends the
   lead to `data/leads-YYYY-MM.jsonl` (JSON Lines — one submission per line,
   append-only, survives a crash mid-write).

This means an ad-blocker, a bad EmailJS key, or a network hiccup never loses
a lead silently — worst case, it lands only in the JSONL file and the
visitor sees "your request has been saved" instead of "sent", with the phone
number offered as a fallback. `data/` is gitignored (it holds customer PII);
review or export it directly, or wire something to tail it.

Rate limiting is layered: a soft 60-second client-side check
(`localStorage`) to stop accidental double-submits, and a real per-IP check
server-side. The server limiter is in-memory — see the comment in
[`src/app/api/contact/route.ts`](src/app/api/contact/route.ts) for why that's
fine for casual abuse but not a serverless-safe defence on its own; swap in
Upstash/Vercel Firewall/Cloudflare if you need the latter.

---

## 5. Swapping in real photography

Every image is a generated vector illustration — see
[public/images/CREDITS.md](public/images/CREDITS.md) for the full inventory
and rationale, and [content/MISSING.md](content/MISSING.md) §5.

To replace one:

1. Produce (or license) a real photo at roughly the same aspect ratio — 16:9
   for the two heroes and the CTA band, 4:3 or 3:4 for everything else (the
   exact target dimensions are in CREDITS.md).
2. Export it as `.webp` under the **same filename** into `public/images/`,
   overwriting the generated one.
3. Update the matching `alt` text in `content/site-data.json` — **in both
   `en` and `fr`** — to describe the real photo. The illustration's alt text
   describes an illustration; a real photo needs real alt text.
4. Do **not** re-run `npm run images` afterward — it regenerates the entire
   set from the vector scenes and would overwrite your real photo. Once every
   image in the manifest has been replaced, delete
   `scripts/generate-images.mjs` and the `images` script entry in
   `package.json` entirely.
5. Regenerate blur placeholders for whichever files you replaced — the
   simplest path is to add them back into the manifest in
   `scripts/generate-images.mjs` temporarily... or just delete their entry
   from `content/image-blur.json`; `next/image` falls back to no blur
   placeholder for a missing key rather than erroring.

The logo (`src/components/brand/logo.tsx`, plus the favicon set the image
script generates) is an original wordmark created for this project, since no
existing Majesta brand assets were found. Swap it out the same way if real
brand assets turn up.

---

## 6. Quality bar

- **Accessibility**: semantic landmarks, real `<label for>` on every form
  field with `aria-describedby` wiring to errors, keyboard-navigable
  lightbox/drawer/carousel (Radix Dialog under the hood), visible
  `:focus-visible` rings everywhere (never removed, only restyled),
  `prefers-reduced-motion` respected throughout, alt text on every image in
  both locales, the before/after comparison is a real `<input type="range">`
  under an invisible hit area so all the keyboard/touch/screen-reader
  behaviour comes from the platform rather than hand-rolled ARIA.
- **Images**: `next/image` everywhere, WebP source, blur placeholders
  generated per-file, `sizes` tuned per breakpoint, hero uses `priority` +
  `fetchPriority="high"`, everything else lazy-loads.
- **Metadata**: per-locale `<title>`/description/OG tags, hreflang
  alternates (`fr`, `en`, `x-default` → `fr`), canonical URLs,
  `sitemap.xml`, `robots.txt`, and an Open Graph image rendered per-locale at
  request time (`src/app/[locale]/opengraph-image.tsx`) so the share card
  text is real, localised text rather than a static PNG.
- **Structured data**: `GeneralContractor` JSON-LD
  (`src/lib/structured-data.ts`) built **only** from verified fields —
  `aggregateRating` 5.0/23, the five `areaServed` regions, the RBQ licence as
  a `hasCredential` entry. Fields in `content/MISSING.md` (email, hours) are
  omitted from the schema entirely rather than filled with a guess, because
  structured data gets repeated verbatim by search engines and assistants.

Verified in this build: `npm run build` completes with zero type errors and
zero lint errors; both `/fr` and `/en` return 200 and render fully (checked
via a local production server — see below); the 198 message keys in
`fr.json`/`en.json` are in exact 1:1 parity; phone, RBQ number and street
address in the rendered HTML match `content/site-data.json` exactly; no
`lorem ipsum` anywhere; `/api/contact` was exercised directly — happy path,
tripped honeypot, invalid payload, and rate-limit trip (429 after 3
requests/minute) all behave as designed, and a submitted lead was confirmed
written to the JSONL fallback file.

**Not verified in this environment**: an actual Lighthouse run (no browser
automation available here) and a from-source `@vercel/og` visual check.
Both are worth running once before launch:

```bash
npm run build && npm run start
# then, in a browser: DevTools → Lighthouse → run all four categories
# and open /fr/opengraph-image and /en/opengraph-image directly to eyeball them
```

Also worth a manual pass before launch: resize the browser to 375px, 768px
and 1440px and scan each section — the layout was built mobile-first with
those three breakpoints in mind, but nothing replaces actually looking.

---

## Deploying to Vercel

1. Push to GitHub, import the repo in Vercel.
2. Set environment variables in the Vercel project settings:
   `NEXT_PUBLIC_SITE_URL` (your production domain, no trailing slash),
   the three `NEXT_PUBLIC_EMAILJS_*` values, and `LEADS_DIR=/tmp/leads`.

   **Why `/tmp`**: Vercel's serverless filesystem is read-only except for
   `/tmp`, and `/tmp` is ephemeral — wiped between invocations/deploys. The
   JSONL fallback still works as a same-request safety net (nothing is lost
   between EmailJS failing and the response going out), but it is **not**
   durable storage on Vercel. For a production deployment, either:
   - keep EmailJS as the primary path and treat `/tmp` leads as a
     within-request safety net only, or
   - swap `persistLead()` in `src/app/api/contact/route.ts` for a real
     store — Vercel Postgres, a Google Sheet via API, Airtable, or even a
     webhook to Slack — anywhere durable.
3. Deploy. Vercel auto-detects Next.js; no build command changes needed.
4. After the first deploy, open the site and re-run the manual checks in
   "Quality bar" above against the real domain — in particular confirm the
   embedded Google Map and the RBQ verification link both resolve, since
   those depend on the live address matching what's on file with each
   service.

---

## Licence & content ownership

Site code: no licence declared — treat as proprietary to Majesta Renovations
inc unless told otherwise. Illustrations in `public/images/` are original,
AI-generated works created for this project (see CREDITS.md) with no
third-party or stock-photo material involved, and carry no external licence
obligation.
