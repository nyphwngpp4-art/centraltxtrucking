import { existsSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";

const mode = process.argv[2];
if (!new Set(["demo", "production"]).has(mode)) {
  console.error("Usage: node scripts/validate-launch.mjs <demo|production>");
  process.exit(2);
}

const requiredFiles = [
  "index.html",
  "thanks.html",
  "call-us.html",
  "styles.css",
  "app.js",
  "content.config.json",
  "OWNER-CONFIRMATION.md",
  "robots.txt",
  "sitemap.xml",
  "_headers",
  "_redirects",
  "assets/hero-schematic.svg",
  "functions/api/breakdown.js",
  "functions/api/leads.js",
];

const errors = [];
const fail = message => errors.push(message);
const read = path => readFileSync(path, "utf8");

for (const path of requiredFiles) {
  if (!existsSync(path)) fail(`Missing required file: ${path}`);
}

if (errors.length) finish();

const index = read("index.html");
const css = read("styles.css");
const robots = read("robots.txt");
const sitemap = read("sitemap.xml");
const headers = read("_headers");
const config = JSON.parse(read("content.config.json"));

if (existsSync("operations.html") || /\/operations/i.test(index + sitemap)) {
  fail("The internal operations proposal must not ship with the customer site.");
}

if (/data-confirm=["']pending["']/.test(index)) {
  fail("A pending owner claim is still rendered in index.html.");
}

const ids = [...index.matchAll(/\sid=["']([^"']+)["']/g)].map(match => match[1]);
for (const id of new Set(ids)) {
  if (ids.filter(candidate => candidate === id).length > 1) {
    fail(`Duplicate HTML id: ${id}`);
  }
}

if ((index.match(/<h1\b/g) || []).length !== 1) {
  fail("index.html must contain exactly one h1.");
}

const referenceSources = [
  ["index.html", index],
  ["thanks.html", read("thanks.html")],
  ["call-us.html", read("call-us.html")],
  ["styles.css", css],
];

for (const [sourcePath, source] of referenceSources) {
  const refs = [
    ...source.matchAll(/(?:href|src)=(?:"|')([^"'#]+)(?:"|')/g),
    ...source.matchAll(/url\((?:"|')?([^)'"#]+)(?:"|')?\)/g),
  ].map(match => match[1]);

  for (const ref of refs) {
    if (/^(?:https?:|tel:|mailto:|data:|\/api\/)/.test(ref)) continue;
    const clean = ref.split(/[?#]/)[0];
    const target = normalize(clean.startsWith("/")
      ? clean.slice(1)
      : join(dirname(sourcePath), clean));
    const candidates = [target, `${target}.html`, join(target, "index.html")];
    if (!candidates.some(existsSync)) {
      fail(`Broken local reference in ${sourcePath}: ${ref}`);
    }
  }
}

if (mode === "demo") {
  if (config.demo_mode !== true) fail("Demo validation requires demo_mode=true.");
  if (!/noindex, nofollow/.test(index)) fail("Demo index must remain noindex.");
  if (!/X-Robots-Tag:\s*noindex, nofollow/i.test(headers)) {
    fail("Demo headers must send X-Robots-Tag: noindex, nofollow.");
  }
  if (!/Disallow:\s*\//i.test(robots)) fail("Demo robots.txt must disallow crawling.");
}

if (mode === "production") {
  const domain = (process.env.PRODUCTION_DOMAIN || "").trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!domain) fail("Set PRODUCTION_DOMAIN before production validation.");
  if (config.demo_mode !== false) fail("Set content.config.json demo_mode=false.");

  const pending = [];
  const visit = (value, path = "content.config.json") => {
    if (Array.isArray(value)) return value.forEach((item, i) => visit(item, `${path}[${i}]`));
    if (!value || typeof value !== "object") return;
    if (value.status === "pending-owner") pending.push(path);
    for (const [key, child] of Object.entries(value)) visit(child, `${path}.${key}`);
  };
  visit(config);
  if (pending.length) fail(`Owner confirmations remain open: ${pending.join(", ")}`);

  const publicFiles = index + robots + sitemap + headers;
  if (/agavi-demo-central-tx-truck\.pages\.dev/i.test(publicFiles)) {
    fail("A demo pages.dev URL remains in a public production file.");
  }
  if (domain && !index.includes(domain)) fail("The production domain is missing from index.html metadata.");
  if (/noindex, nofollow/.test(index)) fail("Remove noindex from the production homepage.");
  if (/X-Robots-Tag:\s*noindex/i.test(headers)) fail("Remove the demo X-Robots-Tag header.");
  if (/Disallow:\s*\//i.test(robots)) fail("Production robots.txt still blocks the whole site.");
  if (/Private website concept|intake-demo-note/.test(index)) {
    fail("Demo language remains in the production homepage.");
  }
}

finish();

function finish() {
  if (errors.length) {
    console.error(`Validation failed (${mode}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(`Validation passed (${mode}).`);
}
