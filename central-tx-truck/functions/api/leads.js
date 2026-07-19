// GET /api/leads — list stored breakdown reports, newest first.
// Auth: Authorization: Bearer <LEADS_TOKEN>  (secret set on the Pages project).

export async function onRequestGet({ request, env }) {
  const auth = request.headers.get("authorization") || "";
  if (!env.LEADS_TOKEN || auth !== `Bearer ${env.LEADS_TOKEN}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!env.LEADS) {
    return new Response(JSON.stringify({ leads: [], error: "no KV binding" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
  const list = await env.LEADS.list({ prefix: "lead:", limit: 100 });
  const leads = await Promise.all(
    list.keys.map(async k => {
      try { return JSON.parse(await env.LEADS.get(k.name)); }
      catch { return { key: k.name, error: "unreadable" }; }
    })
  );
  leads.sort((a, b) => (b?.submittedAt || "").localeCompare(a?.submittedAt || ""));
  return new Response(JSON.stringify({ count: leads.length, leads }, null, 2), {
    headers: { "content-type": "application/json" },
  });
}
