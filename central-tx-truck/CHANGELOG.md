# Changelog — central-tx-truck

Git is unavailable on this machine (no Xcode CLT), so changes are logged here
commit-style instead. Pre-change snapshot: `sites/central-tx-truck.baseline-20260713/`.

## 2026-07-13 — pitch-ready pass (live demo prep)

**Wire breakdown form to a real backend**
- `functions/api/breakdown.js`: Cloudflare Pages Function accepting the form
  POST. Validates (name required; phone required, 7–15 digits loose), honeypot
  `company` field silently drops bots, forwards JSON to `env.N8N_WEBHOOK_URL`
  with `site: "central-tx-truck"` for multi-site reuse. Fetch clients get JSON;
  plain form posts get 303 → `/thanks.html` (success) or `/call-us.html`
  (failure) so the form works with JS disabled.
- `app.js`: fetch submission with success (`.is-sent`) and failure
  (`.is-error` → phone-number fallback) states; button disables while sending.
- `index.html`/`styles.css`: honeypot field, `.form-error` block with tel:
  link, `required` on name/phone.
- Verified locally end-to-end against a stand-in webhook: valid fetch POST
  200 + payload delivered; no-JS post 303→thanks; missing phone 422; honeypot
  fake-200 not forwarded; GET 405; webhook-down 502 → error state. Tap-to-success
  round trip proven in emulated 375px browser.

**Real reviews**
- Three operator-supplied verbatim Google reviews (typos preserved) replace the
  three review slots, attributed `[FIRST NAME] · Google review` pending names
  from the live listing. Rating line "4.8 ★ · 67 Google reviews" added
  (operator-verified 2026-07-13; earlier verification.md said 72 — reconfirm).

**ASK OWNER scrub (rendered page only — TODOs live on as HTML comments)**
- "Since [year]" stat removed; trustbar runs 3-up ≥600px via styles.css
  override (remove override when the stat returns).
- After-hours/towing slot removed; "Call during shop hours for the fastest
  response." stands alone.
- Hours now M–F 8 AM–5:30 PM (operator-verified vs NAPA's 8–5 — mention to
  owner), Sat–Sun: Closed. Body + footer.

**Gallery**
- Hidden via `hidden` attrs + `SHOW_GALLERY=false` in app.js (no empty frames,
  no-JS safe). Set flag true after pulling Facebook photos.

**Link presentation**
- OG/Twitter cards with absolute URLs; `assets/og.png` (1200×630, Agavi
  bone/ink/terracotta, Oswald) rendered via headless Chrome; `assets/favicon.svg`
  (CT monogram, steel/signal-orange) + `assets/apple-touch-icon.png`; canonical.

## 2026-07-13 (later) — n8n replaced with Cloudflare-native delivery

The n8n cloud workspace lapsed ("No active workspace"), so the webhook target
no longer exists. New pipeline, zero third-party services:

- **KV** (namespace `agavi-demo-leads`, binding `LEADS`): every valid
  submission stored durably. Read via `GET /api/leads` with
  `Authorization: Bearer <LEADS_TOKEN>` (token in `work/central-tx-truck/
  leads-token.txt`, never deployed) or `npx wrangler kv key list
  --namespace-id=133c5bcf661e492f8ebe93c2c4601d70`.
- **Email**: service-bound Worker `agavi-lead-mailer`
  (`shared/lead-mailer/`) sends each lead to agavi.aiconsulting@gmail.com
  (already-verified Email Routing destination) from leads@81precision.com —
  the account's only routing-enabled zone. agaviai.com was NOT touched: its
  MX is iCloud Mail and enabling Email Routing there would break it.
  Worker has no public URL (workers.dev disabled).
- **n8n stays optional**: setting `N8N_WEBHOOK_URL` in the Pages dashboard
  layers the forward back on, best-effort, no code change.
- Success = lead stored (or mailed if KV hiccups); both failing → the
  call-us fallback. Live-tested: submissions in KV, mailer confirmed sending.

## 2026-07-13 (later) — README/CHANGELOG public-exposure fix, fleet-wide

`/README.md` on every deployed demo site served the internal walk-in
checklist (pitch strategy, ASK-OWNER lists, candidate review quotes — and on
this site the owner's name, which claims-safety deliberately keeps off-page).
Fixed with a `_redirects` shadow (302 → /) on **all nine** sites; all
redeployed and verified 302 + homepage 200.

**Analytics**
- Cloudflare Web Analytics NOT yet active: wrangler's OAuth token lacks the RUM
  scope. Commented beacon snippet + instructions at the bottom of index.html
  (dashboard toggle is the one-click path).
