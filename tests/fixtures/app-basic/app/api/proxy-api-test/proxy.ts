import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // Block API requests to test that proxy runs before route handler
  return new Response(
    JSON.stringify({ error: "Blocked by API proxy" }),
    { status: 403, headers: { "Content-Type": "application/json" } },
  );
}
