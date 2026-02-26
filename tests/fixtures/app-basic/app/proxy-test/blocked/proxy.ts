import type { NextRequest } from "next/server";

export function proxy(_request: NextRequest) {
  return new Response("Blocked by route proxy", { status: 403 });
}
