import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  return new Response("Blocked by route proxy", { status: 403 });
}
