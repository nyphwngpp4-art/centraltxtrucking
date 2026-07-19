# Central Texas Truck & Trailer Repair — demo site

Theme A (Industrial). Trade: heavy truck / trailer / diesel / fleet repair.
Hook: a 4.8-star, 72-review reputation currently monetized only by third-party
directories, with phone-only intake for high-value fleet/roadside work. The
centerpiece rebuilds that intake as a structured breakdown report so a
stranded driver (or dispatcher) can submit truck/trailer type, highway + mile
marker, and the problem without playing phone tag.

## Deploy

First time only (creates the Pages project):
```
npx wrangler pages project create agavi-demo-central-tx-truck --production-branch=main
```

Deploy / redeploy:
```
npx wrangler pages deploy sites/central-tx-truck --project-name=agavi-demo-central-tx-truck --commit-dirty=true
```

Live URL: https://agavi-demo-central-tx-truck.pages.dev
(deployment alias: https://28947f0c.agavi-demo-central-tx-truck.pages.dev)

## Variation lever picked

Per design-system §6, this slug is pre-assigned: **signal-orange accent +
hazard divider + header underbar**. Built to that assignment rather than
deviating, since it already reads distinctly against its Theme A siblings:

- vs. **muffler** (safety-yellow + bolt divider + plate wordmark): different
  accent color, different divider rhythm, different header treatment — three
  points of separation.
- vs. **glass & alignment** (signal-orange + blade divider + plain header):
  same accent, but the hazard-stripe divider (vs. glass's angled steel blade)
  and the header underbar (vs. glass's plain rule) keep the two orange sites
  from reading as clones. The hazard stripe specifically pulls in
  roadside/breakdown energy that fits this site's centerpiece; the blade cut
  reads more precision-shop, which fits glass/alignment instead.

## 2026-07-13 pitch-ready pass — current state

The page now shows **zero** visible placeholders (see CHANGELOG.md). The form
delivers leads via Cloudflare KV + email to agavi.aiconsulting@gmail.com — no
n8n needed (set `N8N_WEBHOOK_URL` later to layer it back on). Before launch:
fill the three `[FIRST NAME]` review attributions from the live Google
listing, get the founding year (restores the "Since" stat), flip
`SHOW_GALLERY` in app.js once Facebook photos are in, and enable Web
Analytics (snippet comment at the foot of index.html). The original checklist
below still lists who to ask for what.

## Walk-in checklist — placeholders to close before presenting

Count: **6 distinct placeholders** (9 instances on the page — some repeat in
footer/hours).

| # | Where on page | What it says | Ask who | Notes |
|---|---|---|---|---|
| 1 | Trust bar, "Since" stat | `ASK OWNER — year` | Owner/manager | Founding year not found in any research source. |
| 2 | Centerpiece aside | `ASK OWNER — after-hours / towing` | Owner/manager | Prospect data explicitly forbids claiming 24-hour or towing without confirmation. If they do offer either, this becomes a real trust-bar/service line; if not, remove the chip and keep "call during shop hours." |
| 3 | Hours block (body) + footer (repeats) | `Sat–Sun: ASK OWNER` | Owner/manager | Only Mon–Fri 8 AM–5 PM was corroborated (via NAPA AutoCare's certified-facility listing). Weekend hours unconfirmed — confirm before launch. |
| 4 | Gallery, 4 photo frames | `PHOTO — shop exterior & sign`, `PHOTO — engine bay repair in progress`, `PHOTO — trailer axle or brake work`, `PHOTO — shop bay & equipment` | Owner/manager or their Facebook page | Pull real photos from the business Facebook page (linked in Find Us) before presenting, or take new ones. |
| 5 | Reviews, 3 review-slot cards | "Paste one real Google or Facebook review here." | — | All three are labeled slots. No verbatim quotes ship this batch — prospect `verified_facts` only paraphrases ("review states customer would drive 100 miles to return"), which does not meet the claims-safety §2 bar for a real card. Before the walk-in, pull verbatim quotes + first names from the live Google/Facebook listing, or leave as visible slots — never fake them, never paraphrase-as-quote. |
| 6 | Trust bar "Reviews" stat is safe as-is (no numerals) but reputation should be spoken aloud in the pitch: "4.8 stars, 72 reviews on Google" — say it, don't print the number on the page. | — | Presenter | Not a page placeholder, just a pitch note. |

## Facts used, and why

- **Address / phone**: 2800 Virgil Gray Dr, Brownwood, TX 76801 / 325-643-6492
  — confirmed identical across 5+ independent sources in verification.md.
- **Reviews**: no verbatim quotes ship on the page. Prospect `verified_facts`
  supplies only a paraphrase ("review states customer would drive 100 miles to
  return"), not a supplied verbatim quote + first name, so per claims-safety §2
  every review card is a labeled slot. (An earlier draft placed Birdeye-scraped
  quotes attributed to "Jay" and "Russell" as real cards; these were reverted to
  slots during design review because the wording, names, and second quote were
  not in prospect data — presenting them as verbatim is the exact fabrication
  risk the ruleset forbids.)
- **No numerals** anywhere for star rating, review count, or Facebook likes —
  the 486-likes figure in prospects.json was flagged unverified in
  verification.md and is not displayed anywhere.
- **Owner name** (Richard/Richie Wondrash) is NOT published anywhere on the
  site — role is unconfirmed per verification.md, and prospects.json
  explicitly instructs withholding it.
- **No 24-hour or towing claim** anywhere — both are unverified per the task
  brief; the only place either is mentioned is the labeled `ASK OWNER`
  placeholder in the centerpiece aside.
- **Facebook link** in Find Us / footer points to the currently-active page
  (100054672540311) per verification.md's guidance to use that one over the
  legacy duplicate page.
- **Hours**: Mon–Fri 8 AM–5 PM is sourced from the NAPA AutoCare
  certified-facility listing (a real, checked source in verification.md).
  Weekend hours were not found anywhere and are placeholdered.

## Self-check performed

- Renders at 375px (single-column stack throughout; mobile sticky action bar
  present, hides at ≥860px per base.css).
- All phone instances use `tel:+13256436492` (6 instances, header/hero/
  centerpiece aside/hours/footer/action-bar) — matches 325-643-6492.
- Zero numerals for ratings, review counts, or percentages anywhere.
- Zero unlabeled placeholders — every ASK OWNER / review slot / photo slot
  carries a mono label and an HTML comment saying who to ask or where to pull
  from.
- Zero banned words (solutions, seamless, elevate, unparalleled, passion,
  cutting-edge) — checked via grep.
- Zero exclamation marks in visible copy (only appear inside `<!--` HTML
  comment syntax, not in rendered text).
- Footer credit present: "Site concept by Agavi AI · agaviai.com".
- No pricing anywhere on the page.
