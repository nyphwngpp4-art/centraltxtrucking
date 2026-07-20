// POST /api/breakdown - repair request intake.
//
// Delivery order:
//   1. KV (binding LEADS)        - always; the durable record. A valid lead is
//                                  never lost as long as KV is up.
//   2. Email (binding MAILER)    - service-bound mailer Worker; in DEMO_MODE
//                                  this only ever reaches the site developer,
//                                  never the shop.
//   3. n8n (env N8N_WEBHOOK_URL) - optional forward, best-effort, non-fatal.
//
// DEMO_MODE (env, default ON): submissions are tagged demo and routed only to
// the developer's review inbox. Set DEMO_MODE="false" plus owner-approved
// delivery targets before launch. Nothing here logs personal information.
//
// GET /api/leads (sibling file) lists stored leads; requires LEADS_TOKEN.

const SITE = "central-tx-truck";

// Field allowlist with hard length limits. Anything not listed is dropped.
const TEXT_FIELDS = {
  name: 80,
  phone: 25,
  fleet: 120,
  unit_number: 40,
  make_model_year: 120,
  location: 160,
  gps: 64,
  fault_code: 40,
  description: 2000,
};

// Enum fields: any value outside the list is stored as "".
const ENUM_FIELDS = {
  service_type: ["shop", "mobile", "unsure"],
  unit_type: ["truck", "trailer", "both", "other"],
  safety: ["safe", "shoulder", "blocking", "not_roadside"],
  can_move: ["yes", "no", "unsure"],
  category: [
    "engine", "electrical", "brakes", "axles_suspension", "tires",
    "trailer_structure", "ac_heat", "welding_fab", "other",
  ],
  preferred_response: ["call", "text", "either"],
};

const RATE_LIMIT = { max: 8, windowSecs: 600 }; // 8 attempts / 10 min / IP

export async function onRequest(context) {
  if (context.request.method === "POST") return handlePost(context);
  return new Response("Method not allowed", {
    status: 405,
    headers: { allow: "POST" },
  });
}

async function handlePost({ request, env }) {
  const demoMode = env.DEMO_MODE !== "false"; // default: demo ON

  let raw;
  try {
    const type = request.headers.get("content-type") || "";
    if (type.includes("application/json")) {
      raw = await request.json();
      if (typeof raw !== "object" || raw === null) throw new Error("bad body");
    } else {
      raw = Object.fromEntries((await request.formData()).entries());
    }
  } catch {
    return respond(request, false, 400);
  }

  // Honeypot: real users never see the "website" field. Pretend success so
  // bots learn nothing; store and forward nothing.
  if (raw.website) {
    return respond(request, true, 200);
  }

  // Rate limit per IP via KV (best-effort: an unavailable KV never blocks a
  // stranded driver). The IP is hashed so no raw address is stored.
  if (env.LEADS) {
    try {
      const ip = request.headers.get("cf-connecting-ip") || "unknown";
      const ipKey = "rl:" + (await sha256hex(SITE + "|" + ip)).slice(0, 24);
      const seen = parseInt((await env.LEADS.get(ipKey)) || "0", 10);
      if (seen >= RATE_LIMIT.max) {
        return respond(request, false, 429);
      }
      await env.LEADS.put(ipKey, String(seen + 1), {
        expirationTtl: RATE_LIMIT.windowSecs,
      });
    } catch {}
  }

  // Structured validation: allowlist, trim, clamp lengths, check enums.
  const lead = { site: SITE, demo: demoMode };
  for (const [field, maxLen] of Object.entries(TEXT_FIELDS)) {
    lead[field] = String(raw[field] ?? "").trim().slice(0, maxLen);
  }
  for (const [field, allowed] of Object.entries(ENUM_FIELDS)) {
    const value = String(raw[field] ?? "").trim();
    lead[field] = allowed.includes(value) ? value : "";
  }

  const phoneDigits = lead.phone.replace(/\D/g, "");
  if (!lead.name || !lead.service_type || !lead.unit_type ||
      lead.description.length < 10 ||
      phoneDigits.length < 7 || phoneDigits.length > 15) {
    return respond(request, false, 422);
  }

  lead.submittedAt = new Date().toISOString();

  // 1. KV - the durable record.
  let stored = false;
  if (env.LEADS) {
    try {
      const key = `lead:${lead.submittedAt}:${crypto.randomUUID().slice(0, 8)}`;
      await env.LEADS.put(key, JSON.stringify(lead));
      stored = true;
    } catch {}
  }

  // 2. Email notification via the service-bound mailer Worker. The mailer's
  // destination is developer-controlled; in demo mode the subject is tagged
  // so test traffic is unmistakable.
  let mailed = false;
  if (env.MAILER) {
    try {
      const subjectTag = demoMode ? "[DEMO] " : "";
      const r = await env.MAILER.fetch("https://mailer/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          site: SITE,
          subject: `${subjectTag}Repair request - ${lead.name} (${lead.unit_type})`,
          text: formatLeadText(lead),
        }),
      });
      mailed = r.ok;
    } catch {}
  }

  // 3. Optional n8n forward - best-effort, never blocks success.
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

function formatLeadText(lead) {
  return [
    `New repair request from ${lead.site}${lead.demo ? " (DEMO MODE)" : ""}`,
    ``,
    `Name:        ${lead.name}`,
    `Phone:       ${lead.phone}`,
    `Service:     ${lead.service_type}`,
    `Fleet:       ${lead.fleet || "-"}`,
    `Unit #:      ${lead.unit_number || "-"}`,
    `Unit type:   ${lead.unit_type}`,
    `Make/model:  ${lead.make_model_year || "-"}`,
    `Location:    ${lead.location || "-"}`,
    `GPS:         ${lead.gps || "-"}`,
    `Safety:      ${lead.safety || "-"}`,
    `Can move:    ${lead.can_move || "-"}`,
    `Category:    ${lead.category || "-"}`,
    `Fault code:  ${lead.fault_code || "-"}`,
    `Response:    ${lead.preferred_response || "-"}`,
    ``,
    `Description:`,
    lead.description || "-",
    ``,
    `Submitted ${lead.submittedAt}`,
  ].join("\n");
}

async function sha256hex(input) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input)
  );
  return [...new Uint8Array(digest)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function respond(request, ok, status) {
  const accepts = request.headers.get("accept") || "";
  if (accepts.includes("application/json")) {
    return new Response(JSON.stringify({ ok }), {
      status: ok ? 200 : status,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
    });
  }
  // No-JS form post: redirect to a static confirmation page.
  const dest = ok ? "/thanks" : "/call-us";
  return new Response(null, { status: 303, headers: { location: dest } });
}
