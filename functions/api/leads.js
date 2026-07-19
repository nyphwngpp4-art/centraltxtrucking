// GET /api/leads - list stored repair requests, newest first.
//
// Auth: Authorization: Bearer <LEADS_TOKEN>. The token is a secret set on the
// Pages project; if it is missing, this endpoint refuses everything. The
// comparison is constant-time (both sides SHA-256 hashed before comparing)
// so the token cannot be probed byte by byte. Responses are never cached and
// never indexed. Nothing here logs lead contents.

export async function onRequest(context) {
  if (context.request.method === "GET") return handleGet(context);
  return new Response("Method not allowed", {
    status: 405,
    headers: { allow: "GET" },
  });
}

async function handleGet({ request, env }) {
  const authorized = await checkAuth(request, env);
  if (!authorized) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "www-authenticate": "Bearer",
        "cache-control": "no-store",
        "x-robots-tag": "noindex, nofollow",
      },
    });
  }

  if (!env.LEADS) {
    return json({ leads: [], error: "no KV binding" }, 500);
  }

  const list = await env.LEADS.list({ prefix: "lead:", limit: 100 });
  const leads = await Promise.all(
    list.keys.map(async k => {
      try {
        return JSON.parse(await env.LEADS.get(k.name));
      } catch {
        return { key: k.name, error: "unreadable" };
      }
    })
  );
  leads.sort((a, b) =>
    (b?.submittedAt || "").localeCompare(a?.submittedAt || "")
  );
  return json({ count: leads.length, leads });
}

async function checkAuth(request, env) {
  // Refuse everything when no token is configured: fail closed, never open.
  if (!env.LEADS_TOKEN || env.LEADS_TOKEN.length < 16) return false;

  const auth = request.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return false;
  const presented = auth.slice(7).trim();
  if (!presented) return false;

  const [a, b] = await Promise.all([
    sha256(presented),
    sha256(env.LEADS_TOKEN),
  ]);
  // Hashes are fixed-length, so a simple loop compares in constant time.
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function sha256(input) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input)
  );
  return new Uint8Array(digest);
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
