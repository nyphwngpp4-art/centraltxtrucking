# Owner-confirmation checklist

Every item below must be confirmed by the owner of Central Texas Truck &
Trailer Repair before this site launches publicly. Until then the site stays
in demo mode (noindex, "private website concept" marker, submissions routed
only to the developer).

## Facts shown on the page (verify or correct)

| # | Item | Where it appears | Current handling |
|---|------|------------------|------------------|
| 1 | Hours: Mon-Fri 8 AM-5:30 PM, weekends closed | Location section, footer, FAQ | Shown with a "call to confirm" caveat |
| 2 | Review attributions | Reviews section | CLOSED 2026-07-20: names verified against live Google listing screenshots (Kodie Scott, Russell Howard, Valerie Kroeker) |
| 3 | Services marked `data-confirm="pending"` in index.html: AC & heating, exhaust, floors & gates, fault code reading, sheet-metal fabrication, aluminum fabrication, inspections | Services section | Rendered in the concept; confirm or remove each before launch |
| 4 | Welding/fabrication FAQ answer | FAQ | Cautiously worded; confirm scope |

## Facts researched but NOT shown (need confirmation before ever publishing)

| # | Item | Status |
|---|------|--------|
| 5 | Started locally in 1998 | Public research only; not on the page |
| 6 | Ownership change in 2014 | Public research only; not on the page |
| 7 | Approximately six employees | Public research only; not on the page |

## Never claim without separate written confirmation

24/7 availability, towing, mobile roadside service, guaranteed response
times, a specific service radius, exact review counts or star ratings, BBB
accreditation, certifications, warranties.

## Assets needed from the owner

| # | Item | Notes |
|---|------|-------|
| 8 | Shop photography | Bays, heavy trucks, trailer brake/axle work, welding, aluminum fabrication, electrical, equipment, staff. Business-owned or owner-approved only; never AI-generated or stock presented as the shop's work |
| 9 | Optional hero video | Only if the owner wants it; large screens only, static image stays the default |
| 10 | Answer to "mobile or roadside service?" | FAQ currently says to call and confirm; replace with the owner's definitive answer |

## Launch-day technical flips (developer)

- Set `DEMO_MODE="false"` on the Pages project.
- Point lead delivery at the shop's chosen inbox/number (currently developer-only).
- Remove `noindex` meta tags, the `X-Robots-Tag` header line, and switch
  robots.txt to allow crawling.
- Replace the pages.dev canonical/OG URLs with the production domain.
- Remove the "private website concept" markers and the demo note on the form.
- Decide photo-upload policy (storage + deletion) before enabling any upload.
