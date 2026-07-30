/* Skrip sekali-pakai: memotret dashboard pembeli & admin pada viewport desktop
   untuk aset section "pengenalan dashboard" di landing page.
   Jalankan: node tools/screenshot-dashboards.mjs */
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const API = "http://localhost:3001/api/v1";

async function getToken(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login gagal untuk ${email}: ${res.status}`);
  const json = await res.json();
  return json.accessToken;
}

async function capture(browser, { token, path: url, out }) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce", // animasi entrance dilewati agar frame bersih
  });
  await ctx.addInitScript((t) => {
    window.localStorage.setItem("katalis_token", t);
  }, token);
  const page = await ctx.newPage();
  await page.goto(`${BASE}${url}`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: out });
  await ctx.close();
  console.log(`OK ${out}`);
}

const browser = await chromium
  .launch({ channel: "msedge" })
  .catch(() => chromium.launch({ channel: "chrome" }));

const userToken = await getToken("user@smartcatalog.test", "user123");
const adminToken = await getToken("admin@smartcatalog.test", "admin123");

await capture(browser, {
  token: userToken,
  path: "/dashboard",
  out: "public/showcase/dashboard-buyer.png",
});
await capture(browser, {
  token: adminToken,
  path: "/admin",
  out: "public/showcase/dashboard-admin.png",
});

await browser.close();
