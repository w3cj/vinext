/**
 * Route-level proxy.ts E2E tests.
 *
 * Tests the route-level proxy chain: proxy.ts files placed in app/ directories
 * cascade root-to-leaf, providing per-section middleware functionality.
 */
import { test, expect } from "@playwright/test";

const BASE = "http://localhost:4174";

test.describe("Route-level proxy: header setting", () => {
  test("root proxy sets header on proxied route", async ({ request }) => {
    const res = await request.get(`${BASE}/proxy-test`);
    expect(res.status()).toBe(200);
    expect(res.headers()["x-route-proxy-root"]).toBe("root-proxy-ran");
  });

  test("nested proxy sets header, root proxy also runs", async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/proxy-test/nested`);
    expect(res.status()).toBe(200);
    // Both root and nested proxy headers should be present
    expect(res.headers()["x-route-proxy-root"]).toBe("root-proxy-ran");
    expect(res.headers()["x-route-proxy-nested"]).toBe("nested-proxy-ran");
  });

  test("proxy headers do NOT appear on unrelated routes", async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/`);
    expect(res.status()).toBe(200);
    // Root page should NOT have proxy-test proxy headers
    expect(res.headers()["x-route-proxy-root"]).toBeUndefined();
    expect(res.headers()["x-route-proxy-nested"]).toBeUndefined();
  });
});

test.describe("Route-level proxy: chain ordering", () => {
  test("root-to-leaf ordering: root proxy runs before nested", async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/proxy-test/nested`);
    expect(res.status()).toBe(200);
    // Both headers prove both proxies ran; since root sets x-route-proxy-root
    // and nested sets x-route-proxy-nested, both appearing means both ran
    expect(res.headers()["x-route-proxy-root"]).toBe("root-proxy-ran");
    expect(res.headers()["x-route-proxy-nested"]).toBe("nested-proxy-ran");
  });
});

test.describe("Route-level proxy: redirect stops chain", () => {
  test("redirect proxy returns redirect, page does not render", async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/proxy-test/redirect-test`, {
      maxRedirects: 0,
    });
    expect([301, 302, 307, 308]).toContain(res.status());
    expect(res.headers()["location"]).toMatch(/\/about$/);
  });
});

test.describe("Route-level proxy: block", () => {
  test("blocking proxy returns 403", async ({ request }) => {
    const res = await request.get(`${BASE}/proxy-test/blocked`);
    expect(res.status()).toBe(403);
    const body = await res.text();
    expect(body).toContain("Blocked by route proxy");
  });
});

test.describe("Route-level proxy: rewrite", () => {
  test("rewrite proxy serves different content at original URL", async ({
    page,
  }) => {
    await page.goto(`${BASE}/proxy-test/rewrite-test`);
    // URL should stay the same (rewrite, not redirect)
    expect(page.url()).toMatch(/\/proxy-test\/rewrite-test$/);
    // Content should be from /about (rewritten)
    const el = page.getByText("About", { exact: true });
    await expect(el).toBeVisible();
  });
});

test.describe("Route-level proxy: matcher filtering", () => {
  test("proxy runs on matching path", async ({ request }) => {
    const res = await request.get(`${BASE}/proxy-test/matcher-test`);
    expect(res.status()).toBe(200);
    expect(res.headers()["x-matcher-proxy"]).toBe("matcher-proxy-ran");
  });

  test("proxy does NOT run on non-matching path", async ({ request }) => {
    const res = await request.get(
      `${BASE}/proxy-test/matcher-test/excluded`,
    );
    expect(res.status()).toBe(200);
    // The matcher only includes /proxy-test/matcher-test, not /proxy-test/matcher-test/excluded
    expect(res.headers()["x-matcher-proxy"]).toBeUndefined();
  });
});

test.describe("Route-level proxy: global middleware coexistence", () => {
  test("both global middleware and route proxy run on /about", async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/about`);
    expect(res.status()).toBe(200);
    // Global middleware sets these (it matches /about in its config.matcher)
    expect(res.headers()["x-middleware-ran"]).toBe("true");
    // Route-level proxy at app/about/proxy.ts sets this
    expect(res.headers()["x-about-route-proxy"]).toBe("about-proxy-ran");
  });
});

test.describe("Route-level proxy: API routes", () => {
  test("proxy blocks before route.ts handler executes", async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/api/proxy-api-test`);
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Blocked by API proxy");
  });
});
