# Central Texas Truck & Trailer Repair - private website concept

Static Cloudflare Pages site with Pages Functions for lead intake. This is a
demonstration prepared for owner review; it is not the business's live site.

## Layout

```
/                      index.html, operations.html, thanks.html, call-us.html
/styles.css, /app.js   single stylesheet + dependency-free JS
/assets/               images, favicon, self-hosted display font
/functions/api/        breakdown.js (POST intake), leads.js (GET, token-auth)
/scripts/              dependency-free launch validation
.github/workflows/     pull-request and main-branch quality gate
_headers, _redirects   security headers, noindex, internal-doc shadowing
robots.txt, sitemap.xml
content.config.json    confirmation ledger for customer-facing claims
OWNER-CONFIRMATION.md  checklist to close before launch
```

## Cloudflare configuration

- **KV binding `LEADS`** - durable lead storage plus rate-limit counters.
- **Service binding `MAILER`** (optional) - a mailer Worker that emails each
  lead to the developer's review inbox. In demo mode nothing goes to the shop.
- **Secret `LEADS_TOKEN`** (min 16 chars) - required by `GET /api/leads`.
  Endpoint fails closed when unset.
- **Env `DEMO_MODE`** - defaults ON. Set to `"false"` only at launch, after
  every item in OWNER-CONFIRMATION.md is closed.
- **Env `N8N_WEBHOOK_URL`** (optional) - best-effort JSON forward per lead.

## Demo safety (current state)

- `noindex, nofollow` via meta tags, `X-Robots-Tag` in `_headers`, and
  `Disallow: /` in robots.txt.
- "Private website concept" marker on every page.
- The form explicitly states test submissions are not sent to the shop, and
  the success state promises no callback and no dispatch.
- No photo upload (storage/deletion policies not configured yet).
- No claims of towing, roadside service, 24/7 coverage, response times,
  service radius, review counts, affiliations, certifications or warranties
  anywhere. The NAPA directory listing and roadside service are recorded in
  content.config.json as pending owner confirmation.

## Validate

```
npm run validate:demo
```

Production deployment must pass the stricter gate after all owner-confirmation
items are closed and the customer-facing files have been switched out of demo
mode:

```
PRODUCTION_DOMAIN=example.com npm run validate:production
```

## Deploy (demo project only)

```
npm run deploy:demo
```

Do not point a production domain at this project until the owner has approved
the concept and OWNER-CONFIRMATION.md is fully closed.
