// POST /api/breakdown — breakdown-report intake.
//
// Delivery (2026-07-13, n8n workspace lapsed — Cloudflare-native now):
//   1. KV (binding LEADS)        — always; the durable record, a lead is never lost
//   2. Email (binding MAILER)    — service-bound agavi-lead-mailer Worker →
//                                  agavi.aiconsulting@gmail.com via Email Routing
//   3. n8n (env N8N_WEBHOOK_URL) — optional; layers back on by just setting the
//                                  env var in the Pages dashboard. Non-fatal.
// Success = the lead was captured somewhere durable (KV, or email if KV hiccups).
//
// GET /api/leads (sibling file) lists stored leads; requires LEADS_TOKEN.

const SITE = "central-tx-truck";

export async function onRequestPost(context) {
  const { request, env } = context;

  let fields;
  try {
    const type = request.headers.get("content-type") || "";
    if (type.includes("application/json")) {
      fields = await request.json();
    } else {
      fields = Object.fromEntries((await request.formData()).entries());
    }
  } catch {
    return respond(request, false, 400);
  }

  // Honeypot: real users never see the "company" field. Pretend success so
  // bots learn nothing.
  if (fields.company) {
    return respond(request, true, 200);
  }

  const name = (fields.name || "").toString().trim();
  const phone = (fields.phone || "").toString().trim();
  const phoneDigits = phone.replace(/\D/g, "");
  if (!name || phoneDigits.length < 7 || phoneDigits.length > 15) {
    return respond(request, false, 422);
  }

  const lead = {
    site: SITE,
    name,
    phone,
    unit: (fields.unit || "").toString().trim(),
    location: (fields.location || "").toString().trim(),
    problem: (fields.problem || "").toString().trim(),
    submittedAt: new Date().toISOString(),
    page: request.headers.get("referer") || "",
  };

  // 1. KV — the durable record
  let stored = false;
  if (env.LEADS) {
    try {
      const key = `lead:${lead.submittedAt}:${crypto.randomUUID().slice(0, 8)}`;
      await env.LEADS.put(key, JSON.stringify(lead));
      stored = true;
    } catch {}
  }

  // 2. Email notification via the service-bound mailer Worker
  let mailed = false;
  if (env.MAILER) {
    try {
      const r = await env.MAILER.fetch("https://mailer/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          site: SITE,
          subject: `Breakdown report — ${name} (${lead.unit || "unit n/a"})`,
          text: [
            `New breakdown report from ${SITE}`,
            ``,
            `Name:     ${name}`,
            `Phone:    ${phone}`,
            `Unit:     ${lead.unit || "-"}`,
            `Location: ${lead.location || "-"}`,
            `Problem:  ${lead.problem || "-"}`,
            ``,
            `Submitted ${lead.submittedAt}`,
          ].join("\n"),
        }),
      });
      mailed = r.ok;
    } catch {}
  }

  // 3. Optional n8n forward — best-effort, never blocks success
  if (env.N8N_WEBHOOK_URL) {
    try {
      await fetch(env.N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(lead),
        signal: AbortSignal.timeout(8000),
      });
    } catch {}
  }

  const ok = stored || mailed;
  return respond(request, ok, ok ? 200 : 503);
}

export async function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return new Response("Method not allowed", { status: 405 });
}

function respond(request, ok, status) {
  const accepts = request.headers.get("accept") || "";
  if (accepts.includes("application/json")) {
    return new Response(JSON.stringify({ ok }), {
      status: ok ? 200 : status,
      headers: { "content-type": "application/json" },
    });
  }
  // No-JS form post: redirect to a static confirmation page.
  const dest = ok ? "/thanks" : "/call-us";
  return new Response(null, { status: 303, headers: { Location: dest } });
}
